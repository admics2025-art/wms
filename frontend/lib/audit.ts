import { adminDb } from '@/lib/firebase/admin';
import {
  AuditActionType,
  AuditEntityType,
  AuditFieldDiff,
  AuditLog,
  TenantRole,
} from '@/types/database';

export interface LogActivityParams {
  companyId: string;
  userId: string;
  userName: string;
  userRole?: TenantRole;
  action: AuditActionType;
  entity: AuditEntityType;
  entityId: string;
  ipAddress: string;
  userAgent?: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  metadata?: Record<string, string | number | boolean | null>;
}

const SENSITIVE_KEYS = new Set([
  'password',
  'apiKey',
  'webhookSecret',
  'privateKey',
  'token',
  'accessToken',
  'refreshToken',
]);

/**
 * Remove recursivamente chaves sensíveis e valores `undefined` (incompatíveis com Firestore)
 */
function sanitizeRecord(
  obj: Record<string, unknown> | null | undefined
): Record<string, unknown> | null {
  if (!obj || typeof obj !== 'object') {
    return null;
  }

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;

    if (SENSITIVE_KEYS.has(key)) {
      sanitized[key] = '[REDACTED]';
    } else if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      !(value instanceof Date)
    ) {
      sanitized[key] = sanitizeRecord(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Calcula o diff estruturado entre o estado anterior (`before`) e posterior (`after`)
 */
export function computeAuditDiff(
  before?: Record<string, unknown> | null,
  after?: Record<string, unknown> | null
): AuditFieldDiff {
  const cleanBefore = sanitizeRecord(before);
  const cleanAfter = sanitizeRecord(after);

  if (!cleanBefore && !cleanAfter) {
    return { before: null, after: null, changedKeys: [] };
  }

  if (!cleanBefore && cleanAfter) {
    return {
      before: null,
      after: cleanAfter,
      changedKeys: Object.keys(cleanAfter),
    };
  }

  if (cleanBefore && !cleanAfter) {
    return {
      before: cleanBefore,
      after: null,
      changedKeys: Object.keys(cleanBefore),
    };
  }

  const allKeys = new Set([
    ...Object.keys(cleanBefore!),
    ...Object.keys(cleanAfter!),
  ]);

  const diffBefore: Record<string, unknown> = {};
  const diffAfter: Record<string, unknown> = {};
  const changedKeys: string[] = [];

  for (const key of allKeys) {
    const valBefore = cleanBefore![key];
    const valAfter = cleanAfter![key];

    if (JSON.stringify(valBefore) !== JSON.stringify(valAfter)) {
      changedKeys.push(key);
      diffBefore[key] = valBefore ?? null;
      diffAfter[key] = valAfter ?? null;
    }
  }

  return {
    before: changedKeys.length > 0 ? diffBefore : null,
    after: changedKeys.length > 0 ? diffAfter : null,
    changedKeys,
  };
}

/**
 * Extrai o IP real do cliente a partir dos headers da Request (Vercel / Cloudflare / Reverse Proxy)
 */
export function extractClientIp(headers: Headers): string {
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0]?.trim();
    if (firstIp) return firstIp;
  }

  const realIp = headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  const cfConnectingIp = headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp.trim();

  return '127.0.0.1';
}

/**
 * Registra um evento imutável na coleção `audit_logs` do Firestore.
 */
export async function logActivity(params: LogActivityParams): Promise<AuditLog> {
  const docRef = adminDb.collection('audit_logs').doc();
  const diff = computeAuditDiff(params.before, params.after);
  const timestamp = new Date().toISOString();

  const auditEntry: AuditLog = {
    id: docRef.id,
    companyId: params.companyId,
    userId: params.userId,
    userName: params.userName,
    ...(params.userRole ? { userRole: params.userRole } : {}),
    action: params.action,
    entity: params.entity,
    entityId: params.entityId,
    ipAddress: params.ipAddress || '0.0.0.0',
    ...(params.userAgent ? { userAgent: params.userAgent } : {}),
    diff,
    ...(params.metadata ? { metadata: params.metadata } : {}),
    timestamp,
  };

  await docRef.set(auditEntry);

  return auditEntry;
}

