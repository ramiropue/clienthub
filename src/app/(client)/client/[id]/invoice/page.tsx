"use client";

import React, { useState, useEffect, use } from 'react';
import { CURRENT_MONTH, worksFor, totalFor, MONTH_NAMES, getType } from '@/lib/mock-data';
import { getClient, getWorksForClient, Client, Work, getSettings, Settings } from '@/lib/data';
import { ButtonCustom } from '@/components/ui/button-custom';

export default function ClienteInvoicePage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ y?: string; m?: string }>;
}) {
  const unwrappedParams = use(params);
  const unwrappedSearchParams = use(searchParams);
  const clientId = unwrappedParams.id;
  const [client, setClient] = useState<Client | null>(null);
  const [works, setWorks] = useState<Work[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getClient(clientId), 
      getWorksForClient(clientId),
      getSettings()
    ]).then(([c, w, s]) => {
      setClient(c);
      setWorks(w);
      setSettings(s);
      setLoading(false);
    });
  }, [clientId]);

  if (loading) return <div style={{ padding: 40, opacity: 0.5 }}>Cargando datos...</div>;
  if (!client) return <div style={{ padding: 40 }}>Cliente no encontrado</div>;

  // determine month
  const yearStr = unwrappedSearchParams?.y;
  const monthStr = unwrappedSearchParams?.m;
  const my = (yearStr && monthStr) 
    ? { year: parseInt(yearStr), month: parseInt(monthStr) }
    : CURRENT_MONTH;

  const list = worksFor(works, client.id, my.year, my.month);
  const totals = totalFor(works, client.id, my.year, my.month);
  
  // group by type
  const byType: Record<string, { type: any, items: any[], total: number }> = {};
  list.forEach((w: any) => {
    if (!byType[w.type]) byType[w.type] = { type: getType(w.type), items: [], total: 0 };
    byType[w.type].items.push(w);
    byType[w.type].total += w.price;
  });
  const groups = Object.values(byType);

  const monthLabel = `${MONTH_NAMES[my.month]} ${my.year}`;

  const eurFull = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);

  return (
    <div className="invoice-page">
      <div className="client-hero" style={{ paddingBottom: 18 }}>
        <div className="month">
          <span>Factura · {monthLabel}</span>
        </div>
        <div className="h2" style={{ margin: 0 }}>Resumen del mes</div>
      </div>

      <div className="invoice-paper">
        <div className="head">
          <div className="from">
            <strong>{settings?.companyName || settings?.profileName || 'Ramiro'}</strong><br/>
            {settings?.profileRole || 'Social media & estrategia'}<br />
            {settings?.companyId && <>{settings.companyId}<br /></>}
            {settings?.companyAddress && <span style={{ fontSize: 11, color: 'var(--muted)', display: 'inline-block', maxWidth: 200, lineHeight: 1.3 }}>{settings.companyAddress}</span>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="num">N.º {my.year}-05-{client.id === 'pilar' ? '014' : '015'}</div>
            <div className="text-muted mt-2" style={{ fontSize: 11 }}>Emisión 31 may {my.year}</div>
            <div className="badge badge-accent mt-2"><span className="dot" /> Pendiente</div>
          </div>
        </div>

        <hr />

        <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Para</div>
        <div style={{ fontSize: 13, lineHeight: 1.5 }}>
          <strong>{client.name}</strong><br />
          {client.handle}<br />
          {client.email}
        </div>

        <hr />

        <div className="li" style={{ borderBottom: 0, paddingBottom: 4, fontSize: 11, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          <div>Concepto</div>
          <div className="li-qty">Cant.</div>
          <div className="li-amt">Importe</div>
        </div>

        <div className="li">
          <div>
            {client.retainerLabel}
            <div className="li-sub">Cuota mensual fija — incluye gestión de comunidad y reporting</div>
          </div>
          <div className="li-qty">1</div>
          <div className="li-amt">{eurFull(totals.retainer)}</div>
        </div>

        {groups.map(g => (
          <div className="li" key={g.type.id}>
            <div>
              {g.type.name}
              <div className="li-sub">{g.items.map(it => it.title.length > 38 ? it.title.slice(0, 36) + '…' : it.title).join(' · ')}</div>
            </div>
            <div className="li-qty">{g.items.length}</div>
            <div className="li-amt">{eurFull(g.total)}</div>
          </div>
        ))}

        <div className="totals">
          <div className="li">
            <div className="text-muted" style={{ fontSize: 12 }}>Subtotal</div>
            <div />
            <div className="li-amt mono">{eurFull(totals.total)}</div>
          </div>
          <div className="li">
            <div className="text-muted" style={{ fontSize: 12 }}>IVA (21%)</div>
            <div />
            <div className="li-amt mono">{eurFull(totals.total * 0.21)}</div>
          </div>
          <div className="li">
            <div className="text-muted" style={{ fontSize: 12 }}>IRPF (-15%)</div>
            <div />
            <div className="li-amt mono">−{eurFull(totals.total * 0.15)}</div>
          </div>
        </div>

        <div className="grand">
          <div className="lbl">Total a pagar</div>
          <div className="amt">{eurFull(totals.total * 1.06)}</div>
        </div>

        <div className="text-muted mt-4" style={{ fontSize: 11 }}>
          Transferencia a ES12 0182 0000 0000 0000 0000 · vencimiento a 15 días.
        </div>
      </div>

      <div className="client-section" style={{ paddingTop: 6 }}>
        <div className="row gap-2">
          <ButtonCustom variant="ghost" icon="download" style={{ flex: 1 }}>Descargar PDF</ButtonCustom>
          <ButtonCustom variant="primary" icon="external" style={{ flex: 1 }}>Pagar</ButtonCustom>
        </div>
      </div>
    </div>
  );
}
