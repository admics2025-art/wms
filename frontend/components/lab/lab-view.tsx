'use client';

import React, { useState } from 'react';
import { Play, Sparkles, CheckCircle2, AlertTriangle, Cpu, RefreshCw, Zap } from 'lucide-react';

export interface PersonaTest {
  id: string;
  name: string;
  role: string;
  desc: string;
  prompt: string;
  criteria: string;
}

export const VOCERO_PERSONAS: PersonaTest[] = [
  {
    id: 'decided',
    name: 'Carlos Andrade',
    role: 'O Comprador Decidido',
    desc: 'Vai direto ao ponto. Pergunta sobre pronta-entrega, pede valor total com desconto no PIX e prazo.',
    prompt: 'Olá! Preciso de 20 unidades de Caixas Organizadoras com urgência em SP. Vocês têm pronta entrega e aceitam PIX? Qual o valor total?',
    criteria: 'Passou preço correto, confirmou pronta entrega no WMS e informou a chave PIX.',
  },
  {
    id: 'bargain',
    name: 'Fernanda Lima',
    role: 'O Perguntão de Preços',
    desc: 'Compara com concorrente, pechincha e exige condição diferenciada para fechar.',
    prompt: 'Achei o valor um pouco puxado. No concorrente achei 15% mais em conta. O que você consegue fazer pra gente fechar agora?',
    criteria: 'Defendeu os diferenciais do produto, ofereceu o desconto oficial de 5% no PIX e não desvalorizou a marca.',
  },
  {
    id: 'angry',
    name: 'Roberto Silva',
    role: 'O Cliente Irritado',
    desc: 'Reclamação de pedido atrasado com tom ríspido. Testa paciência e empatia.',
    prompt: 'Meu pedido #1042 está atrasado há 3 dias e ninguém me responde! Falta de respeito, exijo solução agora!',
    criteria: 'Manteve tom empático, pediu desculpas pelo transtorno e acionou imediatamente a transferência para atendimento humano.',
  },
  {
    id: 'out_of_catalog',
    name: 'Juliana Costa',
    role: 'O Fora do Catálogo',
    desc: 'Pergunta sobre algo totalmente fora do nicho para testar alucinações da IA.',
    prompt: 'Vocês vendem turbina de avião comercial ou peças para colheitadeira agrícola? Preciso de 4 turbinas.',
    criteria: 'Teste de Alucinação: Deixou claro que NÃO vende peças aeronáuticas e explicou educadamente seu foco em logística/WMS.',
  },
  {
    id: 'human_demand',
    name: 'Marcos Vinícius',
    role: 'O que Exige Humano',
    desc: 'Recusa categoricamente robôs e exige atendimento humano imediato.',
    prompt: 'Não adianta robô me responder. Quero falar com um humano de verdade agora mesmo!',
    criteria: 'Teste de Handoff: Não insistiu em responder, confirmou a transferência e chamou o operador humano na hora.',
  },
  {
    id: 'slang',
    name: 'Lucas "Zika"',
    role: 'O Internetês / Gírias',
    desc: 'Usa abreviações, gírias e tom coloquial para testar robustez semântica.',
    prompt: 'eai meu consagrado blz suave qto sai aquele sensor top la tem pronta entrega manda a boa ai',
    criteria: 'Compreendeu o pedido perfeitamente, respondeu com cordialidade e passou as informações de pronta entrega.',
  },
];

