"use client";

import React, { useState, useEffect } from 'react';
import { eur, worksFor } from '@/lib/mock-data';
import { getClients, getWorks, Client, Work } from '@/lib/data';
import { AvatarCustom } from '@/components/ui/avatar-custom';

function getInvoiceTotal(works: Work[], clientId: string, year: number, month: number, retainer: number) {
  const list = worksFor(works, clientId, year, month);
  const billableList = list.filter(w => w.status === 'publicado');
  const variable = billableList.reduce((s, w) => s + w.price, 0);
  return {
    retainer,
    variable,
    total: retainer + variable,
    count: billableList.length
  };
}

export default function AdminInvoicesPage() {
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

  const months = [
    { y: 2026, m: 4, label: 'Mayo 2026', status: 'En curso' },
    { y: 2026, m: 3, label: 'Abril 2026', status: 'Cobrado' },
    { y: 2026, m: 2, label: 'Marzo 2026', status: 'Cobrado' }
  ];

  return (
    <div>
      <div className="main-header">
        <div>
          <div className="eyebrow">Facturación</div>
          <h1 className="h2" style={{ margin: '6px 0 0' }}>Tus ingresos</h1>
        </div>
      </div>
      <div className="main-content">
        {months.map(mn => {
          const byClient = clients.map(c => ({ client: c, total: getInvoiceTotal(works, c.id, mn.y, mn.m, c.monthlyRetainer || 0) }));
          const sum = byClient.reduce((s, x) => s + x.total.total, 0);
          return (
            <div key={mn.label} className="card mb-4">
              <div className="row between" style={{ padding: '18px 22px', borderBottom: '1px solid var(--line-2)' }}>
                <div className="col gap-2">
                  <div className="eyebrow">{mn.status}</div>
                  <div className="h3" style={{ fontFamily: 'var(--font-display)', fontSize: 28 }}>{mn.label}</div>
                </div>
                <div className="cell-amount" style={{ fontSize: 38 }}>{eur(sum)}</div>
              </div>
              {byClient.map(({ client, total }) => (
                <div key={client.id} className="row between" style={{ padding: '14px 22px', borderBottom: '1px solid var(--line-2)' }}>
                  <div className="row gap-3">
                    <AvatarCustom name={client.name} color={client.color} initials={client.initials} size="sm" />
                    <span style={{ fontSize: 13 }}>{client.name}</span>
                  </div>
                  <span className="mono" style={{ fontSize: 14 }}>{eur(total.total)}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
