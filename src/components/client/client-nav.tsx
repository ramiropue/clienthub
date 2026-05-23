"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getClient, Client } from '@/lib/data';
import { useEffect, useState, useRef } from 'react';
import { Icon } from '@/components/ui/icon';
import { AvatarCustom } from '@/components/ui/avatar-custom';
import { NotificationsBell } from '@/components/shared/notifications-bell';
import { createClient } from '@/lib/supabase/client';
import { updateClientAction } from '@/app/actions/clients';

export function ClienteTopbar({ clientId }: { clientId: string }) {
  const [client, setClient] = useState<Client | null>(null);
  const [localLogo, setLocalLogo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    getClient(clientId).then((c) => {
      setClient(c);
      if (c?.logoUrl) setLocalLogo(c.logoUrl);
    });
  }, [clientId]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (!client) return null;

  return (
    <div className="client-topbar">
      <Link href="/" className="brand" style={{ textDecoration: 'none', cursor: 'pointer' }}>
        <span className="dot-mark" /> ClientHub
      </Link>
      <div className="row gap-3" style={{ alignItems: 'center' }}>
        <NotificationsBell recipient="client" clientId={clientId} />
        <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()} title="Cambiar foto de perfil">
          <AvatarCustom name={client.name} color={client.color} initials={client.initials} size="sm" logoUrl={localLogo} />
          <input 
            type="file" 
            accept="image/*" 
            style={{ display: 'none' }} 
            ref={fileInputRef}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                // Show preview immediately
                const reader = new FileReader();
                reader.onload = (evt) => setLocalLogo(evt.target?.result as string);
                reader.readAsDataURL(file);
                
                // Upload to Storage
                const fileExt = file.name.split('.').pop();
                const fileName = `client-${clientId}-${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                  .from('client-logos')
                  .upload(fileName, file);
                  
                if (!uploadError) {
                  const { data } = supabase.storage.from('client-logos').getPublicUrl(fileName);
                  await updateClientAction(clientId, { logo_url: data.publicUrl });
                }
              }
            }}
          />
        </div>
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
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
        >
          <Icon name="logout" size={16} />
        </button>
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
    <nav className="client-bottomnav" style={{
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
