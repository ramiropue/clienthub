"use client";

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { totalFor, eur } from '@/lib/mock-data';
import { getClient, getWorksForClient, Client, Work } from '@/lib/data';
import { Icon } from '@/components/ui/icon';

export default function ClienteHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const clientId = unwrappedParams.id;
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

  const months = [
    { y: 2026, m: 4, label: 'Mayo 2026', state: 'En curso' },
    { y: 2026, m: 3, label: 'Abril 2026', state: 'Pagada' },
    { y: 2026, m: 2, label: 'Marzo 2026', state: 'Pagada' }
  ];

  return (
    <>
      <div className="client-hero" style={{ paddingBottom: 18 }}>
        <div className="month"><span>Tu cuenta</span></div>
        <div className="h2" style={{ margin: 0 }}>Histórico de meses</div>
        <div className="text-muted mt-2" style={{ fontSize: 13 }}>Cliente desde {client.since}</div>
      </div>
      <div className="client-section">
        <div className="card card-pad" style={{ background: 'var(--ink)', color: '#fff' }}>
          <div className="eyebrow" style={{ color: 'rgba(255,255,255,.5)' }}>Total facturado contigo</div>
          <div className="num-display mt-2" style={{ fontSize: 56, lineHeight: 1 }}>
            {eur(months.reduce((s, m) => s + totalFor(works, client.id, m.y, m.m).total, 0))}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)' }}>desde {client.since}</div>
        </div>

        <div className="mt-6">
          {months.map(m => {
            const t = totalFor(works, client.id, m.y, m.m);
            return (
              <div 
                key={m.label} 
                className="history-row" 
                onClick={() => router.push(`/client/${clientId}/invoice?y=${m.y}&m=${m.m}`)}
              >
                <div className="col" style={{ gap: 2, flex: 1 }}>
                  <div className="h-month">{m.label}</div>
                  <div className="h-meta">{t.count} piezas · cuota mensual {eur(t.retainer)}</div>
                </div>
                <span className={`badge ${m.state === 'Pagada' ? 'badge-ok' : 'badge-accent'}`}>
                  <span className="dot" /> {m.state}
                </span>
                <div className="h-amount" style={{ marginLeft: 12 }}>{eur(t.total)}</div>
                <Icon name="chevron_right" size={16} className="h-arrow" />
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
