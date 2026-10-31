'use client';

import React, { useState } from 'react';
import {
  QrCode,
  Smartphone,
  RefreshCw,
  ExternalLink,
  Settings2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Server,
  MessageSquare,
  Sliders,
} from 'lucide-react';

export interface WhatsAppGatewayConfig {
  mode: 'evolution_api' | 'whatsapp_web_direct';
  baseUrl: string;
  instanceName: string;
  apiKey: string;
  connectedPhone: string;
  autoSendOrderPdf: boolean;
  signaturePrefix: boolean;
  orderMessageTemplate: string;
}

export interface WhatsAppConnectionPanelProps {
  config: WhatsAppGatewayConfig;
  onSaveConfig: (next: WhatsAppGatewayConfig) => void;
}

export default function WhatsAppConnectionPanel({
  config,
  onSaveConfig,
}: WhatsAppConnectionPanelProps) {
  const [form, setForm] = useState<WhatsAppGatewayConfig>(config);
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<
    'idle' | 'loading' | 'qr_ready' | 'connected' | 'error'
  >('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [testPhone, setTestPhone] = useState<string>('');
  const [testText, setTestText] = useState<string>(
    'Olá! Teste de conexão direta do OmniFlow CRM/WMS.'
  );

  function handleFieldChange<K extends keyof WhatsAppGatewayConfig>(
    key: K,
    value: WhatsAppGatewayConfig[K]
  ) {
    const updated = { ...form, [key]: value };
    setForm(updated);
    onSaveConfig(updated);
  }

  async function handleConnectEvolutionQr() {
    if (!form.baseUrl.trim() || !form.instanceName.trim() || !form.apiKey.trim()) {
      setConnectionState('error');
      setStatusMessage(
        'Preencha a URL da Evolution API, Nome da Instância e API Key para buscar o QR Code do servidor.'
      );
      return;
    }

    setConnectionState('loading');
    setStatusMessage('Consultando instância e gerando QR Code do WhatsApp...');
    setQrBase64(null);
    setPairingCode(null);

    try {
      const cleanUrl = form.baseUrl.replace(/\/+$/, '');
      const res = await fetch(
        `${cleanUrl}/instance/connect/${encodeURIComponent(form.instanceName)}`,
        {
          method: 'GET',
          headers: {
            apikey: form.apiKey.trim(),
          },
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Verifique URL, Instância e API Key.`);
      }

      const data = (await res.json()) as {
        base64?: string;
        code?: string;
        pairingCode?: string;
        instance?: { state?: string };
      };

      if (data.instance?.state === 'open') {
        setConnectionState('connected');
        setStatusMessage('WhatsApp já está conectado e sincronizado nesta instância!');
        return;
      }

      if (data.base64) {
        setQrBase64(data.base64);
        setPairingCode(data.pairingCode || null);
        setConnectionState('qr_ready');
        setStatusMessage(
          'Escaneie o QR Code abaixo no seu celular (WhatsApp > Aparelhos Conectados > Conectar Aparelho).'
        );
      } else {
        setConnectionState('connected');
        setStatusMessage('Instância verificada com sucesso.');
      }
    } catch (err) {
      setConnectionState('error');
      setStatusMessage(
        err instanceof Error
          ? err.message
          : 'Não foi possível conectar na Evolution API.'
      );
    }
  }

  function handleOpenDirectWhatsAppWeb(phone?: string, message?: string) {
    const digits = (phone || testPhone || form.connectedPhone).replace(/\D/g, '');
    const normalized =
      digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
    const encodedMsg = encodeURIComponent(message || testText);

    const url = normalized
      ? `https://web.whatsapp.com/send?phone=${normalized}&text=${encodedMsg}`
      : `https://web.whatsapp.com/`;

    window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* COLUNA ESQUERDA: CONEXÃO WHATSAPP WEB (QR CODE / MODO DIRETO) */}
      <div className="lg:col-span-5 space-y-5">
        <div className="rounded-2xl border border-white/10 bg-[#070b16]/95 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <QrCode className="h-5 w-5 text-cyan-400" />
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                Conexão WhatsApp Web
              </h3>
            </div>
            <span className="rounded-full bg-cyan-500/15 px-2.5 py-0.5 font-mono text-xs font-bold text-cyan-300 border border-cyan-500/30">
              {form.mode === 'evolution_api' ? 'API Gateway' : 'Web Direto'}
            </span>
          </div>

          {/* Seletor de Modo de Operação */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleFieldChange('mode', 'whatsapp_web_direct')}
              className={`rounded-xl p-3 text-left border transition ${
                form.mode === 'whatsapp_web_direct'
                  ? 'border-cyan-400 bg-cyan-500/15 text-white'
                  : 'border-white/10 bg-[#03060c] text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs">
                <ExternalLink className="h-4 w-4 text-cyan-400" />
                WhatsApp Web Direto
              </div>
              <p className="mt-1 text-xs opacity-80">
                Abre direto o WhatsApp Web oficial na conversa do cliente com 1 clique.
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleFieldChange('mode', 'evolution_api')}
              className={`rounded-xl p-3 text-left border transition ${
                form.mode === 'evolution_api'
                  ? 'border-cyan-400 bg-cyan-500/15 text-white'
                  : 'border-white/10 bg-[#03060c] text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs">
                <Server className="h-4 w-4 text-cyan-400" />
                Evolution API / Z-API
              </div>
              <p className="mt-1 text-xs opacity-80">
                Conecta via QR Code da sua instância para disparo em segundo plano.
              </p>
            </button>
          </div>

          {/* Painel QR Code ou Abertura Direta */}
          {form.mode === 'whatsapp_web_direct' ? (
            <div className="rounded-2xl border border-white/10 bg-[#03060c] p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  <Smartphone className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase">
                    Acesso Direto ao WhatsApp Web Oficial
                  </h4>
                  <p className="text-xs text-slate-400">
                    Conecta o seu próprio navegador ao `web.whatsapp.com` e abre o chat de qualquer cliente ou Ordem de Serviço na hora.
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-white/10 text-xs">
                <label className="block font-semibold text-slate-300">
                  Testar Abertura de Conversa Agora (DDD + Número)
                </label>
                <input
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="Ex: 11999999999"
                  className="w-full rounded-xl border border-white/10 bg-[#070b16] px-3 py-2.5 font-mono text-white"
                />
                <input
                  type="text"
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  placeholder="Mensagem inicial..."
                  className="w-full rounded-xl border border-white/10 bg-[#070b16] px-3 py-2.5 text-white"
                />
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleOpenDirectWhatsAppWeb()}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-2.5 text-xs font-bold text-white shadow-[0_0_20px_rgba(16,185,129,0.35)] hover:opacity-95 transition"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Abrir WhatsApp da Pessoa Agora
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-[#03060c] p-5 text-center space-y-4">
              {qrBase64 ? (
                <div className="space-y-3">
                  <img
                    src={qrBase64}
                    alt="WhatsApp QR Code"
                    className="mx-auto h-52 w-52 rounded-xl border-4 border-white bg-white p-2"
                  />
                  {pairingCode && (
                    <p className="font-mono text-xs text-cyan-400">
                      Código de Pareamento: <strong>{pairingCode}</strong>
                    </p>
                  )}
                </div>
              ) : (
                <div className="py-6 space-y-2">
                  <QrCode className="mx-auto h-14 w-14 text-cyan-400/40" />
                  <p className="text-xs text-slate-400">
                    Clique abaixo para gerar o QR Code real da sua instância Evolution API.
                  </p>
                </div>
              )}

              {statusMessage && (
                <div
                  className={`rounded-xl p-3 text-xs font-medium flex items-center gap-2 text-left ${
                    connectionState === 'error'
                      ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                  }`}
                >
                  {connectionState === 'error' ? (
                    <AlertCircle className="h-4 w-4 shrink-0" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  )}
                  <span>{statusMessage}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleConnectEvolutionQr}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-2.5 text-xs font-bold text-white shadow-[0_0_20px_rgba(6,182,212,0.35)]"
              >
                <RefreshCw className="h-4 w-4" />
                Gerar QR Code / Verificar Conexão
              </button>
            </div>
          )}
        </div>
      </div>

      {/* COLUNA DIREITA: CONFIGURAÇÕES PERSONALIZADAS DO WHATSAPP & AUTOMAÇÃO */}
      <div className="lg:col-span-7 space-y-5">
        <div className="rounded-2xl border border-white/10 bg-[#070b16]/95 p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
            <Settings2 className="h-5 w-5 text-cyan-400" />
            <h3 className="text-sm font-black uppercase tracking-wider text-white">
              Configurações do Gateway, Mensagens & Automação
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
            <div>
              <label className="block mb-1 font-semibold text-slate-300">
                Seu Número Principal de WhatsApp
              </label>
              <input
                type="text"
                value={form.connectedPhone}
                onChange={(e) =>
                  handleFieldChange('connectedPhone', e.target.value)
                }
                placeholder="Ex: +55 11 99999-9999"
                className="w-full rounded-xl border border-white/10 bg-[#03060c] px-3 py-2.5 font-mono text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block mb-1 font-semibold text-slate-300">
                Nome da Instância (Evolution API)
              </label>
              <input
                type="text"
                value={form.instanceName}
                onChange={(e) =>
                  handleFieldChange('instanceName', e.target.value)
                }
                placeholder="Ex: omniflow_producao"
                className="w-full rounded-xl border border-white/10 bg-[#03060c] px-3 py-2.5 font-mono text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block mb-1 font-semibold text-slate-300">
                URL do Servidor Evolution API / Z-API
              </label>
              <input
                type="url"
                value={form.baseUrl}
                onChange={(e) => handleFieldChange('baseUrl', e.target.value)}
                placeholder="https://sua-evolution-api.com"
                className="w-full rounded-xl border border-white/10 bg-[#03060c] px-3 py-2.5 font-mono text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block mb-1 font-semibold text-slate-300">
                Global / Instance API Key
              </label>
              <input
                type="password"
                value={form.apiKey}
                onChange={(e) => handleFieldChange('apiKey', e.target.value)}
                placeholder="••••••••••••••••••••"
                className="w-full rounded-xl border border-white/10 bg-[#03060c] px-3 py-2.5 font-mono text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Template de Mensagem de Ordem de Serviço */}
          <div className="space-y-2 pt-2 border-t border-white/10 text-xs">
            <label className="block font-semibold text-slate-300">
              Template Padrão ao Enviar Ordem de Serviço (Variáveis:{' '}
              <code className="text-cyan-400">{'{cliente}'}</code>,{' '}
              <code className="text-cyan-400">{'{os}'}</code>,{' '}
              <code className="text-cyan-400">{'{valor}'}</code>,{' '}
              <code className="text-cyan-400">{'{itens}'}</code>)
            </label>
            <textarea
              rows={4}
              value={form.orderMessageTemplate}
              onChange={(e) =>
                handleFieldChange('orderMessageTemplate', e.target.value)
              }
              className="w-full rounded-xl border border-white/10 bg-[#03060c] p-3 text-white focus:border-cyan-500 focus:outline-none leading-relaxed"
            />
          </div>

          {/* Switches de Comportamento */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-2 border-t border-white/10 text-xs">
            <label className="flex items-center justify-between rounded-xl border border-white/10 bg-[#03060c] p-3 cursor-pointer">
              <div>
                <span className="font-bold text-white block">
                  Assinar Nome do Operador
                </span>
                <span className="text-slate-400">
                  Prefixa o nome do atendente nas mensagens
                </span>
              </div>
              <input
                type="checkbox"
                checked={form.signaturePrefix}
                onChange={(e) =>
                  handleFieldChange('signaturePrefix', e.target.checked)
                }
                className="h-4 w-4 accent-cyan-400"
              />
            </label>

            <label className="flex items-center justify-between rounded-xl border border-white/10 bg-[#03060c] p-3 cursor-pointer">
              <div>
                <span className="font-bold text-white block">
                  Disparo Automático ao Emitir OS
                </span>
                <span className="text-slate-400">
                  Abre o WhatsApp do cliente assim que gerar a OS
                </span>
              </div>
              <input
                type="checkbox"
                checked={form.autoSendOrderPdf}
                onChange={(e) =>
                  handleFieldChange('autoSendOrderPdf', e.target.checked)
                }
                className="h-4 w-4 accent-cyan-400"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

