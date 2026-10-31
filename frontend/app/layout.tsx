import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OmniFlow CRM & WMS Enterprise | SaaS Multi-Tenant',
  description:
    'Plataforma Enterprise de CRM, Funil de Vendas, Ordens de Serviço, Estoque WMS e Central WhatsApp Multi-Atendente.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}

