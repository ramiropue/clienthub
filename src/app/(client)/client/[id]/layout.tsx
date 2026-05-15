import React from 'react';
import { ClienteTopbar, ClienteBottomNav } from '@/components/client/client-nav';

export default async function ClientLayout({ children, params }: { children: React.ReactNode, params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="client-app-shell" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <ClienteTopbar clientId={id} />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {children}
      </div>
      <ClienteBottomNav clientId={id} />
    </div>
  );
}
