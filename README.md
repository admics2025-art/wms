# OmniFlow CRM + WMS // Vocero-Inspired Open-Source Edition

> **CRM de WhatsApp Open-Source e Self-Hosted com Pipeline Kanban, Laboratório de Auto-Avaliação de Agente de IA e Gestão de Almoxarifado WMS Integrada.**

Inspirado na arquitetura e experiência de usuário do [**Vocero CRM**](https://github.com/kevinrivm/vocero-crm), o **OmniFlow** combina a eficiência de atendimento e vendas por WhatsApp com o poder de um sistema WMS real (endereçamento físico de galpão, reserva de itens e emissão de Ordens de Serviço com QR Code PIX).

---

## 🚀 Principais Módulos (No Estilo Vocero CRM + WMS)

### 1. 💬 Bandeja de WhatsApp em Tempo Real (Inbox 3-Colunas)
- **Coluna 1 (Conversas & Filtros):** Filtros rápidos (*Todas*, *Não lidas*, *Sem Agente*, *Com IA*), busca dinâmica por nome, número ou mensagem, e botão para iniciar novo chat.
- **Coluna 2 (Chat Ativo):** Interface idêntica ao WhatsApp Web oficial, status de envio/entrega/leitura (`✓✓`), badge destacada para respostas do agente de IA (`✦ IA`), e **toggle de handoff com 1 clique** (`[🤖 Agente IA Ativo]` ⇄ `[👤 Atendimento Humano]`).
- **Coluna 3 (Ficha do Contato):** Painel lateral com canal de origem, telefone com link direto, alteração de etapa no funil comercial, tags personalizadas, notas internas da negociação e histórico de compras/OS.

### 2. 📊 Pipeline de Vendas (Kanban Comercial)
- Funil com 6 etapas: `1. Novo Lead` → `2. Qualificado` → `3. Em Conversa` → `4. Proposta Enviada` → `5. Negociação` → `6. Fechado / Ganho`.
- Cards com valor monetário em R$, canal WhatsApp, prioridade e ações rápidas para mover de coluna com atualização em tempo real.

### 3. 🧪 Laboratório de Auto-Avaliação da IA (A peça estelar do Vocero)
O Agente de IA é posto à prova contra **6 clientes simulados** em um sandbox seguro que **jamais envia mensagens externas**:
1. **O Comprador Decidido:** Pergunta sobre pronta-entrega, pede valor total com desconto no PIX e prazo.
2. **O Perguntão de Preços:** Compara com concorrentes, pechincha e exige condição diferenciada para fechar.
3. **O Cliente Irritado:** Reclama de pedido atrasado com tom ríspido, testando paciência e empatia.
4. **O Fora do Catálogo:** Pergunta sobre produtos que a empresa NÃO vende (teste anti-alucinação).
5. **O que Exige Humano:** Recusa robôs e exige atendimento humano imediato (teste de handoff).
6. **O Internetês / Gírias:** Usa abreviações e termos coloquiais para testar robustez semântica.
- **Veredito do Juiz IA:** Pontuação **Score de 0 a 100**, métricas de alucinação, precisão de handoff e latência, além de **Hallazgos com sugestões aplicáveis com 1 clique** na Base de Conhecimento!

### 4. 🤖 Agente de IA & Base de Conhecimento (Brain)
- Configuração do nome do bot, personalidade/tom de voz (*Profissional*, *Consultivo*, *Vendedor*, *Técnico*).
- Prompt do Sistema (System Instructions) customizável.
- Editor de Base de Conhecimento com catálogo de produtos, tabela de preços, regras de frete e chave PIX para fechamento.

### 5. 📦 WMS & Estoque de Almoxarifado (Nosso Diferencial Exclusivo)
- Controle de produtos e SKUs reais com **endereçamento físico no galpão** (ex: `Rua A - Estante 02 - Nível 3`).
- Gestão de saldo físico, saldo reservado e valor unitário.
- Baixa automática no almoxarifado na emissão de pedidos.

### 6. 📄 Ordens de Serviço (OS) & Disparo WhatsApp Web
- Emissão de OS vinculada aos clientes e produtos cadastrados.
- Botão **"Abrir no WhatsApp Web"** que abre imediatamente a conversa da pessoa com o texto pronto contendo resumo dos itens, valor total formatado e chave PIX para pagamento.

### 7. 🎯 Resultados & Auditoria
- Painel analítico de reuniões com total no pipeline, conversas atendidas, taxa de resolução por IA e faturamento confirmado.
- Trilha de auditoria imutável com diff `before/after` para todas as ações.

---

## 📂 Estrutura do Repositório

```text
├── omniflow-app.html            # Aplicação standalone completa (abra direto no navegador!)
├── frontend/                    # Aplicação Next.js 14 App Router + Tailwind CSS
│   ├── app/
│   │   ├── page.tsx             # App Shell com Bandeja, Pipeline, Lab, Agente e WMS
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── whatsapp/            # Componentes de Chat, Conexão e Templates
│   │   └── documents/           # Template de OS em PDF (@react-pdf/renderer)
│   └── lib/                     # Camada de serviços e persistência
├── backend/                     # Infraestrutura Firebase / Cloud Functions
│   ├── firestore.rules          # Regras de segurança RBAC Multi-Tenant
│   ├── firestore.indexes.json   # Índices compostos
│   └── src/                     # Gatilhos de estoque WMS e auditoria
├── deploy.workflow.yml          # Pipeline de CI/CD para GitHub Actions
└── README.md
```

---

## ⚡ Como Rodar o Sistema

### Opção 1: Uso Imediato (Zero Instalação)
Basta dar um duplo clique no arquivo [`omniflow-app.html`](omniflow-app.html) em qualquer computador para abrir o CRM completo no seu navegador com persistência automática no `localStorage`.

### Opção 2: Next.js / TypeScript
```bash
# Clone o repositório
git clone https://github.com/admics2025-art/wms.git
cd wms

# Instale e rode o frontend
cd frontend
npm install
npm run dev
```
Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

---

## 📄 Licença
Código aberto sob a licença **MIT** — livre para uso pessoal, comercial e customizações.
