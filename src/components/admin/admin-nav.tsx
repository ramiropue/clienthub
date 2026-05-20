"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getSettings, Settings, getClients, Client } from '@/lib/data';
import { Icon } from '@/components/ui/icon';
import { AvatarCustom } from '@/components/ui/avatar-custom';
import { NotificationsBell } from '@/components/shared/notifications-bell';
import { createClient } from '@/lib/supabase/client';

export function AdminMobileHeader() {
  const [appSettings, setAppSettings] = useState<Settings | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const loadData = async () => {
    const settingsData = await getSettings();
    setAppSettings(settingsData);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('settings-updated', loadData);
    return () => window.removeEventListener('settings-updated', loadData);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <header className="admin-topbar">
      <Link href="/admin" className="brand" style={{ textDecoration: 'none', cursor: 'pointer', color: 'var(--ink)' }}>
        <span className="dot-mark" /> ClientHub <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 4 }}>Admin</span>
      </Link>
      <div className="row gap-3" style={{ alignItems: 'center' }}>
        <NotificationsBell recipient="admin" />
        <Link href="/admin/settings" style={{ textDecoration: 'none' }}>
          <AvatarCustom 
            name={appSettings?.profileName || 'Ramiro'} 
            color={appSettings?.profileColor || '#161311'} 
            logoUrl={appSettings?.profileImageUrl}
            size="sm" 
          />
        </Link>
        <button 
          onClick={handleLogout}
          title="Cerrar sesión"
          style={{
            background: 'transparent',
            border: 'none',
            padding: '4px 6px',
            borderRadius: 6,
            cursor: 'pointer',
            color: 'var(--muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
        >
          <Icon name="logout" size={16} />
        </button>
      </div>
    </header>
  );
}

export function AdminMobileBottomNav() {
  const pathname = usePathname();
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    getClients().then(setClients);
    const handleUpdate = () => getClients().then(setClients);
    window.addEventListener('clients-updated', handleUpdate);
    return () => window.removeEventListener('clients-updated', handleUpdate);
  }, []);

  const items = [
    { id: 'dashboard', label: 'Resumen', icon: 'dashboard', href: '/admin' },
    { id: 'clients',   label: 'Clientes', icon: 'users', count: clients.length, href: '/admin/clients' },
    { id: 'calendar',  label: 'Calendario', icon: 'calendar', href: '/admin/calendar' },
    { id: 'invoices',  label: 'Facturas', icon: 'invoice', href: '/admin/invoices' },
    { id: 'settings',  label: 'Ajustes', icon: 'settings', href: '/admin/settings' },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    if (href === '/admin/settings') return pathname.startsWith('/admin/settings');
    if (href === '/admin/clients') return pathname.startsWith('/admin/clients') || pathname.startsWith('/admin/client/');
    return pathname.startsWith(href);
  };

  return (
    <nav className="admin-bottomnav" style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'rgba(245,242,236,.92)',
      backdropFilter: 'blur(10px)',
      borderTop: '1px solid var(--line)',
      padding: '8px 8px 14px',
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      gap: 4,
      zIndex: 99
    }}>
      {items.map(it => (
        <Link
          key={it.id}
          href={it.href}
          style={{
            background: 'transparent',
            border: 0,
            padding: '8px 4px 6px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            color: isActive(it.href) ? 'var(--ink)' : 'var(--muted)',
            fontSize: 10,
            fontWeight: isActive(it.href) ? 500 : 400,
            cursor: 'pointer',
            textDecoration: 'none',
            position: 'relative'
          }}
        >
          <div style={{ position: 'relative', display: 'inline-flex' }}>
            <Icon name={it.icon} size={20} stroke={isActive(it.href) ? 1.8 : 1.5} />
            {it.count != null && it.count > 0 && (
              <span style={{
                position: 'absolute',
                top: -4,
                right: -10,
                background: 'var(--accent)',
                color: '#fff',
                fontSize: 8,
                fontWeight: 600,
                borderRadius: 99,
                padding: '1px 4px',
                lineHeight: 1
              }}>
                {it.count}
              </span>
            )}
          </div>
          <span>{it.label}</span>
        </Link>
      ))}
    </nav>
  );
}
