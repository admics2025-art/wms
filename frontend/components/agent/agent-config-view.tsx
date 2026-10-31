'use client';

import React, { useState } from 'react';
import { Bot, Save, Sparkles, Check, Database, Sliders } from 'lucide-react';

export function AgentConfigView() {
  const [name, setName] = useState('Neo OmniBot');
  const [tone, setTone] = useState('professional');
  const [active, setActive] = useState(true);
  const [prompt, setPrompt] = useState(
    `Você é o agente inteligente de atendimento e vendas da OmniFlow.
Seu objetivo é tirar dúvidas sobre nossos produtos de almoxarifado, calcular pedidos, consultar estoque WMS e enviar a chave PIX para fechamento.
Se o cliente pedir um humano ou fizer uma reclamação grave, informe que está transferindo imediatamente para nossa equipe de especialistas.`
  );
  const [knowledge, setKnowledge] = useState(
    `• PRODUTOS PRINCIPAIS:
  - Sensor IoT de Armazém: R$ 250,00 cada. Pronta entrega.
  - Caixa Organizadora Industrial 60L: R$ 45,00 cada. Pronta entrega no galpão A-01.
  - Kit Leitor de Código de Barras WMS: R$ 380,00 cada. Pronta entrega.

• CONDIÇÕES COMERCIAIS:
  - Pagamentos à vista no PIX têm 5% de desconto.
  - Chave PIX: financeiro@omniflow.com.br
  - Frete grátis para pedidos acima de R$ 500,00 no estado de SP.
  - Prazo de despacho: até 24 horas úteis após confirmação da OS.

• REGRAS DE ATENDIMENTO:
  - Não vendemos peças pesadas automotivas nem maquinário agrícola.
  - Para garantia ou devoluções, transferir para atendente humano.`
  );
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-[#070b14] to-[#070b14] p-6 shadow-xl flex items-center justify-between">
        <div className="space-y-1">
          <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-xs font-bold border border-cyan-500/30">
            CÉREBRO DO AGENTE DE IA
          </span>
          <h2 className="text-lg font-black text-white uppercase">Personalidade, Prompt e Base de Conhecimento</h2>
          <p className="text-xs text-gray-400">
            Configure as regras de atendimento, respostas automáticas no WhatsApp e o catálogo consultado pelo robô.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow flex items-center gap-1.5 transition"
        >
          {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          <span>{saved ? 'Salvo com Sucesso!' : 'Salvar Conhecimento'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl border border-gray-800 bg-[#070b14] p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Sliders className="h-3.5 w-3.5 text-cyan-400" />
              <span>Perfil do Agente</span>
            </h3>

            <div>
              <label className="block mb-1 text-xs font-semibold text-gray-300">Nome no WhatsApp</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block mb-1 text-xs font-semibold text-gray-300">Tom de Voz</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="professional">Profissional & Cortês (Padrão B2B)</option>
                <option value="friendly">Amigável & Consultivo</option>
                <option value="sales">Focado em Fechamento de Vendas</option>
                <option value="tech">Técnico & Preciso (WMS/Engenharia)</option>
              </select>
            </div>

            <div className="pt-2 border-t border-gray-800">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-semibold text-gray-300">Ativar Respostas no Chat:</span>
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="h-4 w-4 accent-cyan-400"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-2xl border border-gray-800 bg-[#070b14] p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Bot className="h-3.5 w-3.5 text-cyan-400" />
              <span>System Prompt (Instruções Principais)</span>
            </h3>
            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full rounded-xl border border-gray-800 bg-gray-950 p-3 text-xs text-white font-mono leading-relaxed focus:border-cyan-500 focus:outline-none"
            />

            <h3 className="text-xs font-bold uppercase tracking-wider text-white pt-2 border-t border-gray-800 flex items-center gap-2">
              <Database className="h-3.5 w-3.5 text-cyan-400" />
              <span>Base de Conhecimento (Catálogo, Preços e Regras)</span>
            </h3>
            <p className="text-[11px] text-gray-400">
              O robô só responde com base no texto abaixo. Se algo não estiver informado aqui, ele não inventará nada.
            </p>
            <textarea
              rows={8}
              value={knowledge}
              onChange={(e) => setKnowledge(e.target.value)}
              className="w-full rounded-xl border border-gray-800 bg-gray-950 p-3 text-xs text-white font-mono leading-relaxed focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
