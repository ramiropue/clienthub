import React from 'react';
import { ClienteTopbar, ClienteBottomNav } from '@/components/client/client-nav';

export default function ClientLayout({ children, params }: { children: React.ReactNode, params: { id: string } }) {
  return (
    <div className="client-app-shell" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <ClienteTopbar clientId={params.id} />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {children}
      </div>
      <ClienteBottomNav clientId={params.id} />
    </div>
  );
}
