import { App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { Auth, getAuth } from 'firebase-admin/auth';
import { Firestore, getFirestore } from 'firebase-admin/firestore';
import { Storage, getStorage } from 'firebase-admin/storage';
import { TenantRole } from '@/types/database';

interface FirebaseAdminConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
  storageBucket: string;
}

function getFirebaseAdminConfig(): FirebaseAdminConfig {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

  if (!projectId || !clientEmail || !rawPrivateKey || !storageBucket) {
    throw new Error(
      '[FirebaseAdmin] Variáveis de ambiente obrigatórias ausentes: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY ou FIREBASE_STORAGE_BUCKET.'
    );
  }

  return {
    projectId,
    clientEmail,
    // Corrige quebras de linha escapadas em variáveis de ambiente (.env / GitHub Secrets)
    privateKey: rawPrivateKey.replace(/\\n/g, '\n'),
    storageBucket,
  };
}

function createFirebaseAdminApp(): App {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    return existingApps[0]!;
  }

  const config = getFirebaseAdminConfig();

  return initializeApp({
    credential: cert({
      projectId: config.projectId,
      clientEmail: config.clientEmail,
      privateKey: config.privateKey,
    }),
    storageBucket: config.storageBucket,
  });
}

const adminApp: App = createFirebaseAdminApp();

export const adminAuth: Auth = getAuth(adminApp);
export const adminDb: Firestore = getFirestore(adminApp);
export const adminStorage: Storage = getStorage(adminApp);

export interface AuthenticatedTenantUser {
  uid: string;
  email: string;
  name: string;
  companyId: string;
  role: TenantRole;
}

/**
 * Valida o Bearer Token JWT enviado na requisição HTTP e extrai os Custom Claims (`companyId` e `role`).
 */
export async function verifyTenantRequestAuth(
  authorizationHeader: string | null
): Promise<AuthenticatedTenantUser> {
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    throw new Error('UNAUTHORIZED: Token de autenticação Bearer ausente ou malformado.');
  }

  const idToken = authorizationHeader.replace('Bearer ', '').trim();
  if (!idToken) {
    throw new Error('UNAUTHORIZED: Token JWT vazio.');
  }

  const decodedToken = await adminAuth.verifyIdToken(idToken, true);

  const companyId = decodedToken.companyId as string | undefined;
  const role = decodedToken.role as TenantRole | undefined;

  if (!companyId || typeof companyId !== 'string') {
    throw new Error('FORBIDDEN: Usuário não possui Custom Claim `companyId` vinculado a um Tenant válido.');
  }

  const validRoles: TenantRole[] = ['superadmin', 'admin', 'operator', 'viewer'];
  if (!role || !validRoles.includes(role)) {
    throw new Error('FORBIDDEN: Usuário não possui um `role` válido nas Custom Claims.');
  }

  return {
    uid: decodedToken.uid,
    email: decodedToken.email ?? '',
    name: (decodedToken.name as string | undefined) ?? decodedToken.email ?? 'Usuário',
    companyId,
    role,
  };
}

