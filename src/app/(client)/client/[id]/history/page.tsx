"use client";

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { eur, worksFor } from '@/lib/mock-data';
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

  const d = new Date();
  const months = Array.from({ length: 3 }).map((_, i) => {
    const nd = new Date(d.getFullYear(), d.getMonth() - i, 1);
    return {
      y: nd.getFullYear(),
      m: nd.getMonth(),
      label: `${['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][nd.getMonth()]} ${nd.getFullYear()}`,
      state: i === 0 ? 'En curso' : 'Pagada'
    };
  });

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
            {eur(months.reduce((s, m) => {
              const list = worksFor(works, client.id, m.y, m.m);
              const billableList = list.filter(w => w.status === 'publicado');
              const v = billableList.reduce((ss: number, ww: any) => ss + (ww.price || 0), 0);
              return s + v + (client.monthlyRetainer || 0);
            }, 0))}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)' }}>desde {client.since}</div>
        </div>

        <div className="mt-6">
          {months.map(m => {
            const list = worksFor(works, client.id, m.y, m.m);
            const billableList = list.filter(w => w.status === 'publicado');
            const variable = billableList.reduce((ss: number, ww: any) => ss + (ww.price || 0), 0);
            const retainer = client.monthlyRetainer || 0;
            const total = variable + retainer;
            const count = billableList.length;
            
            return (
              <div 
                key={m.label} 
                className="history-row" 
                onClick={() => router.push(`/client/${clientId}/invoice?y=${m.y}&m=${m.m}`)}
              >
                <div className="col" style={{ gap: 2, flex: 1 }}>
                  <div className="h-month">{m.label}</div>
                  <div className="h-meta">{count} piezas · cuota mensual {eur(retainer)}</div>
                </div>
                <span className={`badge ${m.state === 'Pagada' ? 'badge-ok' : 'badge-accent'}`}>
                  <span className="dot" /> {m.state}
                </span>
                <div className="h-amount" style={{ marginLeft: 12 }}>{eur(total)}</div>
                <Icon name="chevron_right" size={16} className="h-arrow" />
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
