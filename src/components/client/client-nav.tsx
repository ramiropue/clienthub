"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getClient, Client } from '@/lib/data';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/ui/icon';
import { AvatarCustom } from '@/components/ui/avatar-custom';

export function ClienteTopbar({ clientId }: { clientId: string }) {
  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    getClient(clientId).then(setClient);
  }, [clientId]);

  if (!client) return null;

  return (
    <div className="client-topbar">
      <Link href="/" className="brand" style={{ textDecoration: 'none', cursor: 'pointer' }}>
        <span className="dot-mark" /> ClientHub
      </Link>
      <div className="row gap-3" style={{ alignItems: 'center' }}>
        <button className="btn-icon" style={{ border: 0 }}><Icon name="bell" size={16} /></button>
        <AvatarCustom name={client.name} color={client.color} initials={client.initials} size="sm" />
      </div>
    </div>
  );
}

export function ClienteBottomNav({ clientId }: { clientId: string }) {
  const pathname = usePathname();
  const baseUrl = `/client/${clientId}`;

  const items = [
    { id: 'home',     label: 'Este mes', icon: 'dashboard', href: baseUrl },
    { id: 'calendar', label: 'Calendario', icon: 'calendar', href: `${baseUrl}/calendar` },
    { id: 'invoice',  label: 'Factura',  icon: 'receipt', href: `${baseUrl}/invoice` },
    { id: 'history',  label: 'Histórico', icon: 'history', href: `${baseUrl}/history` }
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <nav style={{
      position: 'sticky',
      bottom: 0,
      background: 'rgba(245,242,236,.92)',
      backdropFilter: 'blur(10px)',
      borderTop: '1px solid var(--line)',
      padding: '8px 8px 14px',
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 4,
      zIndex: 9
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
            textDecoration: 'none'
          }}
        >
          <Icon name={it.icon} size={20} stroke={isActive(it.href) ? 1.8 : 1.5} />
          <span>{it.label}</span>
        </Link>
      ))}
    </nav>
  );
}