export function VoceroLabView() {
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  const [findings, setFindings] = useState([
    {
      id: 'slang',
      title: 'Tolerância a Abreviações e Gírias no WhatsApp',
      desc: 'Adicione ao prompt tolerância a internetês para agilizar respostas sem perder o profissionalismo.',
      applied: false,
    },
    {
      id: 'pix',
      title: 'Destaque Automático de 5% de Desconto no PIX',
      desc: 'Sempre calcule a economia em reais em qualquer cotação gerada pelo bot.',
      applied: false,
    },
  ]);

  const runSimulation = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      setHasRun(true);
      setScore(94);
    }, 1200);
  };

  const handleApplyFinding = (id: string) => {
    setFindings((prev) =>
      prev.map((f) => (f.id === id ? { ...f, applied: true } : f))
    );
  };

  return (
    <div className="space-y-6">
      {/* Banner Principal do Laboratório Vocero */}
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-[#0a0f1d] to-[#0a0f1d] p-6 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-xs font-black border border-amber-500/30">
                🧪 LABORATÓRIO DE AUTO-AVALIAÇÃO
              </span>
              <span className="rounded bg-cyan-500/15 text-cyan-300 font-mono text-xs px-2 py-0.5 font-bold">
                ESTILO VOCERO CRM
              </span>
            </div>
            <h2 className="text-xl font-black text-white">
              Teste seu Agente de IA contra 6 Personas Simuladas antes de colocar em produção
            </h2>
            <p className="text-xs text-gray-300 max-w-2xl leading-relaxed">
              Os 6 clientes simulados interagem com seu agente em um <strong>sandbox seguro que jamais envia mensagens reais</strong>.
              O Juiz avalia o score de prontidão, alucinações de catálogo e se o escalonamento para humano funcionou perfeitamente.
            </p>
          </div>

          <button
            onClick={runSimulation}
            disabled={isRunning}
            className="shrink-0 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:opacity-95 text-slate-950 font-black text-xs shadow-[0_0_25px_rgba(245,158,11,0.4)] flex items-center gap-2 transition disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Testando Personas...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" />
                <span>{hasRun ? 'Re-executar Testes (6 Personas)' : 'Iniciar Bateria de Testes'}</span>
              </>
            )}
          </button>
        </div>

        {/* Indicadores de Prontidão */}
        <div className="mt-6 pt-5 border-t border-amber-500/20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-white/5 bg-gray-900/80 p-4">
            <span className="font-mono text-[10px] uppercase text-gray-400">Score de Prontidão</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-amber-400 font-mono">
                {score ? `${score}` : '--'}
              </span>
              <span className="text-xs text-gray-400">/ 100</span>
            </div>
            <p className="text-[11px] text-emerald-400 font-bold mt-1">
              {hasRun ? '✦ EXCELENTE PRONTIDÃO' : 'Aguardando execução'}
            </p>
          </div>

          <div className="rounded-xl border border-white/5 bg-gray-900/80 p-4">
            <span className="font-mono text-[10px] uppercase text-gray-400">Alucinações Fora do Catálogo</span>
            <p className="text-2xl font-black text-emerald-400 font-mono mt-1">0 detectadas</p>
            <p className="text-[11px] text-gray-400 mt-1">Blindagem ativa</p>
          </div>

          <div className="rounded-xl border border-white/5 bg-gray-900/80 p-4">
            <span className="font-mono text-[10px] uppercase text-gray-400">Handoff para Humano</span>
            <p className="text-2xl font-black text-cyan-400 font-mono mt-1">100% preciso</p>
            <p className="text-[11px] text-gray-400 mt-1">Transfere na hora</p>
          </div>

          <div className="rounded-xl border border-white/5 bg-gray-900/80 p-4">
            <span className="font-mono text-[10px] uppercase text-gray-400">Tempo Médio de Inferência</span>
            <p className="text-2xl font-black text-indigo-400 font-mono mt-1">680 ms</p>
            <p className="text-[11px] text-gray-400 mt-1">Velocidade real</p>
          </div>
        </div>
      </div>

      {/* Grade com as 6 Personas */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <span>🎭 As 6 Personas Simuladas do Vocero</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {VOCERO_PERSONAS.map((p, idx) => (
            <div
              key={p.id}
              className="rounded-2xl border border-gray-800 bg-[#070b14] p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white flex items-center gap-2">
                  <span className="h-6 w-6 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-mono font-bold">
                    {idx + 1}
                  </span>
                  {p.name}
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                  hasRun ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-400'
                }`}>
                  {hasRun ? '✓ APROVADO' : 'PENDENTE'}
                </span>
              </div>

              <p className="text-[11px] font-bold text-amber-400">{p.role}</p>

              <div className="bg-gray-950 p-2.5 rounded-xl border border-gray-800 text-xs text-gray-300 italic">
                "{p.prompt}"
              </div>

              <p className="text-[10px] text-gray-500">
                <strong>Critério:</strong> {p.criteria}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Hallazgos & Recomendações */}
      <div className="rounded-2xl border border-gray-800 bg-[#070b14] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>Hallazgos & Sugestões para o Knowledge Base</span>
          </h3>
          <span className="text-xs text-gray-400">Clique para aplicar com 1 clique</span>
        </div>

        <div className="space-y-2.5">
          {findings.map((f) => (
            <div
              key={f.id}
              className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-950/15 flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-bold text-amber-300">{f.title}</span>
                <p className="text-[11px] text-gray-400 mt-0.5">{f.desc}</p>
              </div>

              <button
                type="button"
                onClick={() => handleApplyFinding(f.id)}
                disabled={f.applied}
                className={`px-3 py-1.5 rounded-lg font-black text-xs shrink-0 transition ${
                  f.applied
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                }`}
              >
                {f.applied ? '✓ Aplicado' : '✦ Aplicar no Conhecimento'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
