"use client";

import React, { useState, useEffect, use, useRef } from 'react';
import { CURRENT_MONTH, worksFor, totalFor, MONTH_NAMES, getType } from '@/lib/mock-data';
import { getClient, getWorksForClient, Client, Work, getSettings, Settings, getWorkTypes, WorkType } from '@/lib/data';
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
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      getClient(clientId), 
      getWorksForClient(clientId),
      getSettings(),
      getWorkTypes()
    ]).then(([c, w, s, wt]) => {
      setClient(c);
      setWorks(w);
      setSettings(s);
      setWorkTypes(wt);
      setLoading(false);
    });
  }, [clientId]);

  if (loading) {
    return (
      <div className="client-section main-content" style={{ padding: '24px 18px' }}>
        <div className="shimmer-container" style={{ gap: 20 }}>
          {/* Hero */}
          <div className="shimmer-bar" style={{ height: 100, width: '100%' }} />
          {/* Invoice Paper */}
          <div className="shimmer-bar" style={{ height: 420, width: '100%', borderRadius: 14 }} />
          {/* Actions */}
          <div className="row gap-4" style={{ flexWrap: 'nowrap', width: '100%' }}>
            <div className="shimmer-bar" style={{ height: 42, flex: 1 }} />
            <div className="shimmer-bar" style={{ height: 42, flex: 1 }} />
          </div>
        </div>
      </div>
    );
  }

  if (!client) return <div style={{ padding: 40 }}>Cliente no encontrado</div>;

  // determine month
  const yearStr = unwrappedSearchParams?.y;
  const monthStr = unwrappedSearchParams?.m;
  const my = (yearStr && monthStr) 
    ? { year: parseInt(yearStr), month: parseInt(monthStr) }
    : CURRENT_MONTH;

  const list = worksFor(works, client.id, my.year, my.month);
  const billableList = list.filter(w => w.status === 'publicado');
  const variable = billableList.reduce((s, w) => s + (w.price || 0), 0);
  const retainer = client.monthlyRetainer || 0;
  const total = variable + retainer;
  
  // group by type
  const byType: Record<string, { type: any, items: any[], total: number }> = {};
  billableList.forEach((w: any) => {
    if (!byType[w.type]) byType[w.type] = { type: workTypes.find(t => t.id === w.type) || getType(w.type), items: [], total: 0 };
    byType[w.type].items.push(w);
    byType[w.type].total += w.price;
  });
  const groups = Object.values(byType);

  const monthLabel = `${MONTH_NAMES[my.month]} ${my.year}`;

  const eurFull = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    setDownloading(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const opt = {
        margin: 0,
        filename: `Factura_${client?.name?.replace(/ /g, '_')}_${MONTH_NAMES[my.month]}_${my.year}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      // Temporarily hide the download section
      const actionsEl = document.getElementById('client-invoice-actions');
      if (actionsEl) actionsEl.style.display = 'none';
      
      // Apply white background for PDF
      const originalBg = invoiceRef.current.style.background;
      invoiceRef.current.style.background = '#ffffff';
      
      await html2pdf().set(opt).from(invoiceRef.current).save();
      
      // Restore
      invoiceRef.current.style.background = originalBg;
      if (actionsEl) actionsEl.style.display = 'flex';
      
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Error al generar el PDF. Por favor, inténtalo de nuevo.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="invoice-page" ref={invoiceRef} style={{ background: 'var(--paper)', minHeight: '100vh', paddingBottom: 40 }}>
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
            <div className="num">N.º {my.year}-{(my.month+1).toString().padStart(2, '0')}-{client.id.slice(0,3).toUpperCase()}</div>
            <div className="text-muted mt-2" style={{ fontSize: 11 }}>Emisión 1 {MONTH_NAMES[(my.month + 1) % 12].slice(0,3).toLowerCase()} {my.month === 11 ? my.year + 1 : my.year}</div>
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
            {client.retainerLabel || 'Cuota mensual'}
            <div className="li-sub">Cuota mensual fija — incluye gestión de comunidad y reporting</div>
          </div>
          <div className="li-qty">1</div>
          <div className="li-amt">{eurFull(retainer)}</div>
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
            <div className="li-amt mono">{eurFull(total)}</div>
          </div>
        </div>

        <div className="grand">
          <div className="lbl">Total</div>
          <div className="amt">{eurFull(total)}</div>
        </div>

      </div>

      <div id="client-invoice-actions" className="client-section" style={{ paddingTop: 6 }}>
        <div className="row gap-2">
          <ButtonCustom 
            variant="ghost" 
            icon="download" 
            style={{ flex: 1 }} 
            onClick={handleDownloadPDF}
            disabled={downloading}
          >
            {downloading ? 'Generando PDF...' : 'Descargar PDF'}
          </ButtonCustom>
        </div>
      </div>
    </div>
  );
}
