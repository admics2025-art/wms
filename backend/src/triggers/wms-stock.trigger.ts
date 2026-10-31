import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { adminDb } from '../config/firebase-admin';
import { recordAuditLog } from '../services/audit.service';
import { InventoryItem, Order } from '../types/database';

/**
 * Cloud Function Trigger: Quando uma Ordem de Serviço (`orders/{orderId}`) muda de status:
 * - De `pending_approval` -> `approved`: Reserva o estoque (`quantityReserved`) no WMS.
 * - Para `completed` / `invoiced`: Baixa definitivamente o estoque físico (`quantityOnHand`) no WMS.
 */
export const onOrderStatusStockSync = onDocumentUpdated(
  'orders/{orderId}',
  async (event) => {
    const beforeOrder = event.data?.before.data() as Order | undefined;
    const afterOrder = event.data?.after.data() as Order | undefined;

    if (!beforeOrder || !afterOrder || beforeOrder.status === afterOrder.status) {
      return;
    }

    const productItems = afterOrder.items.filter(
      (item) => item.itemType === 'product' && item.inventoryItemId
    );

    if (productItems.length === 0) {
      return;
    }

    // Reserva de estoque ao aprovar OS
    if (beforeOrder.status !== 'approved' && afterOrder.status === 'approved') {
      for (const line of productItems) {
        const invRef = adminDb
          .collection('inventory')
          .doc(line.inventoryItemId!);

        await adminDb.runTransaction(async (tx) => {
          const snap = await tx.get(invRef);
          if (!snap.exists) return;

          const inv = snap.data() as InventoryItem;
          if (inv.companyId !== afterOrder.companyId) return;

          const newReserved = inv.quantityReserved + line.quantity;
          const newAvailable = inv.quantityOnHand - newReserved;

          tx.update(invRef, {
            quantityReserved: newReserved,
            quantityAvailable: newAvailable,
            lastStockMovementAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

          await recordAuditLog({
            companyId: afterOrder.companyId,
            userId: afterOrder.salespersonId,
            userName: afterOrder.salespersonName,
            action: 'STOCK_ADJUSTMENT',
            entity: 'inventory',
            entityId: inv.id,
            ipAddress: '127.0.0.1',
            before: {
              quantityReserved: inv.quantityReserved,
              quantityAvailable: inv.quantityAvailable,
            },
            after: {
              quantityReserved: newReserved,
              quantityAvailable: newAvailable,
            },
            metadata: {
              reason: `Reserva automática pela aprovação da ${afterOrder.orderNumber}`,
            },
          });
        });
      }
    }
  }
);

