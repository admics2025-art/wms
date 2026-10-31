# OmniFlow CRM/WMS Enterprise

Plataforma SaaS Multi-Tenant de **CRM, Funil de Vendas Kanban, Ordens de Serviço (OS), Controle de Estoque WMS Multi-Endereço e Central WhatsApp Multi-Atendente**.

## Estrutura do Projeto (Monorepo)

- **`frontend/`**: Aplicação Web em **Next.js 14 (App Router)**, TypeScript, Tailwind CSS, `@react-pdf/renderer` (gerador de PDF de Ordem de Serviço) e Central de Atendimento WhatsApp em 3 Colunas.
- **`backend/`**: Infraestrutura **Firebase**, Regras de Segurança Multi-Tenant (`firestore.rules`), Índices (`firestore.indexes.json`) e **Cloud Functions** em TypeScript (`syncUserTenantClaims`, `onOrderStatusStockSync` e Trilha de Auditoria Imutável).
- **`.github/workflows/deploy.yml`**: Pipeline de CI/CD automatizado (Typecheck, Build e Deploy).

