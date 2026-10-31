'use client';

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Kanban,
  Users,
  ClipboardList,
  Package,
  MessageSquare,
  ShieldCheck,
  Plus,
  Search,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Building2,
  FileText,
  ArrowUpRight,
  Phone,
  Mail,
} from 'lucide-react';
import WhatsAppChatLayout from '@/components/whatsapp/chat-layout';

type ActiveModule =
  | 'dashboard'
  | 'pipeline'
  | 'customers'
  | 'orders'
  | 'wms'
  | 'whatsapp'
  | 'audit';

interface DealCard {
  id: string;
  title: string;
  company: string;
  contact: string;
  valueCents: number;
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won';
  priority: 'normal' | 'high' | 'urgent';
  updatedAt: string;
}

const INITIAL_DEALS: DealCard[] = [
  {
    id: 'deal_01',
    title: 'Automação de Linha Pneumática #04',
    company: 'Indústrias Metalúrgica Atlas S.A.',
    contact: 'Eng. Marcos Viana',
    valueCents: 4850000,
    stage: 'negotiation',
    priority: 'urgent',
    updatedAt: 'Há 18 min',
  },
  {
    id: 'deal_02',
    title: 'Contrato Anual Manutenção Preventiva',
    company: 'Logística TransBrasil Ltda',
    contact: 'Carla Mendes',
    valueCents: 2900000,
    stage: 'proposal',
    priority: 'high',
    updatedAt: 'Há 2 horas',
  },
  {
    id: 'deal_03',
    title: 'Fornecimento de Sensores Indutivos M18',
    company: 'AgroTech Sul Equipamentos',
    contact: 'Roberto Nascimento',
    valueCents: 1420000,
    stage: 'qualified',
    priority: 'normal',
    updatedAt: 'Hoje, 09:15',
  },
  {
    id: 'deal_04',
    title: 'Retrofit Painel CLP Siemens S7',
    company: 'Química Industrial Vale',
    contact: 'Dr. Henrique Costa',
    valueCents: 6700000,
    stage: 'closed_won',
    priority: 'high',
    updatedAt: 'Ontem',
  },
  {
    id: 'deal_05',
    title: 'Cotação Válvulas Solenoides Inox',
    company: 'Frigorífico Estrela do Norte',
    contact: 'Juliana Paiva',
    valueCents: 980000,
    stage: 'lead',
    priority: 'normal',
    updatedAt: 'Há 35 min',
  },
];

function formatBrl(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}

