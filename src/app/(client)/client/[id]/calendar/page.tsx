"use client";

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { CURRENT_MONTH, worksFor, TODAY, MONTH_NAMES } from '@/lib/mock-data';
import { getClient, getWorksForClient, Client, Work } from '@/lib/data';
import { Icon } from '@/components/ui/icon';
import { WorkRow } from '@/components/shared/work-row';
import { MiniCalendar } from '@/components/shared/mini-calendar';

export default function ClienteCalendarPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const clientId = unwrappedParams.id;
  const [client, setClient] = useState<Client | null>(null);
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<{ day: Date, list: any[] } | null>(null);

  useEffect(() => {
    Promise.all([getClient(clientId), getWorksForClient(clientId)]).then(([c, w]) => {
      setClient(c);
      setWorks(w);
      setLoading(false);
    });
  }, [clientId]);

  if (loading) return <div style={{ padding: 40, opacity: 0.5 }}>Cargando datos...</div>;
  if (!client) return <div style={{ padding: 40 }}>Cliente no encontrado</div>;

  const monthWorks = worksFor(works, client.id, CURRENT_MONTH.year, CURRENT_MONTH.month);

  const handleOpenWork = (workId: string) => {
    router.push(`/client/${clientId}/work/${workId}`);
  };

  return (
    <>
      <div className="client-hero">
        <div className="month">
          <span>Mayo 2026</span>
          <div className="nav">
            <button><Icon name="chevron_left" size={14} /></button>
            <button><Icon name="chevron_right" size={14} /></button>
          </div>
        </div>
        <div className="h2" style={{ margin: 0 }}>Calendario editorial</div>
        <div className="text-muted mt-2" style={{ fontSize: 13 }}>Cuándo se publica cada pieza este mes</div>
      </div>
      <div className="client-section">
        <div className="card card-pad">
          <MiniCalendar year={2026} month={4} works={monthWorks} onPickDay={(d, list) => setSelected({ day: d, list })} />
          <div className="row gap-4 mt-6" style={{ fontSize: 11, flexWrap: 'wrap' }}>
            <span className="row gap-2"><span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--warn)' }} /> Borrador</span>
            <span className="row gap-2"><span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--accent)' }} /> Programado</span>
            <span className="row gap-2"><span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--ok)' }} /> Publicado</span>
          </div>
        </div>

        <div className="client-section-head" style={{ marginTop: 18 }}>
          <div className="ttl">
            {selected ? `${selected.day.getDate()} de ${MONTH_NAMES[selected.day.getMonth()].toLowerCase()}` : 'Próximas publicaciones'}
          </div>
        </div>
        <div className="work-list">
          {(selected ? selected.list : monthWorks.filter(w => w.date >= TODAY).sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 4))
            .map((w: any) => <WorkRow key={w.id} work={w} onClick={() => handleOpenWork(w.id)} compact />)}
        </div>
      </div>
    </>
  );
}
