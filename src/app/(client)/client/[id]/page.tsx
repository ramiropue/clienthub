"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CURRENT_MONTH, worksFor, groupByWeek, totalFor, eur, TODAY } from '@/lib/mock-data';
import { getClient, getWorksForClient, Client, Work } from '@/lib/data';
import { Icon } from '@/components/ui/icon';
import { WorkRow } from '@/components/shared/work-row';

export default function ClienteHomePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const clientId = params.id;
  const [client, setClient] = useState<Client | null>(null);
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getClient(clientId), getWorksForClient(clientId)]).then(([c, w]) => {
      setClient(c);
      setWorks(w);
      setLoading(false);
    });
  }, [clientId]);

  if (loading) return <div style={{ padding: 40, opacity: 0.5 }}>Cargando datos...</div>;
  if (!client) return <div style={{ padding: 40 }}>Cliente no encontrado</div>;

  const month = CURRENT_MONTH;
  const monthWorks = worksFor(works, client.id, month.year, month.month).sort((a, b) => b.date.getTime() - a.date.getTime());
  const groups = groupByWeek(monthWorks);
  const totals = totalFor(works, client.id, month.year, month.month);
  const pending = monthWorks.filter(w => w.status === 'borrador').length;

  const totalStr = eur(totals.total).replace('€','').trim();

  const handleOpenWork = (workId: string) => {
    // Navigate to work detail page later
    alert(`Open work ${workId}`);
  };

  return (
    <>
      <div className="client-hero">
        <div className="month">
          <span>Mayo 2026 · hasta el 15</span>
          <div className="nav">
            <button><Icon name="chevron_left" size={14} /></button>
            <button><Icon name="chevron_right" size={14} /></button>
          </div>
        </div>
        <div className="total">
          {totalStr}<em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>€</em>
        </div>
        <div className="text-muted mt-2" style={{ fontSize: 13 }}>
          Facturación acumulada de este mes
        </div>
        <div className="breakdown">
          <span className="chip"><span className="lbl">Iguala</span> <span className="val mono">{eur(totals.retainer)}</span></span>
          <span className="chip"><span className="lbl">Extras</span> <span className="val mono">{eur(totals.variable)}</span></span>
          <span className="chip"><span className="lbl">Piezas</span> <span className="val">{totals.count}</span></span>
        </div>
      </div>

      {pending > 0 && (
        <div className="client-pending fade-in" onClick={() => {
          const first = monthWorks.find(w => w.status === 'borrador');
          if (first) handleOpenWork(first.id);
        }}>
          <span className="accent-dot" />
          <div className="body">
            <div className="ttl">{pending} {pending === 1 ? 'pieza esperando' : 'piezas esperando'} tu visto bueno</div>
            <div className="sub">Échale un ojo cuando puedas — Ramiro espera para publicar</div>
          </div>
          <Icon name="chevron_right" size={18} />
        </div>
      )}

      <div className="client-section">
        <div className="client-section-head">
          <div className="ttl">Trabajos del mes</div>
          <span className="more">{monthWorks.length} en total</span>
        </div>
        {groups.map(g => (
          <div className="week-group" key={g.week}>
            <div className="week-head">
              <div className="label">Semana {g.week}</div>
              <div className="range">{g.range}</div>
            </div>
            <div className="work-list">
              {g.items.map((w: any) => (
                <WorkRow key={w.id} work={w} onClick={() => handleOpenWork(w.id)} compact />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="client-section" style={{ paddingTop: 8 }}>
        <div className="card card-pad" onClick={() => router.push(`/client/${clientId}/invoice`)} style={{ cursor: 'pointer' }}>
          <div className="row between" style={{ alignItems: 'flex-start' }}>
            <div>
              <div className="eyebrow">Factura del mes</div>
              <div className="h3 mt-2" style={{ fontFamily: 'var(--font-display)', fontSize: 24 }}>Ver y descargar</div>
              <div className="text-muted mt-2" style={{ fontSize: 12 }}>Recibo desglosado con cada trabajo</div>
            </div>
            <Icon name="arrow_up_right" size={18} />
          </div>
        </div>
      </div>
    </>
  );
}
