import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { adminAuth } from '../config/firebase-admin';
import { recordAuditLog } from '../services/audit.service';
import { UserProfile } from '../types/database';

/**
 * Cloud Function Trigger: Sincroniza automaticamente `companyId` e `role`
 * nas Custom Claims do token JWT do Firebase Auth sempre que `users/{userId}` for criado ou atualizado.
 */
export const syncUserTenantClaims = onDocumentWritten(
  'users/{userId}',
  async (event) => {
    const userId = event.params.userId;
    const beforeData = event.data?.before.data() as UserProfile | undefined;
    const afterData = event.data?.after.data() as UserProfile | undefined;

    if (!afterData) {
      return;
    }

    const claimsChanged =
      !beforeData ||
      beforeData.companyId !== afterData.companyId ||
      beforeData.role !== afterData.role ||
      beforeData.isActive !== afterData.isActive;

    if (!claimsChanged) {
      return;
    }

    await adminAuth.setCustomUserClaims(userId, {
      companyId: afterData.companyId,
      role: afterData.role,
      isActive: afterData.isActive,
    });

    await recordAuditLog({
      companyId: afterData.companyId,
      userId: 'system_cloud_function',
      userName: 'Firebase Auth Claim Sync',
      userRole: 'superadmin',
      action: 'AUTH_CLAIM_UPDATE',
      entity: 'user',
      entityId: userId,
      ipAddress: '127.0.0.1',
      before: beforeData
        ? { companyId: beforeData.companyId, role: beforeData.role }
        : null,
      after: { companyId: afterData.companyId, role: afterData.role },
    });
  }
);

