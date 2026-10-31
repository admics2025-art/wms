/**
 * OmniFlow CRM/WMS - Enterprise Multi-Tenant Firestore Schema
 * Strict TypeScript Definitions
 */

export type TenantRole = 'superadmin' | 'admin' | 'operator' | 'viewer';

export type TenantPlan = 'starter' | 'growth' | 'enterprise';
export type TenantStatus = 'active' | 'trialing' | 'past_due' | 'suspended' | 'canceled';

export interface TenantWhatsAppConfig {
  provider: 'evolution_api' | 'z_api';
  baseUrl: string;
  instanceName: string;
  apiKey: string;
  webhookSecret: string;
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'qr_ready';
  phoneConnected?: string;
  updatedAt: string;
}

export interface TenantSettings {
  currency: 'BRL' | 'USD' | 'EUR';
  timezone: string;
  orderNumberPrefix: string;
  nextOrderSequence: number;
  allowNegativeStock: boolean;
  autoSendOrderPdfOnWhatsApp: boolean;
  taxRateDefaultPercentage: number;
}

/**
 * Collection: `tenants/{companyId}`
 */
export interface Tenant {
  id: string;
  name: string;
  tradeName: string;
  documentNumber: string; // CNPJ / Tax ID
  email: string;
  phone: string;
  logoUrl?: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  plan: TenantPlan;
  status: TenantStatus;
  whatsappConfig?: TenantWhatsAppConfig;
  settings: TenantSettings;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

/**
 * Collection: `users/{uid}`
 */
export interface UserProfile {
  uid: string;
  companyId: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phone?: string;
  role: TenantRole;
  department?: 'sales' | 'support' | 'warehouse' | 'management' | 'finance';
  isActive: boolean;
  isOnlineOnChat: boolean;
  assignedActiveChatsCount: number;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type CustomerStatus = 'lead' | 'prospect' | 'active' | 'churned' | 'blocked';
export type CustomerType = 'b2b' | 'b2c';

/**
 * Collection: `customers/{customerId}`
 */
export interface Customer {
  id: string;
  companyId: string;
  type: CustomerType;
  name: string;
  tradeName?: string;
  documentNumber: string; // CPF ou CNPJ
  stateRegistration?: string; // Inscrição Estadual
  email: string;
  phone: string;
  whatsappJid: string; // Ex: "5511999999999@s.whatsapp.net"
  status: CustomerStatus;
  tags: string[];
  assignedUserId?: string;
  assignedUserName?: string;
  creditLimitCents: number;
  totalSpentCents: number;
  ordersCount: number;
  lastOrderDate?: string;
  billingAddress: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  shippingAddress?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type UnitOfMeasure = 'UN' | 'KG' | 'MT' | 'LT' | 'CX' | 'PC' | 'HR';

export interface WarehouseLocation {
  warehouseCode: string;
  aisle: string; // Corredor
  rack: string;  // Estante
  shelf: string; // Prateleira
  bin: string;   // Posição/Gaveta
}

/**
 * Collection: `inventory/{itemId}`
 */
export interface InventoryItem {
  id: string;
  companyId: string;
  sku: string;
  barcode?: string; // EAN-13 / DUN-14
  name: string;
  description?: string;
  category: string;
  brand?: string;
  unit: UnitOfMeasure;
  quantityOnHand: number;      // Estoque físico total
  quantityReserved: number;    // Reservado em OS/Pedidos abertos
  quantityAvailable: number;   // Disponível real (OnHand - Reserved)
  reorderPoint: number;        // Estoque mínimo de alerta
  reorderQuantity: number;     // Lote econômico de reposição
  costPriceCents: number;      // Preço de custo em centavos
  salePriceCents: number;      // Preço de venda em centavos
  weightGrams?: number;
  location: WarehouseLocation;
  batchNumber?: string;
  expirationDate?: string;
  isActive: boolean;
  lastStockMovementAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type OrderType = 'service_order' | 'sales_order' | 'quote';
export type OrderStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'in_picking'
  | 'in_progress'
  | 'completed'
  | 'invoiced'
  | 'canceled';

export type OrderPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface OrderLineItem {
  id: string;
  itemType: 'product' | 'service';
  inventoryItemId?: string;
  sku: string;
  name: string;
  description?: string;
  unit: UnitOfMeasure;
  quantity: number;
  unitPriceCents: number;
  discountCents: number;
  taxCents: number;
  subtotalCents: number; // (quantity * unitPriceCents) - discountCents + taxCents
  warehouseBinLocation?: string;
}

export interface OrderPaymentInfo {
  method: 'pix' | 'boleto' | 'credit_card' | 'bank_transfer' | 'cash' | 'net_terms';
  installments: number;
  dueDate: string;
  paymentStatus: 'pending' | 'partial' | 'paid' | 'overdue' | 'refunded';
  paidAmountCents: number;
}

/**
 * Collection: `orders/{orderId}`
 */
export interface Order {
  id: string;
  companyId: string;
  orderNumber: string; // Ex: "OS-2026-000142"
  type: OrderType;
  status: OrderStatus;
  priority: OrderPriority;
  customerId: string;
  customerSnapshot: {
    name: string;
    documentNumber: string;
    email: string;
    phone: string;
    whatsappJid: string;
    addressSummary: string;
  };
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  salespersonId: string;
  salespersonName: string;
  equipmentOrAssetDetails?: {
    serialNumber?: string;
    model?: string;
    brand?: string;
    reportedDefect?: string;
    technicalDiagnosis?: string;
    solutionApplied?: string;
  };
  items: OrderLineItem[];
  financials: {
    itemsSubtotalCents: number;
    servicesSubtotalCents: number;
    shippingCents: number;
    discountTotalCents: number;
    taxTotalCents: number;
    grandTotalCents: number;
  };
  payment: OrderPaymentInfo;
  pdfDocument?: {
    storagePath: string;
    signedUrl?: string;
    generatedAt: string;
    lastSentViaWhatsAppAt?: string;
  };
  scheduledFor?: string;
  completedAt?: string;
  customerSignatureUrl?: string;
  internalNotes?: string;
  customerVisibleNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export type WhatsAppChatStatus = 'bot_triage' | 'queued' | 'open' | 'pending_customer' | 'resolved';

/**
 * Collection: `whatsapp_chats/{chatId}`
 */
export interface WhatsAppChat {
  id: string;
  companyId: string;
  remoteJid: string; // "5511999999999@s.whatsapp.net"
  customerPhone: string;
  customerName: string;
  customerAvatarUrl?: string;
  customerId?: string; // Vinculado ao documento em `customers`
  activeOrderId?: string; // OS ativa vinculada ao atendimento
  status: WhatsAppChatStatus;
  department: 'sales' | 'support' | 'warehouse' | 'finance' | 'general';
  assignedToUserId?: string;
  assignedToUserName?: string;
  unreadCount: number;
  lastMessagePreview: string;
  lastMessageAt: string;
  lastMessageDirection: 'inbound' | 'outbound';
  tags: string[];
  isPinned: boolean;
  windowExpiresAt?: string; // Controle de janela de 24h Meta/WhatsApp
  createdAt: string;
  updatedAt: string;
}

export type WhatsAppMessageType = 'text' | 'image' | 'document' | 'audio' | 'video' | 'template' | 'system_event';
export type WhatsAppDeliveryStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

/**
 * Collection: `whatsapp_messages/{messageId}`
 */
export interface WhatsAppMessage {
  id: string;
  companyId: string;
  chatId: string;
  remoteJid: string;
  providerMessageId: string; // ID retornado pela Evolution API / Z-API
  direction: 'inbound' | 'outbound';
  type: WhatsAppMessageType;
  body: string;
  media?: {
    url: string;
    storagePath?: string;
    mimeType: string;
    fileName?: string;
    fileSizeBytes?: number;
    caption?: string;
  };
  quotedMessageId?: string;
  senderUserId?: string; // Preenchido se outbound enviado por um atendente
  senderUserName?: string;
  deliveryStatus: WhatsAppDeliveryStatus;
  errorDetails?: string;
  relatedOrderId?: string;
  createdAt: string;
}

export type AuditActionType =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'STATUS_CHANGE'
  | 'STOCK_ADJUSTMENT'
  | 'PDF_GENERATED'
  | 'WHATSAPP_PDF_SENT'
  | 'AUTH_CLAIM_UPDATE'
  | 'EXPORT_DATA';

export type AuditEntityType =
  | 'tenant'
  | 'user'
  | 'customer'
  | 'inventory'
  | 'order'
  | 'whatsapp_chat'
  | 'whatsapp_message';

export interface AuditFieldDiff {
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  changedKeys: string[];
}

/**
 * Collection: `audit_logs/{logId}` (Imutável: Create-only)
 */
export interface AuditLog {
  id: string;
  companyId: string;
  userId: string;
  userName: string;
  userRole?: TenantRole;
  action: AuditActionType;
  entity: AuditEntityType;
  entityId: string;
  ipAddress: string;
  userAgent?: string;
  diff: AuditFieldDiff;
  metadata?: Record<string, string | number | boolean | null>;
  timestamp: string; // ISO 8601
}

