"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getClients, Client, getSettings, Settings } from '@/lib/data';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/ui/icon';
import { AvatarCustom } from '@/components/ui/avatar-custom';
import { NotificationsBell } from '@/components/shared/notifications-bell';

export function AdminSidebar() {
  const pathname = usePathname();
  const [clients, setClients] = useState<Client[]>([]);
  const [appSettings, setAppSettings] = useState<Settings | null>(null);

  const loadData = async () => {
    const [clientsData, settingsData] = await Promise.all([getClients(), getSettings()]);
    setClients(clientsData);
    setAppSettings(settingsData);
  };

  useEffect(() => {
    loadData();
    
    // Listen for global settings updates
    const handleUpdate = () => loadData();
    window.addEventListener('settings-updated', handleUpdate);
    return () => window.removeEventListener('settings-updated', handleUpdate);
  }, []);

  const items = [
    { id: 'dashboard', label: 'Dashboard',  icon: 'dashboard', href: '/admin' },
    { id: 'clients',   label: 'Clientes',   icon: 'users', count: clients.length, href: '/admin/clients' },
    { id: 'calendar',  label: 'Calendario', icon: 'calendar', href: '/admin/calendar' },
    { id: 'invoices',  label: 'Facturación', icon: 'invoice', href: '/admin/invoices' },
  ];
  const settings = [
    { id: 'types',    label: 'Tipos de trabajo', icon: 'wrench', href: '/admin/settings/types' },
    { id: 'settings', label: 'Ajustes',     icon: 'settings', href: '/admin/settings' },
  ];

  // Helper to determine if a route is active
  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    if (href === '/admin/settings') return pathname === '/admin/settings';
    // Clients list AND individual client pages should both highlight "Clientes"
    if (href === '/admin/clients') return pathname.startsWith('/admin/clients') || pathname.startsWith('/admin/client/');
    return pathname.startsWith(href);
  };

  return (
    <aside className="sidebar">
      <Link href="/" className="sidebar-brand" style={{ textDecoration: 'none', cursor: 'pointer' }}>
        <span className="dot-mark" /> ClientHub
      </Link>
      <div className="nav-group">
        <div className="nav-label">Trabajo</div>
        {items.map(it => (
          <Link
            key={it.id}
            href={it.href}
            className={`nav-item ${isActive(it.href) ? 'active' : ''}`}
          >
            <Icon name={it.icon} size={16} />
            <span>{it.label}</span>
            {it.count != null && <span className="count">{it.count}</span>}
          </Link>
        ))}
      </div>
      <div className="nav-group">
        <div className="nav-label">Configuración</div>
        {settings.map(it => (
          <Link
            key={it.id}
            href={it.href}
            className={`nav-item ${isActive(it.href) ? 'active' : ''}`}
          >
            <Icon name={it.icon} size={16} />
            <span>{it.label}</span>
          </Link>
        ))}
      </div>
      <div style={{ marginTop: 'auto', padding: 10 }}>
        {/* Notification bell */}
        <div style={{ padding: '4px 0 8px' }}>
          <NotificationsBell recipient="admin" align="left" />
        </div>
        <div className="row gap-3" style={{ alignItems: 'center' }}>
          <AvatarCustom 
            name={appSettings?.profileName || 'Ramiro'} 
            color={appSettings?.profileColor || '#161311'} 
            logoUrl={appSettings?.profileImageUrl}
            size="sm" 
          />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {appSettings?.profileName || 'Ramiro'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {appSettings?.profileRole || 'Social Media · Freelance'}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
