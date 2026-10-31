'use client';

import React, { useMemo, useState } from 'react';
import {
  Search,
  Send,
  Paperclip,
  FileText,
  CheckCheck,
  Clock,
  UserCheck,
  Package,
  Building2,
  Phone,
  Mail,
  Tag,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Filter,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import {
  Customer,
  Order,
  WhatsAppChat,
  WhatsAppChatStatus,
  WhatsAppMessage,
} from '@/types/database';

export interface WhatsAppChatLayoutProps {
  currentUser: {
    uid: string;
    name: string;
    companyId: string;
    role: string;
  };
  initialChats?: WhatsAppChat[];
  initialMessagesByChatId?: Record<string, WhatsAppMessage[]>;
  customersById?: Record<string, Customer>;
  ordersByCustomerId?: Record<string, Order[]>;
  onSendMessage?: (chatId: string, text: string) => Promise<void>;
  onSendOrderPdf?: (orderId: string) => Promise<void>;
}

const DEMO_CHATS: WhatsAppChat[] = [
  {
    id: 'chat_01',
    companyId: 'tenant_acme_01',
    remoteJid: '5511998765432@s.whatsapp.net',
    customerPhone: '+55 (11) 99876-5432',
    customerName: 'Indústrias Metalúrgica Atlas S.A.',
    customerId: 'cust_01',
    activeOrderId: 'ord_101',
    status: 'open',
    department: 'sales',
    assignedToUserId: 'usr_01',
    assignedToUserName: 'Lucas Andrade',
    unreadCount: 2,
    lastMessagePreview: 'Conseguem enviar o PDF da OS atualizada com o frete?',
    lastMessageAt: '2026-10-31T10:42:00.000Z',
    lastMessageDirection: 'inbound',
    tags: ['VIP B2B', 'Urgente', 'OS Aberta'],
    isPinned: true,
    createdAt: '2026-10-30T09:00:00.000Z',
    updatedAt: '2026-10-31T10:42:00.000Z',
  },
  {
    id: 'chat_02',
    companyId: 'tenant_acme_01',
    remoteJid: '5511977651234@s.whatsapp.net',
    customerPhone: '+55 (11) 97765-1234',
    customerName: 'Logística TransBrasil Ltda',
    customerId: 'cust_02',
    status: 'queued',
    department: 'warehouse',
    unreadCount: 1,
    lastMessagePreview: 'Bom dia! O motorista já chegou na doca 04 para coleta.',
    lastMessageAt: '2026-10-31T10:15:00.000Z',
    lastMessageDirection: 'inbound',
    tags: ['Coleta WMS', 'Doca 04'],
    isPinned: false,
    createdAt: '2026-10-31T08:30:00.000Z',
    updatedAt: '2026-10-31T10:15:00.000Z',
  },
];

const DEMO_MESSAGES: Record<string, WhatsAppMessage[]> = {
  chat_01: [
    {
      id: 'msg_01',
      companyId: 'tenant_acme_01',
      chatId: 'chat_01',
      remoteJid: '5511998765432@s.whatsapp.net',
      providerMessageId: 'BAE59210A',
      direction: 'inbound',
      type: 'text',
      body: 'Bom dia equipe!As válvulas pneumáticas já saíram da separação no estoque?',
      deliveryStatus: 'read',
      createdAt: '2026-10-31T10:38:00.000Z',
    },
    {
      id: 'msg_02',
      companyId: 'tenant_acme_01',
      chatId: 'chat_01',
      remoteJid: '5511998765432@s.whatsapp.net',
      providerMessageId: 'BAE59210B',
      direction: 'outbound',
      type: 'text',
      body: 'Bom dia! Sim, o picking no corredor A02-R04 já foi concluído e conferido pelo WMS.',
      senderUserId: 'usr_01',
      senderUserName: 'Lucas Andrade',
      deliveryStatus: 'read',
      createdAt: '2026-10-31T10:40:00.000Z',
    },
    {
      id: 'msg_03',
      companyId: 'tenant_acme_01',
      chatId: 'chat_01',
      remoteJid: '5511998765432@s.whatsapp.net',
      providerMessageId: 'BAE59210C',
      direction: 'inbound',
      type: 'text',
      body: 'Conseguem enviar o PDF da OS atualizada com o frete?',
      deliveryStatus: 'read',
      createdAt: '2026-10-31T10:42:00.000Z',
    },
  ],
};

const DEMO_CUSTOMERS: Record<string, Customer> = {
  cust_01: {
    id: 'cust_01',
    companyId: 'tenant_acme_01',
    type: 'b2b',
    name: 'Indústrias Metalúrgica Atlas S.A.',
    tradeName: 'Atlas Metalúrgica',
    documentNumber: '12.345.678/0001-99',
    stateRegistration: '110.042.490.114',
    email: 'compras@atlasmetalurgica.com.br',
    phone: '+55 (11) 99876-5432',
    whatsappJid: '5511998765432@s.whatsapp.net',
    status: 'active',
    tags: ['Enterprise', 'Contrato Anual', 'SLA 4h'],
    creditLimitCents: 15000000,
    totalSpentCents: 8450000,
    ordersCount: 14,
    billingAddress: {
      street: 'Av. das Nações Unidas',
      number: '12901',
      neighborhood: 'Brooklin Paulista',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '04578-910',
    },
    createdAt: '2025-02-10T12:00:00.000Z',
    updatedAt: '2026-10-31T10:00:00.000Z',
  },
};

const DEMO_ORDERS: Record<string, Order[]> = {
  cust_01: [
    {
      id: 'ord_101',
      companyId: 'tenant_acme_01',
      orderNumber: 'OS-2026-000842',
      type: 'service_order',
      status: 'in_picking',
      priority: 'high',
      customerId: 'cust_01',
      customerSnapshot: {
        name: 'Indústrias Metalúrgica Atlas S.A.',
        documentNumber: '12.345.678/0001-99',
        email: 'compras@atlasmetalurgica.com.br',
        phone: '+55 (11) 99876-5432',
        whatsappJid: '5511998765432@s.whatsapp.net',
        addressSummary: 'Av. das Nações Unidas, 12901 - Brooklin, São Paulo/SP',
      },
      assignedTechnicianId: 'tech_04',
      assignedTechnicianName: 'Eng. Roberto Siqueira',
      salespersonId: 'usr_01',
      salespersonName: 'Lucas Andrade',
      items: [
        {
          id: 'item_1',
          itemType: 'product',
          inventoryItemId: 'inv_88',
          sku: 'VLV-PNEU-50MM',
          name: 'Válvula Solenoide Alta Pressão 50mm Inox',
          unit: 'UN',
          quantity: 4,
          unitPriceCents: 125000,
          discountCents: 0,
          taxCents: 0,
          subtotalCents: 500000,
          warehouseBinLocation: 'A02-R04-N02',
        },
        {
          id: 'item_2',
          itemType: 'service',
          sku: 'SRV-CAL-IND',
          name: 'Calibração Técnica e Teste Hidrostático em Bancada',
          unit: 'HR',
          quantity: 6,
          unitPriceCents: 28000,
          discountCents: 18000,
          taxCents: 0,
          subtotalCents: 150000,
        },
      ],
      financials: {
        itemsSubtotalCents: 500000,
        servicesSubtotalCents: 168000,
        shippingCents: 14500,
        discountTotalCents: 18000,
        taxTotalCents: 0,
        grandTotalCents: 664500,
      },
      payment: {
        method: 'boleto',
        installments: 2,
        dueDate: '2026-11-15T00:00:00.000Z',
        paymentStatus: 'pending',
        paidAmountCents: 0,
      },
      createdAt: '2026-10-30T14:20:00.000Z',
      updatedAt: '2026-10-31T09:50:00.000Z',
    },
  ],
};

function formatCurrencyBrl(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}

function formatShortTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function WhatsAppChatLayout({
  currentUser,
  initialChats = DEMO_CHATS,
  initialMessagesByChatId = DEMO_MESSAGES,
  customersById = DEMO_CUSTOMERS,
  ordersByCustomerId = DEMO_ORDERS,
  onSendMessage,
  onSendOrderPdf,
}: WhatsAppChatLayoutProps) {
  const [chats, setChats] = useState<WhatsAppChat[]>(initialChats);
  const [selectedChatId, setSelectedChatId] = useState<string>(
    initialChats[0]?.id || ''
  );
  const [messagesMap, setMessagesMap] = useState<
    Record<string, WhatsAppMessage[]>
  >(initialMessagesByChatId);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | WhatsAppChatStatus>(
    'all'
  );
  const [draftMessage, setDraftMessage] = useState<string>('');
  const [isSendingMsg, setIsSendingMsg] = useState<boolean>(false);
  const [sendingPdfOrderId, setSendingPdfOrderId] = useState<string | null>(
    null
  );
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const filteredChats = useMemo(() => {
    return chats.filter((chat) => {
      const matchesStatus =
        statusFilter === 'all' || chat.status === statusFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        chat.customerName.toLowerCase().includes(q) ||
        chat.customerPhone.toLowerCase().includes(q) ||
        chat.lastMessagePreview.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [chats, searchQuery, statusFilter]);

  const activeChat = useMemo(
    () => chats.find((c) => c.id === selectedChatId) || null,
    [chats, selectedChatId]
  );

  const activeMessages = useMemo(
    () => (selectedChatId ? messagesMap[selectedChatId] || [] : []),
    [messagesMap, selectedChatId]
  );

  const linkedCustomer = useMemo(
    () =>
      activeChat?.customerId
        ? customersById[activeChat.customerId] || null
        : null,
    [activeChat, customersById]
  );

  const customerOrders = useMemo(
    () =>
      activeChat?.customerId
        ? ordersByCustomerId[activeChat.customerId] || []
        : [],
    [activeChat, ordersByCustomerId]
  );

  async function handleSendText(e: React.FormEvent) {
    e.preventDefault();
    if (!activeChat || !draftMessage.trim() || isSendingMsg) return;

    const textToSend = draftMessage.trim();
    setDraftMessage('');
    setIsSendingMsg(true);

    const optimisticMsg: WhatsAppMessage = {
      id: `local_${Date.now()}`,
      companyId: currentUser.companyId,
      chatId: activeChat.id,
      remoteJid: activeChat.remoteJid,
      providerMessageId: `Optimistic_${Date.now()}`,
      direction: 'outbound',
      type: 'text',
      body: textToSend,
      senderUserId: currentUser.uid,
      senderUserName: currentUser.name,
      deliveryStatus: 'sent',
      createdAt: new Date().toISOString(),
    };

    setMessagesMap((prev) => ({
      ...prev,
      [activeChat.id]: [...(prev[activeChat.id] || []), optimisticMsg],
    }));

    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChat.id
          ? {
              ...c,
              lastMessagePreview: textToSend,
              lastMessageAt: optimisticMsg.createdAt,
              lastMessageDirection: 'outbound',
            }
          : c
      )
    );

    try {
      if (onSendMessage) {
        await onSendMessage(activeChat.id, textToSend);
      }
    } catch (err) {
      setFeedbackBanner({
        type: 'error',
        text:
          err instanceof Error
            ? err.message
            : 'Erro ao enviar mensagem para o WhatsApp.',
      });
    } finally {
      setIsSendingMsg(false);
    }
  }

  async function handleTriggerOrderPdf(order: Order) {
    if (!activeChat || sendingPdfOrderId) return;
    setSendingPdfOrderId(order.id);
    setFeedbackBanner(null);

    try {
      if (onSendOrderPdf) {
        await onSendOrderPdf(order.id);
      } else {
        const res = await fetch(`/api/orders/${order.id}/send-pdf`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });

        if (!res.ok) {
          const errPayload = (await res.json()) as { error?: string };
          throw new Error(
            errPayload.error || 'Falha ao gerar e disparar PDF da OS.'
          );
        }
      }

      const nowIso = new Date().toISOString();
      const docMsg: WhatsAppMessage = {
        id: `pdf_${Date.now()}`,
        companyId: currentUser.companyId,
        chatId: activeChat.id,
        remoteJid: activeChat.remoteJid,
        providerMessageId: `EVO_PDF_${Date.now()}`,
        direction: 'outbound',
        type: 'document',
        body: `📄 Documento ${order.orderNumber}.pdf gerado e enviado ao cliente.`,
        media: {
          url: '#',
          mimeType: 'application/pdf',
          fileName: `${order.orderNumber}.pdf`,
        },
        senderUserId: currentUser.uid,
        senderUserName: currentUser.name,
        deliveryStatus: 'sent',
        relatedOrderId: order.id,
        createdAt: nowIso,
      };

      setMessagesMap((prev) => ({
        ...prev,
        [activeChat.id]: [...(prev[activeChat.id] || []), docMsg],
      }));

      setFeedbackBanner({
        type: 'success',
        text: `PDF da ${order.orderNumber} compilado, salvo no Cloud Storage e enviado via WhatsApp!`,
      });
    } catch (error) {
      setFeedbackBanner({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Erro ao disparar PDF da Ordem de Serviço.',
      });
    } finally {
      setSendingPdfOrderId(null);
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950 text-slate-100 shadow-2xl">
      {/* =====================================================================
          COLUNA 1: LISTA DE CONVERSAS & FILA DE ATENDIMENTO
      ===================================================================== */}
      <aside className="flex w-80 shrink-0 flex-col border-r border-slate-800 bg-slate-900/70 lg:w-96">
        {/* Header da Fila */}
        <div className="border-b border-slate-800 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-500/20" />
              <h2 className="text-sm font-semibold tracking-tight text-white">
                Central WhatsApp OmniFlow
              </h2>
            </div>
            <span className="rounded-md bg-sky-500/10 px-2 py-0.5 text-[11px] font-medium text-sky-400 border border-sky-500/20">
              Multi-Atendente
            </span>
          </div>

          {/* Busca */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar cliente, telefone ou OS..."
              className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-xs text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
            />
          </div>

          {/* Abas de Status */}
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {(
              [
                { key: 'all', label: 'Todos' },
                { key: 'open', label: 'Ativos' },
                { key: 'queued', label: 'Na Fila' },
                { key: 'resolved', label: 'Finalizados' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`rounded-md px-2.5 py-1 font-medium transition ${
                  statusFilter === tab.key
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Conversas */}
        <div className="flex-1 divide-y divide-slate-800/60 overflow-y-auto">
          {filteredChats.map((chat) => {
            const isSelected = chat.id === selectedChatId;
            return (
              <button
                key={chat.id}
                type="button"
                onClick={() => setSelectedChatId(chat.id)}
                className={`flex w-full flex-col gap-1.5 p-3.5 text-left transition ${
                  isSelected
                    ? 'bg-sky-950/40 border-l-2 border-l-sky-400'
                    : 'hover:bg-slate-900/90'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="line-clamp-1 text-xs font-semibold text-slate-100">
                    {chat.customerName}
                  </span>
                  <span className="shrink-0 text-[11px] text-slate-400">
                    {formatShortTime(chat.lastMessageAt)}
                  </span>
                </div>

                <p className="line-clamp-1 text-xs text-slate-400">
                  {chat.lastMessagePreview}
                </p>

                <div className="mt-1 flex flex-wrap items-center justify-between gap-1">
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium uppercase text-slate-300">
                      {chat.department}
                    </span>
                    {chat.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-sky-500/10 px-1.5 py-0.5 text-[10px] text-sky-300 border border-sky-500/20"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {chat.unreadCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[10px] font-bold text-slate-950">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* =====================================================================
          COLUNA 2: CHAT ATIVO EM TEMPO REAL
      ===================================================================== */}
      <main className="flex flex-1 flex-col bg-slate-950">
        {activeChat ? (
          <>
            {/* Topbar do Chat Ativo */}
            <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900/60 px-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-600/20 font-bold text-sky-400 border border-sky-500/30">
                  {activeChat.customerName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">
                      {activeChat.customerName}
                    </h3>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
                      {activeChat.status === 'open'
                        ? 'Em Atendimento'
                        : 'Fila de Espera'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {activeChat.customerPhone} • Atendente:{' '}
                    <span className="text-slate-200">
                      {activeChat.assignedToUserName || 'Não atribuído'}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 md:flex">
                  <UserCheck className="h-3.5 w-3.5 text-sky-400" />
                  Operador: {currentUser.name}
                </span>
              </div>
            </header>

            {/* Banner de Feedback (Auditoria / Envio PDF) */}
            {feedbackBanner && (
              <div
                className={`flex items-center justify-between px-4 py-2 text-xs font-medium ${
                  feedbackBanner.type === 'success'
                    ? 'bg-emerald-950/90 text-emerald-300 border-b border-emerald-800'
                    : 'bg-rose-950/90 text-rose-300 border-b border-rose-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  {feedbackBanner.type === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  )}
                  <span>{feedbackBanner.text}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFeedbackBanner(null)}
                  className="text-[11px] underline opacity-80 hover:opacity-100"
                >
                  Fechar
                </button>
              </div>
            )}

            {/* Histórico de Mensagens */}
            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {activeMessages.map((msg) => {
                const isOutbound = msg.direction === 'outbound';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      isOutbound ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-xl rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow ${
                        isOutbound
                          ? 'rounded-br-none bg-sky-600 text-white'
                          : 'rounded-bl-none border border-slate-800 bg-slate-900 text-slate-100'
                      }`}
                    >
                      {isOutbound && msg.senderUserName && (
                        <p className="mb-1 text-[10px] font-semibold text-sky-200">
                          {msg.senderUserName}
                        </p>
                      )}

                      {msg.type === 'document' && msg.media && (
                        <div className="mb-2 flex items-center gap-2.5 rounded-lg bg-slate-950/30 p-2.5 border border-white/10">
                          <FileText className="h-5 w-5 shrink-0 text-amber-300" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold">
                              {msg.media.fileName || 'Ordem_de_Servico.pdf'}
                            </p>
                            <p className="text-[10px] opacity-75">
                              Documento Oficial PDF • Cloud Storage
                            </p>
                          </div>
                        </div>
                      )}

                      <p className="whitespace-pre-wrap">{msg.body}</p>

                      <div className="mt-1.5 flex items-center justify-end gap-1 text-[10px] opacity-75">
                        <span>{formatShortTime(msg.createdAt)}</span>
                        {isOutbound && <CheckCheck className="h-3.5 w-3.5" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Composer de Mensagem */}
            <form
              onSubmit={handleSendText}
              className="border-t border-slate-800 bg-slate-900/60 p-3.5"
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  title="Anexar arquivo ou catálogo WMS"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200"
                >
                  <Paperclip className="h-4 w-4" />
                </button>

                <input
                  type="text"
                  value={draftMessage}
                  onChange={(e) => setDraftMessage(e.target.value)}
                  placeholder="Digite sua mensagem para o WhatsApp do cliente..."
                  className="h-10 flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3.5 text-xs text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                />

                <button
                  type="submit"
                  disabled={!draftMessage.trim() || isSendingMsg}
                  className="flex h-10 items-center gap-2 rounded-lg bg-sky-600 px-4 text-xs font-semibold text-white transition hover:bg-sky-500 disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  Enviar
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
            Selecione um atendimento na coluna à esquerda.
          </div>
        )}
      </main>

      {/* =====================================================================
          COLUNA 3: PAINEL LATERAL CRM / ORDENS DE SERVIÇO / WMS
      ===================================================================== */}
      <aside className="hidden w-80 shrink-0 flex-col border-l border-slate-800 bg-slate-900/70 xl:flex xl:w-96">
        <div className="border-b border-slate-800 p-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-sky-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Contexto CRM & WMS do Cliente
            </h3>
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          {/* Ficha Cadastral CRM */}
          {linkedCustomer ? (
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-emerald-400">
                    Cliente {linkedCustomer.type.toUpperCase()}
                  </span>
                  <h4 className="mt-1 text-sm font-semibold text-white">
                    {linkedCustomer.name}
                  </h4>
                  <p className="text-xs text-slate-400">
                    CNPJ/CPF: {linkedCustomer.documentNumber}
                  </p>
                </div>
              </div>

              <div className="mt-3 space-y-1.5 border-t border-slate-800/80 pt-3 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <span>{linkedCustomer.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <span className="truncate">{linkedCustomer.email}</span>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-800/80 pt-3">
                <div className="rounded-lg bg-slate-900 p-2">
                  <span className="text-[10px] text-slate-400">
                    Limite de Crédito
                  </span>
                  <p className="text-xs font-bold text-emerald-400">
                    {formatCurrencyBrl(linkedCustomer.creditLimitCents)}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-900 p-2">
                  <span className="text-[10px] text-slate-400">
                    LTV / Faturado
                  </span>
                  <p className="text-xs font-bold text-slate-100">
                    {formatCurrencyBrl(linkedCustomer.totalSpentCents)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-xs text-slate-400">
              Contato ainda não vinculado a uma conta CRM.
            </div>
          )}

          {/* Ordens de Serviço e Disparo Direto de PDF */}
          <div>
            <div className="mb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
                <Package className="h-3.5 w-3.5 text-sky-400" />
                Ordens de Serviço ({customerOrders.length})
              </span>
            </div>

            <div className="space-y-3">
              {customerOrders.map((order) => {
                const isDispatching = sendingPdfOrderId === order.id;

                return (
                  <div
                    key={order.id}
                    className="rounded-xl border border-slate-800 bg-slate-950/90 p-3.5 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-sky-400">
                        {order.orderNumber}
                      </span>
                      <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300 border border-amber-500/20">
                        {order.status === 'in_picking'
                          ? 'Separação WMS'
                          : order.status}
                      </span>
                    </div>

                    {/* Itens do Pedido com Endereço WMS */}
                    <div className="mt-2.5 space-y-1.5 border-t border-slate-800/80 pt-2.5">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start justify-between gap-2 text-[11px]"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-200">
                              {item.quantity}x {item.name}
                            </p>
                            {item.warehouseBinLocation && (
                              <span className="text-[10px] text-slate-400">
                                Endereço WMS: {item.warehouseBinLocation}
                              </span>
                            )}
                          </div>
                          <span className="shrink-0 font-mono text-slate-300">
                            {formatCurrencyBrl(item.subtotalCents)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Total e Botão de Geração + Disparo PDF no WhatsApp */}
                    <div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-2.5">
                      <div>
                        <span className="text-[10px] text-slate-400">
                          Valor Total da OS
                        </span>
                        <p className="text-sm font-bold text-white">
                          {formatCurrencyBrl(order.financials.grandTotalCents)}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={isDispatching}
                        onClick={() => handleTriggerOrderPdf(order)}
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow transition hover:bg-emerald-500 disabled:opacity-50"
                      >
                        {isDispatching ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <FileText className="h-3.5 w-3.5" />
                            Gerar & Enviar PDF
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

