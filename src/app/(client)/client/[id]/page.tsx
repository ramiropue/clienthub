"use client";

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { CURRENT_MONTH, worksFor, groupByWeek, totalFor, eur, TODAY, getType, MONTH_NAMES } from '@/lib/mock-data';
import { getClient, getWorksForClient, Client, Work } from '@/lib/data';
import { Icon } from '@/components/ui/icon';
import { WorkRow } from '@/components/shared/work-row';
import { supabase } from '@/lib/supabase';

export default function ClienteHomePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const clientId = unwrappedParams.id;
  const [client, setClient] = useState<Client | null>(null);
  const [works, setWorks] = useState<Work[]>([]);
  const [workTypes, setWorkTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState('Antía');
  const [filterPending, setFilterPending] = useState(false);
  const [currentDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState({ month: currentDate.getMonth(), year: currentDate.getFullYear() });

  const handlePrevMonth = () => {
    setSelectedMonth(prev => prev.month === 0 ? { month: 11, year: prev.year - 1 } : { ...prev, month: prev.month - 1 });
  };
  const handleNextMonth = () => {
    setSelectedMonth(prev => prev.month === 11 ? { month: 0, year: prev.year + 1 } : { ...prev, month: prev.month + 1 });
  };

  useEffect(() => {
    Promise.all([
      getClient(clientId), 
      getWorksForClient(clientId),
      supabase.from('settings').select('profile_name').single(),
      supabase.from('work_types').select('*')
    ]).then(([c, w, sRes, wtRes]) => {
      setClient(c);
      setWorks(w);
      if (sRes?.data?.profile_name) {
        setAdminName(sRes.data.profile_name);
      }
      if (wtRes?.data) {
        setWorkTypes(wtRes.data.map((wt: any) => ({
          id: wt.id, name: wt.name, price: Number(wt.price), unit: wt.unit, group: wt.group_name, icon: wt.icon
        })));
      }
      setLoading(false);
    });
  }, [clientId]);

  if (loading) return <div style={{ padding: 40, opacity: 0.5 }}>Cargando datos...</div>;
  if (!client) return <div style={{ padding: 40 }}>Cliente no encontrado</div>;

  const month = selectedMonth;
  const monthWorks = worksFor(works, client.id, month.year, month.month).sort((a, b) => b.date.getTime() - a.date.getTime());
  const filteredWorks = filterPending
    ? monthWorks.filter(w => {
        const typeDef = workTypes.find(t => t.id === w.type) || getType(w.type);
        return typeDef?.group === 'contenido' && w.status === 'borrador';
      })
    : monthWorks;
  const groups = groupByWeek(filteredWorks);
  
  const billableList = monthWorks.filter(w => w.status === 'publicado');
  const variable = billableList.reduce((s, w) => s + (w.price || 0), 0);
  const retainer = client.monthlyRetainer || 0;
  const total = variable + retainer;
  const count = billableList.length;

  const pending = monthWorks.filter(w => {
    const typeDef = workTypes.find(t => t.id === w.type) || getType(w.type);
    return typeDef?.group === 'contenido' && w.status === 'borrador';
  }).length;

  const totalStr = eur(total).replace('€','').trim();

  const handleOpenWork = (workId: string) => {
    router.push(`/client/${clientId}/work/${workId}`);
  };

  return (
    <>
      <div className="client-hero">
        <div className="month">
          <span>{MONTH_NAMES[selectedMonth.month]} {selectedMonth.year}</span>
          <div className="nav">
            <button onClick={handlePrevMonth}><Icon name="chevron_left" size={14} /></button>
            <button onClick={handleNextMonth}><Icon name="chevron_right" size={14} /></button>
          </div>
        </div>
        <div className="total">
          {totalStr}<em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>€</em>
        </div>
        <div className="text-muted mt-2" style={{ fontSize: 13 }}>
          Facturación acumulada de este mes
        </div>
        <div className="breakdown">
          <span className="chip"><span className="lbl">Cuota mensual</span> <span className="val mono">{eur(retainer)}</span></span>
          <span className="chip"><span className="lbl">Extras</span> <span className="val mono">{eur(variable)}</span></span>
          <span className="chip"><span className="lbl">Piezas</span> <span className="val">{count}</span></span>
        </div>
      </div>

      {pending > 0 && (
        <div className="client-pending fade-in" onClick={() => {
          setFilterPending(true);
          document.getElementById('trabajos-list')?.scrollIntoView({ behavior: 'smooth' });
        }} style={{ cursor: 'pointer' }}>
          <span className="accent-dot" />
          <div className="body">
            <div className="ttl">{pending} {pending === 1 ? 'pieza esperando' : 'piezas esperando'} tu visto bueno</div>
            <div className="sub">Échale un ojo cuando puedas — {adminName} espera para publicar</div>
          </div>
          <Icon name="chevron_right" size={18} />
        </div>
      )}

      <div className="client-section" id="trabajos-list">
        <div className="client-section-head" style={{ marginBottom: 12 }}>
          <div className="ttl">Trabajos del mes</div>
          <span className="more">
            {filterPending ? `${filteredWorks.length} pendientes` : `${monthWorks.length} en total`}
          </span>
        </div>

        <div className="pills mb-4" style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          <button 
            className={`pill ${!filterPending ? 'active' : ''}`}
            onClick={() => setFilterPending(false)}
            style={{ 
              border: '1px solid var(--line)', 
              background: !filterPending ? 'var(--ink)' : 'var(--card)', 
              color: !filterPending ? '#fff' : 'var(--ink-2)', 
              padding: '6px 12px', 
              borderRadius: 999, 
              fontSize: 12, 
              cursor: 'pointer',
              fontWeight: !filterPending ? 500 : 400,
              transition: 'all 0.2s'
            }}
          >
            Todos ({monthWorks.length})
          </button>
          <button 
            className={`pill ${filterPending ? 'active' : ''}`}
            onClick={() => setFilterPending(true)}
            style={{ 
              border: '1px solid var(--line)', 
              background: filterPending ? 'var(--ink)' : 'var(--card)', 
              color: filterPending ? '#fff' : 'var(--ink-2)', 
              padding: '6px 12px', 
              borderRadius: 999, 
              fontSize: 12, 
              cursor: 'pointer',
              fontWeight: filterPending ? 500 : 400,
              transition: 'all 0.2s'
            }}
          >
            Pendientes visto bueno ({pending})
          </button>
        </div>
        {groups.map(g => (
          <div className="week-group" key={g.week}>
            <div className="week-head">
              <div className="label">Semana {g.week}</div>
              <div className="range">{g.range}</div>
            </div>
            <div className="work-list">
              {g.items.map((w: any) => (
                <WorkRow key={w.id} work={w} workType={workTypes.find(t => t.id === w.type)} onClick={() => handleOpenWork(w.id)} compact />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="client-section" style={{ paddingTop: 8 }}>
        <div className="card card-pad" onClick={() => router.push(`/client/${clientId}/invoice?y=${selectedMonth.year}&m=${selectedMonth.month}`)} style={{ cursor: 'pointer' }}>
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
