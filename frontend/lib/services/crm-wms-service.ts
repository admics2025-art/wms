import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore';
import { clientDb, isFirebaseConfigured } from '@/lib/firebase/client';
import {
  Customer,
  InventoryItem,
  Order,
  WhatsAppChat,
  WhatsAppMessage,
  AuditLog,
} from '@/types/database';

export interface CrmPipelineDeal {
  id: string;
  companyId: string;
  title: string;
  customerName: string;
  customerDocument: string;
  contactName: string;
  contactPhone: string;
  valueCents: number;
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won';
  priority: 'normal' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEYS = {
  deals: 'omniflow_real_deals_v1',
  customers: 'omniflow_real_customers_v1',
  inventory: 'omniflow_real_inventory_v1',
  orders: 'omniflow_real_orders_v1',
  chats: 'omniflow_real_chats_v1',
  messages: 'omniflow_real_messages_v1',
  audits: 'omniflow_real_audits_v1',
} as const;

export function loadPersistedCollection<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

export function savePersistedCollection<T>(key: string, items: T[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(items));
}

export function subscribeTenantCollection<T extends { id: string }>(
  collectionName: string,
  localStorageKey: string,
  companyId: string,
  orderField: string,
  onData: (items: T[]) => void
): Unsubscribe {
  if (isFirebaseConfigured && clientDb) {
    const q = query(
      collection(clientDb, collectionName),
      where('companyId', '==', companyId),
      orderBy(orderField, 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map((d) => ({
        ...(d.data() as T),
        id: d.id,
      }));
      onData(records);
    });
  }

  // Persistência local real no navegador caso variáveis Firebase ainda não estejam no .env
  const initial = loadPersistedCollection<T>(localStorageKey);
  onData(initial);

  const handler = (e: StorageEvent) => {
    if (e.key === localStorageKey) {
      onData(loadPersistedCollection<T>(localStorageKey));
    }
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}

export async function upsertDocument<T extends { id: string }>(
  collectionName: string,
  localStorageKey: string,
  record: T
): Promise<T> {
  if (isFirebaseConfigured && clientDb) {
    await setDoc(doc(clientDb, collectionName, record.id), record, {
      merge: true,
    });
    return record;
  }

  const current = loadPersistedCollection<T>(localStorageKey);
  const exists = current.some((i) => i.id === record.id);
  const next = exists
    ? current.map((i) => (i.id === record.id ? record : i))
    : [record, ...current];
  savePersistedCollection(localStorageKey, next);
  return record;
}

export async function removeDocument<T extends { id: string }>(
  collectionName: string,
  localStorageKey: string,
  id: string
): Promise<void> {
  if (isFirebaseConfigured && clientDb) {
    await deleteDoc(doc(clientDb, collectionName, id));
    return;
  }

  const current = loadPersistedCollection<T>(localStorageKey);
  savePersistedCollection(
    localStorageKey,
    current.filter((i) => i.id !== id)
  );
}

export { STORAGE_KEYS };
