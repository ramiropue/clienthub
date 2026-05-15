"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getClients, getWorks, Client, Work } from '@/lib/data';
import { MiniCalendar } from '@/components/shared/mini-calendar';
import { AvatarCustom } from '@/components/ui/avatar-custom';
import { Icon } from '@/components/ui/icon';

export default function AdminCalendarPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getClients(), getWorks()]).then(([c, w]) => {
      setClients(c);
      setWorks(w);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ padding: 40, opacity: 0.5 }}>Cargando datos...</div>;

  const monthWorks = works.filter(w => w.date.getFullYear() === 2026 && w.date.getMonth() === 4);

  return (
    <div>
      <div className="main-header">
        <div>
          <div className="eyebrow">Calendario editorial</div>
          <h1 className="h2" style={{ margin: '6px 0 0' }}>Mayo 2026</h1>
        </div>
        <div className="row gap-2">
          <div className="segment">
            <button className="active">Mes</button>
            <button>Semana</button>
          </div>
        </div>
      </div>
      <div className="main-content">
        <div className="card card-pad">
          <MiniCalendar year={2026} month={4} works={monthWorks} />
        </div>
        <div className="row gap-4 mt-6" style={{ flexWrap: 'wrap' }}>
          {clients.map(c => {
            const list = monthWorks.filter(w => w.clientId === c.id);
            return (
              <div 
                key={c.id} 
                className="card card-pad flex-1" 
                style={{ minWidth: 300, cursor: 'pointer' }} 
                onClick={() => router.push(`/admin/client/${c.id}`)}
              >
                <div className="row gap-3" style={{ alignItems: 'center' }}>
                  <AvatarCustom name={c.name} color={c.color} initials={c.initials} />
                  <div className="flex-1">
                    <div style={{ fontWeight: 500 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{list.length} piezas en mayo</div>
                  </div>
                  <Icon name="chevron_right" size={16} className="text-muted" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
