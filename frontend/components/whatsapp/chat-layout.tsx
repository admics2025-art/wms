'use client';

import React, { useMemo, useState } from 'react';
import {
  Search,
  Send,
  Paperclip,
  FileText,
  CheckCheck,
  UserCheck,
  Package,
  Building2,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Plus,
  MessageSquarePlus,
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
  chats: WhatsAppChat[];
  messagesByChatId: Record<string, WhatsAppMessage[]>;
  customersById: Record<string, Customer>;
  ordersByCustomerId: Record<string, Order[]>;
  onSendMessage: (chatId: string, text: string) => Promise<void>;
  onSendOrderPdf: (order: Order, chatId: string) => Promise<void>;
  onCreateChat?: (params: {
    customerName: string;
    customerPhone: string;
    department: WhatsAppChat['department'];
  }) => Promise<void>;
}

function formatCurrencyBrl(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}

function formatShortTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function WhatsAppChatLayout({
  currentUser,
  chats,
  messagesByChatId,
  customersById,
  ordersByCustomerId,
  onSendMessage,
  onSendOrderPdf,
  onCreateChat,
}: WhatsAppChatLayoutProps) {
  const [selectedChatId, setSelectedChatId] = useState<string>(
    chats[0]?.id || ''
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | WhatsAppChatStatus>(
    'all'
  );
  const [draftMessage, setDraftMessage] = useState<string>('');
  const [isSendingMsg, setIsSendingMsg] = useState<boolean>(false);
  const [sendingPdfOrderId, setSendingPdfOrderId] = useState<string | null>(
    null
  );
  const [showNewChatModal, setShowNewChatModal] = useState<boolean>(false);
  const [newChatName, setNewChatName] = useState<string>('');
  const [newChatPhone, setNewChatPhone] = useState<string>('');
  const [newChatDept, setNewChatDept] =
    useState<WhatsAppChat['department']>('sales');

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
    () =>
      chats.find((c) => c.id === selectedChatId) || filteredChats[0] || null,
    [chats, filteredChats, selectedChatId]
  );

  const activeMessages = useMemo(
    () => (activeChat ? messagesByChatId[activeChat.id] || [] : []),
    [messagesByChatId, activeChat]
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

    try {
      await onSendMessage(activeChat.id, textToSend);
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
      await onSendOrderPdf(order, activeChat.id);
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

  async function handleCreateNewChatSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newChatName.trim() || !newChatPhone.trim() || !onCreateChat) return;
    await onCreateChat({
      customerName: newChatName.trim(),
      customerPhone: newChatPhone.trim(),
      department: newChatDept,
    });
    setNewChatName('');
    setNewChatPhone('');
    setShowNewChatModal(false);
  }

  return (
    <div className="flex h-[calc(100vh-7.5rem)] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#050811]/90 text-slate-100 shadow-[0_0_50px_-12px_rgba(6,182,212,0.18)] backdrop-blur-xl">
      {/* =====================================================================
          COLUNA 1: LISTA DE CONVERSAS & FILA DE ATENDIMENTO
      ===================================================================== */}
      <aside className="flex w-80 shrink-0 flex-col border-r border-white/10 bg-[#070b16]/80 lg:w-96">
        <div className="border-b border-white/10 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_12px_#22d3ee]" />
              <h2 className="text-sm font-bold tracking-tight text-white">
                Central WhatsApp Enterprise
              </h2>
            </div>
            {onCreateChat && (
              <button
                type="button"
                onClick={() => setShowNewChatModal(true)}
                className="flex items-center gap-1 rounded-lg bg-cyan-500/15 px-2.5 py-1 text-xs font-semibold text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/25 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                Novo Chat
              </button>
            )}
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrar por nome, número ou protocolo..."
              className="w-full rounded-xl border border-white/10 bg-[#03060c] py-2 pl-9 pr-3 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500/60 focus:outline-none"
            />
          </div>

          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {(
              [
                { key: 'all', label: 'Todos' },
                { key: 'open', label: 'Ativos' },
                { key: 'queued', label: 'Fila' },
                { key: 'resolved', label: 'Resolvidos' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                  statusFilter === tab.key
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 divide-y divide-white/5 overflow-y-auto">
          {filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 px-6 text-center space-y-3">
              <MessageSquarePlus className="h-8 w-8 text-cyan-400/50" />
              <p className="text-xs font-medium text-slate-400">
                Nenhuma conversa iniciada. Clique em <strong>+ Novo Chat</strong> acima para abrir um atendimento real.
              </p>
            </div>
          ) : (
            filteredChats.map((chat) => {
              const isSelected = activeChat?.id === chat.id;
              return (
                <button
                  key={chat.id}
                  type="button"
                  onClick={() => setSelectedChatId(chat.id)}
                  className={`flex w-full flex-col gap-1.5 p-3.5 text-left transition ${
                    isSelected
                      ? 'bg-cyan-500/10 border-l-2 border-l-cyan-400'
                      : 'hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="line-clamp-1 text-xs font-bold text-slate-100">
                      {chat.customerName}
                    </span>
                    <span className="shrink-0 font-mono text-xs text-slate-500">
                      {formatShortTime(chat.lastMessageAt)}
                    </span>
                  </div>

                  <p className="line-clamp-1 text-xs text-slate-400">
                    {chat.lastMessagePreview}
                  </p>

                  <div className="mt-1 flex flex-wrap items-center justify-between gap-1">
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs uppercase text-slate-300 border border-white/10">
                        {chat.department}
                      </span>
                      {chat.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-xs text-cyan-300 border border-cyan-500/20"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {chat.unreadCount > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan-400 px-1.5 text-xs font-bold text-slate-950">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* =====================================================================
          COLUNA 2: CHAT ATIVO EM TEMPO REAL
      ===================================================================== */}
      <main className="flex flex-1 flex-col bg-[#03060c]/90">
        {activeChat ? (
          <>
            <header className="flex h-16 items-center justify-between border-b border-white/10 bg-[#070b16]/80 px-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 font-bold text-cyan-300 border border-cyan-500/30">
                  {activeChat.customerName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">
                      {activeChat.customerName}
                    </h3>
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
                      {activeChat.status === 'open' ? 'Conectado' : 'Na Fila'}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-slate-400">
                    {activeChat.customerPhone} • Operador:{' '}
                    <span className="text-slate-200">
                      {activeChat.assignedToUserName || currentUser.name}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 md:flex">
                  <UserCheck className="h-3.5 w-3.5 text-cyan-400" />
                  {currentUser.name}
                </span>
              </div>
            </header>

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
                  className="text-xs underline opacity-80 hover:opacity-100"
                >
                  Fechar
                </button>
              </div>
            )}

            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {activeMessages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-slate-500">
                  Envie a primeira mensagem abaixo para registrar no histórico.
                </div>
              ) : (
                activeMessages.map((msg) => {
                  const isOutbound = msg.direction === 'outbound';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        isOutbound ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div
                        className={`max-w-xl rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-lg ${
                          isOutbound
                            ? 'rounded-br-none bg-gradient-to-r from-cyan-600 to-blue-600 text-white'
                            : 'rounded-bl-none border border-white/10 bg-[#0b1224] text-slate-100'
                        }`}
                      >
                        {isOutbound && msg.senderUserName && (
                          <p className="mb-1 text-xs font-bold text-cyan-200">
                            {msg.senderUserName}
                          </p>
                        )}

                        {msg.type === 'document' && msg.media && (
                          <div className="mb-2 flex items-center gap-2.5 rounded-xl bg-black/30 p-2.5 border border-white/15">
                            <FileText className="h-5 w-5 shrink-0 text-cyan-300" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-bold">
                                {msg.media.fileName || 'Ordem_de_Servico.pdf'}
                              </p>
                              <p className="text-xs opacity-75">
                                PDF Oficial • Cloud Storage
                              </p>
                            </div>
                          </div>
                        )}

                        <p className="whitespace-pre-wrap">{msg.body}</p>

                        <div className="mt-1.5 flex items-center justify-end gap-1 font-mono text-xs opacity-75">
                          <span>{formatShortTime(msg.createdAt)}</span>
                          {isOutbound && <CheckCheck className="h-3.5 w-3.5" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form
              onSubmit={handleSendText}
              className="border-t border-white/10 bg-[#070b16]/90 p-3.5"
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  title="Anexar arquivo"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-slate-200"
                >
                  <Paperclip className="h-4 w-4" />
                </button>

                <input
                  type="text"
                  value={draftMessage}
                  onChange={(e) => setDraftMessage(e.target.value)}
                  placeholder="Digite sua mensagem para enviar via WhatsApp..."
                  className="h-10 flex-1 rounded-xl border border-white/10 bg-[#03060c] px-3.5 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500/60 focus:outline-none"
                />

                <button
                  type="submit"
                  disabled={!draftMessage.trim() || isSendingMsg}
                  className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 text-xs font-bold text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] transition hover:opacity-95 disabled:opacity-40"
                >
                  <Send className="h-3.5 w-3.5" />
                  Enviar
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-xs text-slate-500">
            <MessageSquarePlus className="h-8 w-8 text-cyan-400/40" />
            <span>Crie ou selecione um atendimento na coluna à esquerda.</span>
          </div>
        )}
      </main>

      {/* =====================================================================
          COLUNA 3: PAINEL LATERAL CRM / ORDENS DE SERVIÇO / WMS
      ===================================================================== */}
      <aside className="hidden w-80 shrink-0 flex-col border-l border-white/10 bg-[#070b16]/80 xl:flex xl:w-96">
        <div className="border-b border-white/10 p-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Ficha CRM & Ordens de Serviço
            </h3>
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          {linkedCustomer ? (
            <div className="rounded-2xl border border-white/10 bg-[#03060c]/80 p-4">
              <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-xs font-bold uppercase text-emerald-400 border border-emerald-500/30">
                Conta {linkedCustomer.type.toUpperCase()}
              </span>
              <h4 className="mt-2 text-sm font-bold text-white">
                {linkedCustomer.name}
              </h4>
              <p className="font-mono text-xs text-slate-400">
                Doc: {linkedCustomer.documentNumber}
              </p>

              <div className="mt-3 space-y-1.5 border-t border-white/10 pt-3 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-cyan-400" />
                  <span>{linkedCustomer.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-cyan-400" />
                  <span className="truncate">{linkedCustomer.email}</span>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
                <div className="rounded-xl bg-white/5 p-2.5 border border-white/5">
                  <span className="text-xs text-slate-400">Crédito</span>
                  <p className="font-mono text-xs font-bold text-emerald-400">
                    {formatCurrencyBrl(linkedCustomer.creditLimitCents)}
                  </p>
                </div>
                <div className="rounded-xl bg-white/5 p-2.5 border border-white/5">
                  <span className="text-xs text-slate-400">Faturado</span>
                  <p className="font-mono text-xs font-bold text-slate-100">
                    {formatCurrencyBrl(linkedCustomer.totalSpentCents)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-[#03060c]/60 p-4 text-xs text-slate-400">
              Cadastre este cliente na aba <strong>Clientes B2B</strong> para vincular limite de crédito e histórico.
            </div>
          )}

          <div>
            <div className="mb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300">
                <Package className="h-3.5 w-3.5 text-cyan-400" />
                Ordens de Serviço ({customerOrders.length})
              </span>
            </div>

            {customerOrders.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-[#03060c]/60 p-4 text-xs text-slate-500">
                Nenhuma OS emitida para este contato ainda.
              </div>
            ) : (
              <div className="space-y-3">
                {customerOrders.map((order) => {
                  const isDispatching = sendingPdfOrderId === order.id;

                  return (
                    <div
                      key={order.id}
                      className="rounded-2xl border border-white/10 bg-[#03060c]/90 p-3.5 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-cyan-400">
                          {order.orderNumber}
                        </span>
                        <span className="rounded-md bg-cyan-500/15 px-2 py-0.5 text-xs font-semibold text-cyan-300 border border-cyan-500/30">
                          {order.status}
                        </span>
                      </div>

                      <div className="mt-2.5 space-y-1.5 border-t border-white/10 pt-2.5">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-start justify-between gap-2 text-xs"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-medium text-slate-200">
                                {item.quantity}x {item.name}
                              </p>
                              {item.warehouseBinLocation && (
                                <span className="font-mono text-xs text-slate-400">
                                  WMS: {item.warehouseBinLocation}
                                </span>
                              )}
                            </div>
                            <span className="shrink-0 font-mono text-slate-300">
                              {formatCurrencyBrl(item.subtotalCents)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2.5">
                        <div>
                          <span className="text-xs text-slate-400">
                            Valor Total
                          </span>
                          <p className="font-mono text-sm font-bold text-white">
                            {formatCurrencyBrl(order.financials.grandTotalCents)}
                          </p>
                        </div>

                        <button
                          type="button"
                          disabled={isDispatching}
                          onClick={() => handleTriggerOrderPdf(order)}
                          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-3 py-2 text-xs font-bold text-white shadow transition hover:opacity-95 disabled:opacity-50"
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
            )}
          </div>
        </div>
      </aside>

      {/* MODAL NOVO CHAT */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#070b16] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white">
                Iniciar Novo Atendimento WhatsApp
              </h3>
              <button
                type="button"
                onClick={() => setShowNewChatModal(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateNewChatSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block mb-1 font-semibold text-slate-300">
                  Nome do Cliente / Empresa
                </label>
                <input
                  required
                  type="text"
                  value={newChatName}
                  onChange={(e) => setNewChatName(e.target.value)}
                  placeholder="Digite o nome real do cliente"
                  className="w-full rounded-xl border border-white/10 bg-[#03060c] px-3 py-2.5 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold text-slate-300">
                  WhatsApp (com DDD)
                </label>
                <input
                  required
                  type="text"
                  value={newChatPhone}
                  onChange={(e) => setNewChatPhone(e.target.value)}
                  placeholder="Ex: +55 11 99999-9999"
                  className="w-full rounded-xl border border-white/10 bg-[#03060c] px-3 py-2.5 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold text-slate-300">
                  Departamento
                </label>
                <select
                  value={newChatDept}
                  onChange={(e) =>
                    setNewChatDept(e.target.value as WhatsAppChat['department'])
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#03060c] px-3 py-2.5 text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="sales">Comercial / Vendas (sales)</option>
                  <option value="warehouse">Logística / Estoque (warehouse)</option>
                  <option value="support">Suporte Técnico (support)</option>
                  <option value="finance">Financeiro (finance)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewChatModal(false)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 font-bold text-white"
                >
                  Criar Atendimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
