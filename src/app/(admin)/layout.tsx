import React from 'react';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminMobileHeader, AdminMobileBottomNav } from '@/components/admin/admin-nav';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AdminMobileHeader />
      <div className="admin-shell" style={{ flex: 1 }}>
        <AdminSidebar />
        <main className="main">
          {children}
        </main>
      </div>
      <AdminMobileBottomNav />
    </div>
  );
}

