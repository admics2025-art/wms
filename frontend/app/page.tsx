'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard,
  Kanban,
  Users,
  ClipboardList,
  Package,
  MessageSquare,
  ShieldCheck,
  Plus,
  Trash2,
  Cpu,
  Activity,
  Database,
  Layers,
  FileText,
  ArrowRight,
  Lock,
} from 'lucide-react';
import WhatsAppChatLayout from '@/components/whatsapp/chat-layout';
import {
  CrmPipelineDeal,
  STORAGE_KEYS,
  loadPersistedCollection,
  upsertDocument,
  removeDocument,
} from '@/lib/services/crm-wms-service';
import {
  AuditLog,
  Customer,
  InventoryItem,
  Order,
  TenantRole,
  WhatsAppChat,
  WhatsAppMessage,
} from '@/types/database';

type ActiveModule =
  | 'dashboard'
  | 'pipeline'
  | 'customers'
  | 'orders'
  | 'wms'
  | 'whatsapp'
  | 'audit';

function formatBrlFromCents(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}

export default function OmniFlowCrmEnterpriseApp() {
  const [activeModule, setActiveModule] = useState<ActiveModule>('dashboard');
  const [companyId, setCompanyId] = useState<string>('tenant_production_01');
  const [operatorName, setOperatorName] = useState<string>('Operador Master');
  const [userRole, setUserRole] = useState<TenantRole>('admin');

  // Coleções reais persistidas (iniciam vazias — sem dados fictícios)
  const [deals, setDeals] = useState<CrmPipelineDeal[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [chats, setChats] = useState<WhatsAppChat[]>([]);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Modais de criação real
  const [modalType, setModalType] = useState<
    null | 'deal' | 'customer' | 'inventory' | 'order'
  >(null);

  // Campos de formulário: Oportunidade Kanban
  const [dealTitle, setDealTitle] = useState('');
  const [dealCustomerName, setDealCustomerName] = useState('');
  const [dealContact, setDealContact] = useState('');
  const [dealValueReais, setDealValueReais] = useState('');

  // Campos de formulário: Cliente B2B
  const [custName, setCustName] = useState('');
  const [custDoc, setCustDoc] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custCreditReais, setCustCreditReais] = useState('');

  // Campos de formulário: Produto WMS
  const [skuCode, setSkuCode] = useState('');
  const [skuName, setSkuName] = useState('');
  const [skuAisle, setSkuAisle] = useState('A01');
  const [skuRack, setSkuRack] = useState('R01');
  const [skuBin, setSkuBin] = useState('B01');
  const [skuQty, setSkuQty] = useState('10');
  const [skuPriceReais, setSkuPriceReais] = useState('');

  // Campos de formulário: Ordem de Serviço (OS)
  const [orderCustId, setOrderCustId] = useState('');
  const [orderSkuId, setOrderSkuId] = useState('');
  const [orderQty, setOrderQty] = useState('1');
  const [orderServiceDesc, setOrderServiceDesc] = useState('');
  const [orderServiceReais, setOrderServiceReais] = useState('0');

  useEffect(() => {
    setDeals(loadPersistedCollection<CrmPipelineDeal>(STORAGE_KEYS.deals));
    setCustomers(loadPersistedCollection<Customer>(STORAGE_KEYS.customers));
    setInventory(loadPersistedCollection<InventoryItem>(STORAGE_KEYS.inventory));
    setOrders(loadPersistedCollection<Order>(STORAGE_KEYS.orders));
    setChats(loadPersistedCollection<WhatsAppChat>(STORAGE_KEYS.chats));
    setMessages(loadPersistedCollection<WhatsAppMessage>(STORAGE_KEYS.messages));
    setAuditLogs(loadPersistedCollection<AuditLog>(STORAGE_KEYS.audits));
  }, []);

  async function appendAudit(params: {
    action: AuditLog['action'];
    entity: AuditLog['entity'];
    entityId: string;
    before: Record<string, unknown> | null;
    after: Record<string, unknown> | null;
  }) {
    const entry: AuditLog = {
      id: `aud_${Date.now()}`,
      companyId,
      userId: 'uid_active_operator',
      userName: operatorName,
      userRole,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      ipAddress: '127.0.0.1',
      diff: {
        before: params.before,
        after: params.after,
        changedKeys: Object.keys(params.after || params.before || {}),
      },
      timestamp: new Date().toISOString(),
    };
    await upsertDocument('audit_logs', STORAGE_KEYS.audits, entry);
    setAuditLogs((prev) => [entry, ...prev]);
  }

  // 1. Criar Oportunidade Real no Funil Kanban
  async function handleCreateDeal(e: React.FormEvent) {
    e.preventDefault();
    if (userRole === 'viewer') return;

    const now = new Date().toISOString();
    const valueCents = Math.round(
      (parseFloat(dealValueReais.replace(',', '.')) || 0) * 100
    );

    const newDeal: CrmPipelineDeal = {
      id: `deal_${Date.now()}`,
      companyId,
      title: dealTitle.trim(),
      customerName: dealCustomerName.trim(),
      customerDocument: '',
      contactName: dealContact.trim(),
      contactPhone: '',
      valueCents,
      stage: 'lead',
      priority: 'high',
      createdAt: now,
      updatedAt: now,
    };

    await upsertDocument('crm_deals', STORAGE_KEYS.deals, newDeal);
    setDeals((prev) => [newDeal, ...prev]);
    await appendAudit({
      action: 'CREATE',
      entity: 'customer',
      entityId: newDeal.id,
      before: null,
      after: { title: newDeal.title, valueCents: newDeal.valueCents, stage: 'lead' },
    });

    setDealTitle('');
    setDealCustomerName('');
    setDealContact('');
    setDealValueReais('');
    setModalType(null);
  }

  async function handleMoveDealStage(
    deal: CrmPipelineDeal,
    nextStage: CrmPipelineDeal['stage']
  ) {
    if (userRole === 'viewer') return;
    const updated: CrmPipelineDeal = {
      ...deal,
      stage: nextStage,
      updatedAt: new Date().toISOString(),
    };
    await upsertDocument('crm_deals', STORAGE_KEYS.deals, updated);
    setDeals((prev) => prev.map((d) => (d.id === deal.id ? updated : d)));
    await appendAudit({
      action: 'STATUS_CHANGE',
      entity: 'customer',
      entityId: deal.id,
      before: { stage: deal.stage },
      after: { stage: nextStage },
    });
  }

  async function handleDeleteDeal(id: string) {
    if (userRole === 'viewer') return;
    await removeDocument('crm_deals', STORAGE_KEYS.deals, id);
    setDeals((prev) => prev.filter((d) => d.id !== id));
  }

  // 2. Criar Cliente B2B Real
  async function handleCreateCustomer(e: React.FormEvent) {
    e.preventDefault();
    if (userRole === 'viewer') return;

    const now = new Date().toISOString();
    const creditLimitCents = Math.round(
      (parseFloat(custCreditReais.replace(',', '.')) || 0) * 100
    );
    const digits = custPhone.replace(/\D/g, '');

    const newCustomer: Customer = {
      id: `cust_${Date.now()}`,
      companyId,
      type: 'b2b',
      name: custName.trim(),
      documentNumber: custDoc.trim(),
      email: custEmail.trim(),
      phone: custPhone.trim(),
      whatsappJid: `${digits}@s.whatsapp.net`,
      status: 'active',
      tags: ['B2B'],
      creditLimitCents,
      totalSpentCents: 0,
      ordersCount: 0,
      billingAddress: {
        street: '-',
        number: '-',
        neighborhood: '-',
        city: '-',
        state: 'SP',
        zipCode: '-',
      },
      createdAt: now,
      updatedAt: now,
    };

    await upsertDocument('customers', STORAGE_KEYS.customers, newCustomer);
    setCustomers((prev) => [newCustomer, ...prev]);

    // Cria também o canal de atendimento WhatsApp automaticamente para esse cliente
    const newChat: WhatsAppChat = {
      id: `chat_${Date.now()}`,
      companyId,
      remoteJid: newCustomer.whatsappJid,
      customerPhone: newCustomer.phone,
      customerName: newCustomer.name,
      customerId: newCustomer.id,
      status: 'open',
      department: 'sales',
      assignedToUserName: operatorName,
      unreadCount: 0,
      lastMessagePreview: 'Cliente cadastrado no CRM',
      lastMessageAt: now,
      lastMessageDirection: 'outbound',
      tags: ['B2B'],
      isPinned: false,
      createdAt: now,
      updatedAt: now,
    };
    await upsertDocument('whatsapp_chats', STORAGE_KEYS.chats, newChat);
    setChats((prev) => [newChat, ...prev]);

    await appendAudit({
      action: 'CREATE',
      entity: 'customer',
      entityId: newCustomer.id,
      before: null,
      after: { name: newCustomer.name, documentNumber: newCustomer.documentNumber },
    });

    setCustName('');
    setCustDoc('');
    setCustEmail('');
    setCustPhone('');
    setCustCreditReais('');
    setModalType(null);
  }

  // 3. Criar Produto no Inventário WMS Real
  async function handleCreateInventoryItem(e: React.FormEvent) {
    e.preventDefault();
    if (userRole === 'viewer') return;

    const now = new Date().toISOString();
    const qty = Math.max(0, parseInt(skuQty, 10) || 0);
    const salePriceCents = Math.round(
      (parseFloat(skuPriceReais.replace(',', '.')) || 0) * 100
    );

    const newItem: InventoryItem = {
      id: `inv_${Date.now()}`,
      companyId,
      sku: skuCode.trim().toUpperCase(),
      name: skuName.trim(),
      category: 'Industrial',
      unit: 'UN',
      quantityOnHand: qty,
      quantityReserved: 0,
      quantityAvailable: qty,
      reorderPoint: 5,
      reorderQuantity: 20,
      costPriceCents: Math.round(salePriceCents * 0.6),
      salePriceCents,
      location: {
        warehouseCode: 'WH-01',
        aisle: skuAisle.trim().toUpperCase(),
        rack: skuRack.trim().toUpperCase(),
        shelf: 'S01',
        bin: skuBin.trim().toUpperCase(),
      },
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    await upsertDocument('inventory', STORAGE_KEYS.inventory, newItem);
    setInventory((prev) => [newItem, ...prev]);

    await appendAudit({
      action: 'CREATE',
      entity: 'inventory',
      entityId: newItem.sku,
      before: null,
      after: {
        sku: newItem.sku,
        quantityOnHand: newItem.quantityOnHand,
        bin: `${newItem.location.aisle}-${newItem.location.rack}-${newItem.location.bin}`,
      },
    });

    setSkuCode('');
    setSkuName('');
    setSkuPriceReais('');
    setModalType(null);
  }

  async function handleAdjustStock(item: InventoryItem, delta: number) {
    if (userRole === 'viewer') return;
    const nextOnHand = Math.max(item.quantityReserved, item.quantityOnHand + delta);
    const updated: InventoryItem = {
      ...item,
      quantityOnHand: nextOnHand,
      quantityAvailable: nextOnHand - item.quantityReserved,
      updatedAt: new Date().toISOString(),
    };
    await upsertDocument('inventory', STORAGE_KEYS.inventory, updated);
    setInventory((prev) => prev.map((i) => (i.id === item.id ? updated : i)));

    await appendAudit({
      action: 'STOCK_ADJUSTMENT',
      entity: 'inventory',
      entityId: item.sku,
      before: { quantityOnHand: item.quantityOnHand },
      after: { quantityOnHand: nextOnHand },
    });
  }

  // 4. Emitir Ordem de Serviço (OS) com Reserva Automática no WMS
  async function handleCreateOrder(e: React.FormEvent) {
    e.preventDefault();
    if (userRole === 'viewer') return;

    const customer = customers.find((c) => c.id === orderCustId);
    if (!customer) return;

    const invItem = inventory.find((i) => i.id === orderSkuId);
    const qty = Math.max(1, parseInt(orderQty, 10) || 1);
    const serviceCents = Math.round(
      (parseFloat(orderServiceReais.replace(',', '.')) || 0) * 100
    );

    const items: Order['items'] = [];
    let itemsSubtotalCents = 0;

    if (invItem) {
      const sub = invItem.salePriceCents * qty;
      itemsSubtotalCents += sub;
      items.push({
        id: `line_${Date.now()}_1`,
        itemType: 'product',
        inventoryItemId: invItem.id,
        sku: invItem.sku,
        name: invItem.name,
        unit: invItem.unit,
        quantity: qty,
        unitPriceCents: invItem.salePriceCents,
        discountCents: 0,
        taxCents: 0,
        subtotalCents: sub,
        warehouseBinLocation: `${invItem.location.aisle}-${invItem.location.rack}-${invItem.location.bin}`,
      });

      // Reserva no WMS
      const updatedInv: InventoryItem = {
        ...invItem,
        quantityReserved: invItem.quantityReserved + qty,
        quantityAvailable: invItem.quantityOnHand - (invItem.quantityReserved + qty),
      };
      await upsertDocument('inventory', STORAGE_KEYS.inventory, updatedInv);
      setInventory((prev) =>
        prev.map((i) => (i.id === invItem.id ? updatedInv : i))
      );
    }

    if (serviceCents > 0 || orderServiceDesc.trim()) {
      items.push({
        id: `line_${Date.now()}_2`,
        itemType: 'service',
        sku: 'SRV-TECH',
        name: orderServiceDesc.trim() || 'Serviço Técnico Especializado',
        unit: 'HR',
        quantity: 1,
        unitPriceCents: serviceCents,
        discountCents: 0,
        taxCents: 0,
        subtotalCents: serviceCents,
      });
    }

    const grandTotalCents = itemsSubtotalCents + serviceCents;
    const now = new Date().toISOString();
    const orderNumber = `OS-${new Date().getFullYear()}-${String(
      orders.length + 1
    ).padStart(4, '0')}`;

    const newOrder: Order = {
      id: `ord_${Date.now()}`,
      companyId,
      orderNumber,
      type: 'service_order',
      status: 'in_picking',
      priority: 'high',
      customerId: customer.id,
      customerSnapshot: {
        name: customer.name,
        documentNumber: customer.documentNumber,
        email: customer.email,
        phone: customer.phone,
        whatsappJid: customer.whatsappJid,
        addressSummary: customer.billingAddress.city,
      },
      salespersonId: 'uid_active_operator',
      salespersonName: operatorName,
      items,
      financials: {
        itemsSubtotalCents,
        servicesSubtotalCents: serviceCents,
        shippingCents: 0,
        discountTotalCents: 0,
        taxTotalCents: 0,
        grandTotalCents,
      },
      payment: {
        method: 'pix',
        installments: 1,
        dueDate: now,
        paymentStatus: 'pending',
        paidAmountCents: 0,
      },
      createdAt: now,
      updatedAt: now,
    };

    await upsertDocument('orders', STORAGE_KEYS.orders, newOrder);
    setOrders((prev) => [newOrder, ...prev]);

    await appendAudit({
      action: 'CREATE',
      entity: 'order',
      entityId: newOrder.orderNumber,
      before: null,
      after: {
        orderNumber: newOrder.orderNumber,
        customer: customer.name,
        grandTotalCents,
      },
    });

    setOrderServiceDesc('');
    setOrderServiceReais('0');
    setModalType(null);
  }

  // Maps auxiliares para a Central WhatsApp
  const customersById = useMemo(() => {
    const map: Record<string, Customer> = {};
    for (const c of customers) map[c.id] = c;
    return map;
  }, [customers]);

  const ordersByCustomerId = useMemo(() => {
    const map: Record<string, Order[]> = {};
    for (const o of orders) {
      if (!map[o.customerId]) map[o.customerId] = [];
      map[o.customerId]!.push(o);
    }
    return map;
  }, [orders]);

  const messagesByChatId = useMemo(() => {
    const map: Record<string, WhatsAppMessage[]> = {};
    for (const m of messages) {
      if (!map[m.chatId]) map[m.chatId] = [];
      map[m.chatId]!.push(m);
    }
    return map;
  }, [messages]);

  const totalPipelineCents = useMemo(
    () => deals.reduce((acc, d) => acc + d.valueCents, 0),
    [deals]
  );

  const totalInventoryUnits = useMemo(
    () => inventory.reduce((acc, i) => acc + i.quantityOnHand, 0),
    [inventory]
  );

  return (
    <div className="flex min-h-screen bg-[#03060c] text-slate-100 selection:bg-cyan-500 selection:text-slate-950">
      {/* =====================================================================
          SIDEBAR FUTURISTA (CYBER-ENTERPRISE GLASSMORPHISM)
      ===================================================================== */}
      <aside className="flex w-68 shrink-0 flex-col border-r border-white/10 bg-[#050811]/95 backdrop-blur-2xl">
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-600 font-black text-slate-950 shadow-[0_0_25px_rgba(6,182,212,0.5)]">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-wider text-white uppercase">
              OMNIFLOW <span className="text-cyan-400">OS</span>
            </h1>
            <p className="font-mono text-xs text-slate-400">
              Multi-Tenant Engine
            </p>
          </div>
        </div>

        {/* Seletor de Tenant Real */}
        <div className="border-b border-white/10 p-3.5 space-y-2 bg-white/[0.02]">
          <label className="block font-mono text-xs uppercase text-cyan-400">
            Workspace / Company ID
          </label>
          <input
            type="text"
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-[#03060c] px-2.5 py-1.5 font-mono text-xs text-white focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <nav className="flex-1 space-y-1 p-3">
          <p className="px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-widest text-slate-500">
            Core CRM
          </p>

          {[
            { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
            {
              id: 'pipeline',
              label: 'Pipeline Kanban',
              icon: Kanban,
              count: deals.length,
            },
            {
              id: 'customers',
              label: 'Contas B2B / CRM',
              icon: Users,
              count: customers.length,
            },
            {
              id: 'whatsapp',
              label: 'WhatsApp Neural Hub',
              icon: MessageSquare,
              count: chats.length,
            },
          ].map((item) => {
            const Icon = item.icon;
            const active = activeModule === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveModule(item.id as ActiveModule)}
                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                  active
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/10 text-cyan-300 border border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon
                    className={`h-4 w-4 ${
                      active ? 'text-cyan-400' : 'text-slate-500'
                    }`}
                  />
                  {item.label}
                </span>
                {typeof item.count === 'number' && (
                  <span className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-xs text-cyan-300 border border-white/10">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}

          <p className="mt-6 px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-widest text-slate-500">
            WMS & Segurança
          </p>

          {[
            {
              id: 'orders',
              label: 'Ordens de Serviço (OS)',
              icon: ClipboardList,
              count: orders.length,
            },
            {
              id: 'wms',
              label: 'Inventário WMS',
              icon: Package,
              count: inventory.length,
            },
            {
              id: 'audit',
              label: 'Audit Trail Imutável',
              icon: ShieldCheck,
              count: auditLogs.length,
            },
          ].map((item) => {
            const Icon = item.icon;
            const active = activeModule === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveModule(item.id as ActiveModule)}
                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                  active
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/10 text-cyan-300 border border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon
                    className={`h-4 w-4 ${
                      active ? 'text-cyan-400' : 'text-slate-500'
                    }`}
                  />
                  {item.label}
                </span>
                {typeof item.count === 'number' && (
                  <span className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-xs text-cyan-300 border border-white/10">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Controle de Operador e RBAC */}
        <div className="border-t border-white/10 p-4 space-y-2.5 bg-white/[0.01]">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-slate-400 flex items-center gap-1">
              <Lock className="h-3 w-3 text-cyan-400" /> RBAC Claim:
            </span>
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value as TenantRole)}
              className="rounded-lg border border-white/10 bg-[#03060c] px-2 py-1 font-mono text-xs text-cyan-300"
            >
              <option value="admin">admin</option>
              <option value="operator">operator</option>
              <option value="viewer">viewer</option>
            </select>
          </div>
          <input
            type="text"
            value={operatorName}
            onChange={(e) => setOperatorName(e.target.value)}
            placeholder="Seu Nome de Operador"
            className="w-full rounded-lg border border-white/10 bg-[#03060c] px-2.5 py-1.5 text-xs text-white"
          />
        </div>
      </aside>

      {/* =====================================================================
          CONTEÚDO PRINCIPAL
      ===================================================================== */}
      <div className="flex flex-1 flex-col overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_rgba(6,182,212,0.12),_transparent_55%),radial-gradient(ellipse_at_bottom_left,_rgba(79,70,229,0.1),_transparent_55%)]">
        {/* Topbar */}
        <header className="flex h-16 items-center justify-between border-b border-white/10 bg-[#050811]/80 px-6 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <Activity className="h-4 w-4 text-cyan-400" />
            <h2 className="text-sm font-bold tracking-wide text-white uppercase">
              {activeModule === 'dashboard' && 'Command Center // Telemetria em Tempo Real'}
              {activeModule === 'pipeline' && 'Pipeline Comercial // Funil Kanban'}
              {activeModule === 'customers' && 'Base de Contas B2B // CRM'}
              {activeModule === 'orders' && 'Ordens de Serviço // Motor React-PDF'}
              {activeModule === 'wms' && 'Inventário WMS // Endereçamento Físico'}
              {activeModule === 'whatsapp' && 'Central WhatsApp // Multi-Atendente'}
              {activeModule === 'audit' && 'Audit Logs // Trilha Imutável'}
            </h2>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setModalType('customer')}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-white/10 transition"
            >
              + Cliente B2B
            </button>
            <button
              type="button"
              onClick={() => setModalType('inventory')}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-white/10 transition"
            >
              + SKU Estoque
            </button>
            <button
              type="button"
              onClick={() => setModalType('order')}
              className="rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-3 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-500/25 transition"
            >
              + Emitir OS
            </button>
            <button
              type="button"
              onClick={() => setModalType('deal')}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-[0_0_20px_rgba(6,182,212,0.35)] hover:opacity-95 transition"
            >
              <Plus className="h-4 w-4" />
              Nova Oportunidade
            </button>
          </div>
        </header>

        {/* Área Dinâmica */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* 1. COMMAND CENTER (DASHBOARD) */}
          {activeModule === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-[#070b16]/90 p-5 shadow-lg">
                  <span className="font-mono text-xs uppercase text-slate-400">
                    Volume no Pipeline
                  </span>
                  <p className="mt-2 font-mono text-2xl font-black text-cyan-400">
                    {formatBrlFromCents(totalPipelineCents)}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {deals.length} negociações registradas
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#070b16]/90 p-5 shadow-lg">
                  <span className="font-mono text-xs uppercase text-slate-400">
                    Contas B2B Ativas
                  </span>
                  <p className="mt-2 font-mono text-2xl font-black text-white">
                    {customers.length}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Isolamento por <code className="text-cyan-400">{companyId}</code>
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#070b16]/90 p-5 shadow-lg">
                  <span className="font-mono text-xs uppercase text-slate-400">
                    Ordens de Serviço
                  </span>
                  <p className="mt-2 font-mono text-2xl font-black text-emerald-400">
                    {orders.length}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Prontas para compilação PDF
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#070b16]/90 p-5 shadow-lg">
                  <span className="font-mono text-xs uppercase text-slate-400">
                    Unidades no WMS
                  </span>
                  <p className="mt-2 font-mono text-2xl font-black text-indigo-400">
                    {totalInventoryUnits} UN
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {inventory.length} SKUs cadastrados
                  </p>
                </div>
              </div>

              {/* Guia de Operação Real */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-[#070b16]/90 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">
                      Negociações Reais Cadastradas ({deals.length})
                    </h3>
                    <button
                      type="button"
                      onClick={() => setModalType('deal')}
                      className="text-xs font-bold text-cyan-400 hover:underline"
                    >
                      + Adicionar Oportunidade
                    </button>
                  </div>

                  {deals.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/10 p-8 text-center space-y-3">
                      <Database className="mx-auto h-8 w-8 text-cyan-400/50" />
                      <p className="text-xs text-slate-400">
                        Nenhum dado fictício carregado. O banco está limpo e pronto para seus registros reais.
                      </p>
                      <button
                        type="button"
                        onClick={() => setModalType('deal')}
                        className="rounded-xl bg-cyan-500/20 border border-cyan-500/40 px-4 py-2 text-xs font-bold text-cyan-300"
                      >
                        Criar Primeira Oportunidade
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/10">
                      {deals.map((d) => (
                        <div
                          key={d.id}
                          className="flex items-center justify-between py-3 text-xs"
                        >
                          <div>
                            <p className="font-bold text-white">{d.title}</p>
                            <p className="text-slate-400">
                              {d.customerName} • Contato: {d.contactName}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-emerald-400">
                              {formatBrlFromCents(d.valueCents)}
                            </span>
                            <span className="rounded bg-white/5 px-2 py-0.5 font-mono uppercase text-cyan-300">
                              {d.stage}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#070b16]/90 p-5 space-y-3">
                  <h3 className="text-sm font-bold text-white">
                    Fluxo de Produção Real
                  </h3>
                  <p className="text-xs text-slate-400">
                    Todos os registros criados ficam salvos de forma persistente e geram logs imutáveis:
                  </p>
                  <button
                    type="button"
                    onClick={() => setModalType('customer')}
                    className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-[#03060c] p-3 text-xs font-bold hover:border-cyan-500/50 transition"
                  >
                    <span>1. Cadastrar Cliente B2B</span>
                    <ArrowRight className="h-4 w-4 text-cyan-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalType('inventory')}
                    className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-[#03060c] p-3 text-xs font-bold hover:border-cyan-500/50 transition"
                  >
                    <span>2. Cadastrar SKU no Estoque WMS</span>
                    <ArrowRight className="h-4 w-4 text-cyan-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalType('order')}
                    className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-[#03060c] p-3 text-xs font-bold hover:border-cyan-500/50 transition"
                  >
                    <span>3. Emitir Ordem de Serviço (OS)</span>
                    <ArrowRight className="h-4 w-4 text-emerald-400" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. FUNIL KANBAN REAL */}
          {activeModule === 'pipeline' && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-5">
              {(
                [
                  { key: 'lead', title: '01 // LEADS' },
                  { key: 'qualified', title: '02 // QUALIFICADOS' },
                  { key: 'proposal', title: '03 // PROPOSTA' },
                  { key: 'negotiation', title: '04 // NEGOCIAÇÃO' },
                  { key: 'closed_won', title: '05 // FECHADO' },
                ] as const
              ).map((col) => {
                const colDeals = deals.filter((d) => d.stage === col.key);
                return (
                  <div
                    key={col.key}
                    className="flex flex-col rounded-2xl border border-white/10 bg-[#070b16]/80 p-3.5 min-h-[420px]"
                  >
                    <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2.5">
                      <span className="font-mono text-xs font-bold text-cyan-400">
                        {col.title}
                      </span>
                      <span className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-xs font-bold text-white">
                        {colDeals.length}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {colDeals.map((deal) => (
                        <div
                          key={deal.id}
                          className="rounded-xl border border-white/10 bg-[#03060c] p-3.5 space-y-2 shadow-md"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="rounded bg-cyan-500/15 px-2 py-0.5 text-xs font-bold text-cyan-300 border border-cyan-500/30">
                              {deal.customerName}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteDeal(deal.id)}
                              className="text-slate-500 hover:text-rose-400"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <h4 className="text-xs font-bold text-white">
                            {deal.title}
                          </h4>
                          <p className="text-xs text-slate-400">
                            Contato: {deal.contactName}
                          </p>
                          <div className="flex items-center justify-between border-t border-white/10 pt-2">
                            <span className="font-mono text-xs font-bold text-emerald-400">
                              {formatBrlFromCents(deal.valueCents)}
                            </span>
                            {col.key !== 'closed_won' && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleMoveDealStage(
                                    deal,
                                    col.key === 'lead'
                                      ? 'qualified'
                                      : col.key === 'qualified'
                                      ? 'proposal'
                                      : col.key === 'proposal'
                                      ? 'negotiation'
                                      : 'closed_won'
                                  )
                                }
                                className="rounded-lg bg-cyan-500/20 border border-cyan-500/40 px-2.5 py-1 text-xs font-bold text-cyan-300 hover:bg-cyan-500 hover:text-slate-950 transition"
                              >
                                Avançar →
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 3. CLIENTES B2B */}
          {activeModule === 'customers' && (
            <div className="rounded-2xl border border-white/10 bg-[#070b16]/90 overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/10 p-4">
                <h3 className="text-sm font-bold text-white">
                  Carteira de Clientes B2B ({customers.length})
                </h3>
                <button
                  type="button"
                  onClick={() => setModalType('customer')}
                  className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-3.5 py-2 text-xs font-bold text-white"
                >
                  + Cadastrar Cliente
                </button>
              </div>
              {customers.length === 0 ? (
                <div className="p-10 text-center text-xs text-slate-400">
                  Nenhum cliente cadastrado. Clique em <strong>+ Cadastrar Cliente</strong> para inserir uma empresa real.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-white/10 bg-white/5 font-mono uppercase text-slate-400">
                    <tr>
                      <th className="p-3.5">Razão Social / Nome</th>
                      <th className="p-3.5">CNPJ / CPF</th>
                      <th className="p-3.5">WhatsApp</th>
                      <th className="p-3.5">E-mail</th>
                      <th className="p-3.5 text-right">Limite de Crédito</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {customers.map((c) => (
                      <tr key={c.id}>
                        <td className="p-3.5 font-bold text-white">{c.name}</td>
                        <td className="p-3.5 font-mono text-slate-300">
                          {c.documentNumber}
                        </td>
                        <td className="p-3.5 font-mono text-cyan-300">
                          {c.phone}
                        </td>
                        <td className="p-3.5 text-slate-400">{c.email}</td>
                        <td className="p-3.5 text-right font-mono font-bold text-emerald-400">
                          {formatBrlFromCents(c.creditLimitCents)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* 4. ORDENS DE SERVIÇO (OS) */}
          {activeModule === 'orders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#070b16]/90 p-4">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Ordens de Serviço Emitidas ({orders.length})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Integrado com <code className="text-cyan-400">POST /api/orders/[id]/send-pdf</code> e baixa de estoque WMS.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setModalType('order')}
                  className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-bold text-white"
                >
                  + Nova Ordem de Serviço
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-xs text-slate-400">
                  Nenhuma Ordem de Serviço emitida ainda. Cadastre um Cliente e um SKU e clique em <strong>+ Emitir OS</strong>.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="rounded-2xl border border-white/10 bg-[#070b16]/90 p-5 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm font-black text-cyan-400">
                          {ord.orderNumber}
                        </span>
                        <span className="rounded-lg bg-emerald-500/15 px-2.5 py-0.5 font-mono text-xs font-bold text-emerald-400 border border-emerald-500/30">
                          {ord.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">
                        Cliente: <strong>{ord.customerSnapshot.name}</strong> ({ord.customerSnapshot.documentNumber})
                      </p>
                      <div className="divide-y divide-white/10 border-t border-b border-white/10 py-2 text-xs">
                        {ord.items.map((it) => (
                          <div
                            key={it.id}
                            className="flex justify-between py-1"
                          >
                            <span>
                              {it.quantity}x {it.name}{' '}
                              {it.warehouseBinLocation
                                ? `[${it.warehouseBinLocation}]`
                                : ''}
                            </span>
                            <span className="font-mono">
                              {formatBrlFromCents(it.subtotalCents)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="font-mono text-sm font-black text-white">
                          Total: {formatBrlFromCents(ord.financials.grandTotalCents)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveModule('whatsapp')}
                          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Enviar no WhatsApp
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 5. ESTOQUE WMS */}
          {activeModule === 'wms' && (
            <div className="rounded-2xl border border-white/10 bg-[#070b16]/90 overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/10 p-4">
                <h3 className="text-sm font-bold text-white">
                  Inventário WMS Multi-Endereço ({inventory.length})
                </h3>
                <button
                  type="button"
                  onClick={() => setModalType('inventory')}
                  className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-3.5 py-2 text-xs font-bold text-white"
                >
                  + Novo SKU no WMS
                </button>
              </div>
              {inventory.length === 0 ? (
                <div className="p-10 text-center text-xs text-slate-400">
                  Nenhum SKU cadastrado no estoque. Clique em <strong>+ Novo SKU no WMS</strong> para adicionar produtos reais.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-white/10 bg-white/5 font-mono uppercase text-slate-400">
                    <tr>
                      <th className="p-3.5">SKU</th>
                      <th className="p-3.5">Produto</th>
                      <th className="p-3.5">Endereço WMS</th>
                      <th className="p-3.5 text-right">Preço Venda</th>
                      <th className="p-3.5 text-right">Físico</th>
                      <th className="p-3.5 text-right">Reservado</th>
                      <th className="p-3.5 text-right">Disponível</th>
                      <th className="p-3.5 text-right">Operação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {inventory.map((item) => (
                      <tr key={item.id}>
                        <td className="p-3.5 font-mono font-bold text-cyan-400">
                          {item.sku}
                        </td>
                        <td className="p-3.5 font-bold text-white">
                          {item.name}
                        </td>
                        <td className="p-3.5 font-mono text-slate-300">
                          {item.location.aisle}-{item.location.rack}-
                          {item.location.bin}
                        </td>
                        <td className="p-3.5 text-right font-mono text-slate-200">
                          {formatBrlFromCents(item.salePriceCents)}
                        </td>
                        <td className="p-3.5 text-right font-mono">
                          {item.quantityOnHand} UN
                        </td>
                        <td className="p-3.5 text-right font-mono text-amber-400">
                          {item.quantityReserved} UN
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-emerald-400">
                          {item.quantityAvailable} UN
                        </td>
                        <td className="p-3.5 text-right space-x-1">
                          <button
                            type="button"
                            onClick={() => handleAdjustStock(item, 1)}
                            className="rounded bg-white/10 px-2 py-1 font-mono font-bold hover:bg-cyan-500 hover:text-slate-950"
                          >
                            +1
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdjustStock(item, -1)}
                            className="rounded bg-white/10 px-2 py-1 font-mono font-bold hover:bg-cyan-500 hover:text-slate-950"
                          >
                            -1
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* 6. CENTRAL WHATSAPP EM 3 COLUNAS */}
          {activeModule === 'whatsapp' && (
            <WhatsAppChatLayout
              currentUser={{
                uid: 'uid_active_operator',
                name: operatorName,
                companyId,
                role: userRole,
              }}
              chats={chats}
              messagesByChatId={messagesByChatId}
              customersById={customersById}
              ordersByCustomerId={ordersByCustomerId}
              onCreateChat={async ({
                customerName,
                customerPhone,
                department,
              }) => {
                const now = new Date().toISOString();
                const digits = customerPhone.replace(/\D/g, '');
                const newChat: WhatsAppChat = {
                  id: `chat_${Date.now()}`,
                  companyId,
                  remoteJid: `${digits}@s.whatsapp.net`,
                  customerPhone,
                  customerName,
                  status: 'open',
                  department,
                  assignedToUserName: operatorName,
                  unreadCount: 0,
                  lastMessagePreview: 'Canal iniciado pelo operador',
                  lastMessageAt: now,
                  lastMessageDirection: 'outbound',
                  tags: ['Ativo'],
                  isPinned: false,
                  createdAt: now,
                  updatedAt: now,
                };
                await upsertDocument(
                  'whatsapp_chats',
                  STORAGE_KEYS.chats,
                  newChat
                );
                setChats((prev) => [newChat, ...prev]);
              }}
              onSendMessage={async (chatId, text) => {
                const now = new Date().toISOString();
                const msg: WhatsAppMessage = {
                  id: `msg_${Date.now()}`,
                  companyId,
                  chatId,
                  remoteJid: '',
                  providerMessageId: `evo_${Date.now()}`,
                  direction: 'outbound',
                  type: 'text',
                  body: text,
                  senderUserName: operatorName,
                  deliveryStatus: 'sent',
                  createdAt: now,
                };
                await upsertDocument(
                  'whatsapp_messages',
                  STORAGE_KEYS.messages,
                  msg
                );
                setMessages((prev) => [...prev, msg]);
              }}
              onSendOrderPdf={async (order, chatId) => {
                const now = new Date().toISOString();
                const docMsg: WhatsAppMessage = {
                  id: `msg_pdf_${Date.now()}`,
                  companyId,
                  chatId,
                  remoteJid: order.customerSnapshot.whatsappJid,
                  providerMessageId: `evo_pdf_${Date.now()}`,
                  direction: 'outbound',
                  type: 'document',
                  body: `Segue em anexo o PDF oficial da ${order.orderNumber} no valor de ${formatBrlFromCents(order.financials.grandTotalCents)}.`,
                  media: {
                    url: `/api/orders/${order.id}/send-pdf`,
                    mimeType: 'application/pdf',
                    fileName: `${order.orderNumber}.pdf`,
                  },
                  senderUserName: operatorName,
                  deliveryStatus: 'sent',
                  relatedOrderId: order.id,
                  createdAt: now,
                };
                await upsertDocument(
                  'whatsapp_messages',
                  STORAGE_KEYS.messages,
                  docMsg
                );
                setMessages((prev) => [...prev, docMsg]);
                await appendAudit({
                  action: 'WHATSAPP_PDF_SENT',
                  entity: 'order',
                  entityId: order.orderNumber,
                  before: { pdfSent: false },
                  after: {
                    storagePath: `tenants/${companyId}/orders/${order.id}/${order.orderNumber}.pdf`,
                  },
                });
              }}
            />
          )}

          {/* 7. TRILHA DE AUDITORIA IMUTÁVEL */}
          {activeModule === 'audit' && (
            <div className="space-y-3">
              {auditLogs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-xs text-slate-400">
                  Nenhum evento registrado ainda. Toda ação que você realizar no sistema será gravada aqui com diff <code className="text-cyan-400">before/after</code>.
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-2xl border border-white/10 bg-[#070b16]/90 p-4 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-cyan-500/15 px-2 py-0.5 font-mono font-bold text-cyan-300 border border-cyan-500/30">
                        {log.action}
                      </span>
                      <span className="font-mono text-slate-400">
                        {log.timestamp} • Operador: {log.userName} ({log.userRole})
                      </span>
                    </div>
                    <p className="font-mono text-slate-300">
                      Entidade: <strong className="text-white">{log.entity}</strong> →{' '}
                      <span className="text-cyan-400">{log.entityId}</span>
                    </p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 font-mono">
                      <div className="rounded-xl bg-rose-950/40 border border-rose-500/20 p-2.5 text-rose-300">
                        BEFORE: {JSON.stringify(log.diff.before)}
                      </div>
                      <div className="rounded-xl bg-emerald-950/40 border border-emerald-500/20 p-2.5 text-emerald-300">
                        AFTER: {JSON.stringify(log.diff.after)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </main>
      </div>

      {/* =====================================================================
          MODAIS DE CADASTRO REAL
      ===================================================================== */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#070b16] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {modalType === 'deal' && 'Nova Oportunidade Comercial'}
                {modalType === 'customer' && 'Novo Cliente B2B / Conta CRM'}
                {modalType === 'inventory' && 'Novo Produto / SKU no WMS'}
                {modalType === 'order' && 'Emitir Ordem de Serviço (OS)'}
              </h3>
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {modalType === 'deal' && (
              <form onSubmit={handleCreateDeal} className="space-y-3 text-xs">
                <div>
                  <label className="block mb-1 text-slate-300 font-semibold">
                    Título do Projeto / Negociação
                  </label>
                  <input
                    required
                    value={dealTitle}
                    onChange={(e) => setDealTitle(e.target.value)}
                    placeholder="Digite o nome real da oportunidade"
                    className="w-full rounded-xl border border-white/10 bg-[#03060c] px-3 py-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-slate-300 font-semibold">
                    Empresa / Cliente
                  </label>
                  <input
                    required
                    value={dealCustomerName}
                    onChange={(e) => setDealCustomerName(e.target.value)}
                    placeholder="Razão Social ou Nome do Cliente"
                    className="w-full rounded-xl border border-white/10 bg-[#03060c] px-3 py-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-slate-300 font-semibold">
                    Responsável / Contato
                  </label>
                  <input
                    required
                    value={dealContact}
                    onChange={(e) => setDealContact(e.target.value)}
                    placeholder="Nome do comprador ou decisor"
                    className="w-full rounded-xl border border-white/10 bg-[#03060c] px-3 py-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-slate-300 font-semibold">
                    Valor Estimado (R$)
                  </label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={dealValueReais}
                    onChange={(e) => setDealValueReais(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-white/10 bg-[#03060c] px-3 py-2.5 text-white font-mono"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="rounded-xl border border-white/10 px-4 py-2"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 font-bold text-white"
                  >
                    Salvar Oportunidade
                  </button>
                </div>
              </form>
            )}

            {modalType === 'customer' && (
              <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
                <div>
                  <label className="block mb-1 text-slate-300 font-semibold">
                    Razão Social / Nome Completo
                  </label>
                  <input
                    required
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#03060c] px-3 py-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-slate-300 font-semibold">
                    CNPJ ou CPF
                  </label>
                  <input
                    required
                    value={custDoc}
                    onChange={(e) => setCustDoc(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#03060c] px-3 py-2.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-slate-300 font-semibold">
                    WhatsApp (com DDD)
                  </label>
                  <input
                    required
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    placeholder="+55 11 99999-9999"
                    className="w-full rounded-xl border border-white/10 bg-[#03060c] px-3 py-2.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-slate-300 font-semibold">
                    E-mail Corporativo
                  </label>
                  <input
                    required
                    type="email"
                    value={custEmail}
                    onChange={(e) => setCustEmail(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#03060c] px-3 py-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-slate-300 font-semibold">
                    Limite de Crédito Aprovado (R$)
                  </label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={custCreditReais}
                    onChange={(e) => setCustCreditReais(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#03060c] px-3 py-2.5 text-white font-mono"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="rounded-xl border border-white/10 px-4 py-2"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 font-bold text-white"
                  >
                    Cadastrar Cliente
                  </button>
                </div>
              </form>
            )}

            {modalType === 'inventory' && (
              <form
                onSubmit={handleCreateInventoryItem}
                className="space-y-3 text-xs"
              >
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block mb-1 text-slate-300 font-semibold">
                      Código SKU
                    </label>
                    <input
                      required
                      value={skuCode}
                      onChange={(e) => setSkuCode(e.target.value)}
                      placeholder="Ex: PRD-001"
                      className="w-full rounded-xl border border-white/10 bg-[#03060c] px-3 py-2.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-slate-300 font-semibold">
                      Qtd. Inicial
                    </label>
                    <input
                      required
                      type="number"
                      value={skuQty}
                      onChange={(e) => setSkuQty(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#03060c] px-3 py-2.5 text-white font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block mb-1 text-slate-300 font-semibold">
                    Nome / Descrição do Produto
                  </label>
                  <input
                    required
                    value={skuName}
                    onChange={(e) => setSkuName(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#03060c] px-3 py-2.5 text-white"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block mb-1 text-slate-300 font-semibold">
                      Corredor
                    </label>
                    <input
                      required
                      value={skuAisle}
                      onChange={(e) => setSkuAisle(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#03060c] px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-slate-300 font-semibold">
                      Estante
                    </label>
                    <input
                      required
                      value={skuRack}
                      onChange={(e) => setSkuRack(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#03060c] px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-slate-300 font-semibold">
                      Posição (Bin)
                    </label>
                    <input
                      required
                      value={skuBin}
                      onChange={(e) => setSkuBin(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#03060c] px-3 py-2 text-white font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block mb-1 text-slate-300 font-semibold">
                    Preço Unitário de Venda (R$)
                  </label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={skuPriceReais}
                    onChange={(e) => setSkuPriceReais(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#03060c] px-3 py-2.5 text-white font-mono"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="rounded-xl border border-white/10 px-4 py-2"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 font-bold text-white"
                  >
                    Salvar no WMS
                  </button>
                </div>
              </form>
            )}

            {modalType === 'order' && (
              <form onSubmit={handleCreateOrder} className="space-y-3 text-xs">
                <div>
                  <label className="block mb-1 text-slate-300 font-semibold">
                    Selecionar Cliente Cadastrado
                  </label>
                  <select
                    required
                    value={orderCustId}
                    onChange={(e) => setOrderCustId(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#03060c] px-3 py-2.5 text-white"
                  >
                    <option value="">Selecione um cliente...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.documentNumber})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block mb-1 text-slate-300 font-semibold">
                      Produto do Estoque WMS (Opcional)
                    </label>
                    <select
                      value={orderSkuId}
                      onChange={(e) => setOrderSkuId(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#03060c] px-3 py-2.5 text-white"
                    >
                      <option value="">Nenhum produto físico</option>
                      {inventory.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.sku} - {i.name} ({i.quantityAvailable} disp.)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 text-slate-300 font-semibold">
                      Qtd.
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={orderQty}
                      onChange={(e) => setOrderQty(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#03060c] px-3 py-2.5 text-white font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block mb-1 text-slate-300 font-semibold">
                    Descrição do Serviço Técnico
                  </label>
                  <input
                    value={orderServiceDesc}
                    onChange={(e) => setOrderServiceDesc(e.target.value)}
                    placeholder="Ex: Manutenção / Instalação"
                    className="w-full rounded-xl border border-white/10 bg-[#03060c] px-3 py-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-slate-300 font-semibold">
                    Valor da Mão de Obra / Serviço (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={orderServiceReais}
                    onChange={(e) => setOrderServiceReais(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#03060c] px-3 py-2.5 text-white font-mono"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="rounded-xl border border-white/10 px-4 py-2"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 font-bold text-white"
                  >
                    Emitir OS & Reservar Estoque
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
