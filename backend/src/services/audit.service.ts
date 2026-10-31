import { adminDb } from '../config/firebase-admin';
import {
  AuditActionType,
  AuditEntityType,
  AuditFieldDiff,
  AuditLog,
  TenantRole,
} from '../types/database';

export interface BackendLogActivityParams {
  companyId: string;
  userId: string;
  userName: string;
  userRole?: TenantRole;
  action: AuditActionType;
  entity: AuditEntityType;
  entityId: string;
  ipAddress: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  metadata?: Record<string, string | number | boolean | null>;
}

export function computeBackendDiff(
  before?: Record<string, unknown> | null,
  after?: Record<string, unknown> | null
): AuditFieldDiff {
  if (!before && !after) {
    return { before: null, after: null, changedKeys: [] };
  }
  if (!before && after) {
    return { before: null, after, changedKeys: Object.keys(after) };
  }
  if (before && !after) {
    return { before, after: null, changedKeys: Object.keys(before) };
  }

  const keys = new Set([...Object.keys(before!), ...Object.keys(after!)]);
  const diffBefore: Record<string, unknown> = {};
  const diffAfter: Record<string, unknown> = {};
  const changedKeys: string[] = [];

  for (const key of keys) {
    if (JSON.stringify(before![key]) !== JSON.stringify(after![key])) {
      changedKeys.push(key);
      diffBefore[key] = before![key] ?? null;
      diffAfter[key] = after![key] ?? null;
    }
  }

  return {
    before: changedKeys.length > 0 ? diffBefore : null,
    after: changedKeys.length > 0 ? diffAfter : null,
    changedKeys,
  };
}

export async function recordAuditLog(
  params: BackendLogActivityParams
): Promise<AuditLog> {
  const ref = adminDb.collection('audit_logs').doc();
  const entry: AuditLog = {
    id: ref.id,
    companyId: params.companyId,
    userId: params.userId,
    userName: params.userName,
    ...(params.userRole ? { userRole: params.userRole } : {}),
    action: params.action,
    entity: params.entity,
    entityId: params.entityId,
    ipAddress: params.ipAddress,
    diff: computeBackendDiff(params.before, params.after),
    ...(params.metadata ? { metadata: params.metadata } : {}),
    timestamp: new Date().toISOString(),
  };

  await ref.set(entry);
  return entry;
}