export default function OmniFlowCrmApp() {
  const [activeModule, setActiveModule] = useState<ActiveModule>('dashboard');
  const [deals, setDeals] = useState<DealCard[]>(INITIAL_DEALS);

  function moveDealStage(dealId: string, nextStage: DealCard['stage']) {
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage: nextStage } : d))
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* =====================================================================
          SIDEBAR PRINCIPAL DO SITE CRM/WMS
      ===================================================================== */}
      <aside className="flex w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900/90">
        {/* Logo & Tenant */}
        <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-600 font-bold text-white shadow">
            OF
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white">
              OmniFlow CRM
            </h1>
            <p className="text-xs text-emerald-400">● Atlas Industrial (Pro)</p>
          </div>
        </div>

        {/* Menu de Navegação */}
        <nav className="flex-1 space-y-1 p-3">
          <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Módulos CRM & Vendas
          </p>

          {[
            {
              id: 'dashboard',
              label: 'Dashboard Executivo',
              icon: LayoutDashboard,
            },
            {
              id: 'pipeline',
              label: 'Funil de Vendas (Kanban)',
              icon: Kanban,
            },
            {
              id: 'customers',
              label: 'Clientes & Contas B2B',
              icon: Users,
            },
            {
              id: 'whatsapp',
              label: 'Central WhatsApp',
              icon: MessageSquare,
              badge: '3',
            },
          ].map((item) => {
            const Icon = item.icon;
            const active = activeModule === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveModule(item.id as ActiveModule)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium transition ${
                  active
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4" />
                  {item.label}
                </span>
                {item.badge && (
                  <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-bold text-slate-950">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <p className="mt-6 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Operações & WMS
          </p>

          {[
            {
              id: 'orders',
              label: 'Ordens de Serviço (OS)',
              icon: ClipboardList,
            },
            {
              id: 'wms',
              label: 'Estoque & Endereços WMS',
              icon: Package,
            },
            {
              id: 'audit',
              label: 'Auditoria & Segurança',
              icon: ShieldCheck,
            },
          ].map((item) => {
            const Icon = item.icon;
            const active = activeModule === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveModule(item.id as ActiveModule)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium transition ${
                  active
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4" />
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Usuário Logado */}
        <div className="border-t border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/20 text-xs font-bold text-sky-400 border border-sky-500/30">
              LA
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">
                Lucas Andrade
              </p>
              <p className="truncate text-xs text-slate-400">
                Role: admin • tenant_acme_01
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* =====================================================================
          ÁREA DE CONTEÚDO PRINCIPAL DO SITE
      ===================================================================== */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900/50 px-6">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-white">
              {activeModule === 'dashboard' && 'Visão Geral do CRM & Operações'}
              {activeModule === 'pipeline' && 'Pipeline Comercial & Funil Kanban'}
              {activeModule === 'customers' && 'Base de Clientes B2B / B2C'}
              {activeModule === 'orders' && 'Gestão de Ordens de Serviço e PDF'}
              {activeModule === 'wms' && 'Controle de Estoque WMS Multi-Endereço'}
              {activeModule === 'whatsapp' && 'Central WhatsApp Multi-Atendente'}
              {activeModule === 'audit' && 'Trilha de Auditoria Imutável (Compliance)'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveModule('pipeline')}
              className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-sky-500 transition"
            >
              <Plus className="h-4 w-4" />
              Nova Oportunidade / OS
            </button>
          </div>
        </header>

        {/* Conteúdo Dinâmico por Módulo */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* 1. DASHBOARD EXECUTIVO */}
          {activeModule === 'dashboard' && (
            <div className="space-y-6">
              {/* Cards de KPIs */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">
                      Receita no Pipeline (CRM)
                    </span>
                    <DollarSign className="h-4 w-4 text-emerald-400" />
                  </div>
                  <p className="mt-2 text-2xl font-bold text-white">
                    R$ 168.500,00
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-emerald-400">
                    <TrendingUp className="h-3.5 w-3.5" /> +18,4% vs mês anterior
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">
                      Ordens de Serviço Ativas
                    </span>
                    <ClipboardList className="h-4 w-4 text-sky-400" />
                  </div>
                  <p className="mt-2 text-2xl font-bold text-white">27 OS</p>
                  <p className="mt-1 text-xs text-slate-400">
                    9 em separação WMS • 18 em bancada
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">
                      Atendimentos WhatsApp
                    </span>
                    <MessageSquare className="h-4 w-4 text-emerald-400" />
                  </div>
                  <p className="mt-2 text-2xl font-bold text-white">14 Abertos</p>
                  <p className="mt-1 text-xs text-emerald-400">
                    Tempo médio de resposta: 2m 15s
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">
                      Itens Críticos no WMS
                    </span>
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                  </div>
                  <p className="mt-2 text-2xl font-bold text-white">3 SKUs</p>
                  <p className="mt-1 text-xs text-amber-400">
                    Abaixo do ponto de reposição
                  </p>
                </div>
              </div>

              {/* Atalhos Rápidos do CRM */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/70 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">
                      Últimas Negociações e Ordens de Serviço
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveModule('pipeline')}
                      className="text-xs font-semibold text-sky-400 hover:underline"
                    >
                      Abrir Kanban Completo →
                    </button>
                  </div>
                  <div className="divide-y divide-slate-800">
                    {deals.map((deal) => (
                      <div
                        key={deal.id}
                        className="flex items-center justify-between py-3"
                      >
                        <div>
                          <p className="text-xs font-semibold text-white">
                            {deal.title}
                          </p>
                          <p className="text-xs text-slate-400">
                            {deal.company} • Contato: {deal.contact}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-emerald-400">
                            {formatBrl(deal.valueCents)}
                          </p>
                          <span className="text-xs text-slate-500">
                            {deal.updatedAt}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
                  <h3 className="text-sm font-bold text-white">
                    Fluxo Operacional Integrado
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    O OmniFlow conecta seu comercial diretamente ao estoque físico e ao WhatsApp do cliente:
                  </p>
                  <div className="space-y-2.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setActiveModule('pipeline')}
                      className="w-full text-left p-3 rounded-lg border border-slate-800 bg-slate-950 hover:border-sky-500/50 transition flex items-center justify-between"
                    >
                      <span>1. Qualificar Lead no Funil Kanban</span>
                      <ArrowUpRight className="h-4 w-4 text-sky-400" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveModule('wms')}
                      className="w-full text-left p-3 rounded-lg border border-slate-800 bg-slate-950 hover:border-sky-500/50 transition flex items-center justify-between"
                    >
                      <span>2. Reservar Peças no Endereço WMS</span>
                      <ArrowUpRight className="h-4 w-4 text-sky-400" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveModule('whatsapp')}
                      className="w-full text-left p-3 rounded-lg border border-slate-800 bg-slate-950 hover:border-sky-500/50 transition flex items-center justify-between"
                    >
                      <span>3. Gerar OS em PDF e Enviar no WhatsApp</span>
                      <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. FUNIL KANBAN DO CRM */}
          {activeModule === 'pipeline' && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-5">
              {(
                [
                  { key: 'lead', title: '1. Novos Leads' },
                  { key: 'qualified', title: '2. Qualificados' },
                  { key: 'proposal', title: '3. Orçamento / OS' },
                  { key: 'negotiation', title: '4. Em Negociação' },
                  { key: 'closed_won', title: '5. Fechado / Ganho' },
                ] as const
              ).map((col) => {
                const colDeals = deals.filter((d) => d.stage === col.key);
                return (
                  <div
                    key={col.key}
                    className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/60 p-3"
                  >
                    <div className="mb-3 flex items-center justify-between px-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {col.title}
                      </span>
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-bold text-sky-400">
                        {colDeals.length}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {colDeals.map((deal) => (
                        <div
                          key={deal.id}
                          className="rounded-lg border border-slate-800 bg-slate-950 p-3.5 shadow-sm space-y-2"
                        >
                          <span className="inline-block rounded bg-sky-500/10 px-2 py-0.5 text-xs font-semibold text-sky-400 border border-sky-500/20">
                            {deal.company}
                          </span>
                          <h4 className="text-xs font-bold text-white">
                            {deal.title}
                          </h4>
                          <p className="text-xs text-slate-400">
                            Contato: {deal.contact}
                          </p>
                          <div className="flex items-center justify-between border-t border-slate-800 pt-2">
                            <span className="text-xs font-bold text-emerald-400">
                              {formatBrl(deal.valueCents)}
                            </span>
                            {col.key !== 'closed_won' && (
                              <button
                                type="button"
                                onClick={() =>
                                  moveDealStage(
                                    deal.id,
                                    col.key === 'lead'
                                      ? 'qualified'
                                      : col.key === 'qualified'
                                      ? 'proposal'
                                      : col.key === 'proposal'
                                      ? 'negotiation'
                                      : 'closed_won'
                                  )
                                }
                                className="rounded bg-slate-800 px-2 py-1 text-xs font-semibold text-sky-300 hover:bg-sky-600 hover:text-white transition"
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

          {/* 3. CENTRAL WHATSAPP EM 3 COLUNAS */}
          {activeModule === 'whatsapp' && (
            <WhatsAppChatLayout
              currentUser={{
                uid: 'usr_01',
                name: 'Lucas Andrade',
                companyId: 'tenant_acme_01',
                role: 'admin',
              }}
            />
          )}

          {/* 4. DEMAIS MÓDULOS (CLIENTES, ORDENS, WMS, AUDITORIA) */}
          {(activeModule === 'customers' ||
            activeModule === 'orders' ||
            activeModule === 'wms' ||
            activeModule === 'audit') && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Módulo Ativo: {activeModule.toUpperCase()}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Integrado com Firestore Multi-Tenant (`companyId = tenant_acme_01`) e Trilha de Auditoria.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModule('whatsapp')}
                  className="rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition"
                >
                  Ir para Disparo de OS no WhatsApp →
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

