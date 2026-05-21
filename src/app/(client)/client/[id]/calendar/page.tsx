"use client";

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { CURRENT_MONTH, worksFor, TODAY, MONTH_NAMES } from '@/lib/mock-data';
import { getClient, getWorksForClient, Client, Work, getWorkTypes, WorkType } from '@/lib/data';
import { Icon } from '@/components/ui/icon';
import { WorkRow } from '@/components/shared/work-row';
import { MiniCalendar } from '@/components/shared/mini-calendar';

export default function ClienteCalendarPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const clientId = unwrappedParams.id;
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<{ day: Date, list: any[] } | null>(null);
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
  
  const [currentDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState({ month: currentDate.getMonth(), year: currentDate.getFullYear() });

  const handlePrevMonth = () => {
    setSelectedMonth(prev => prev.month === 0 ? { month: 11, year: prev.year - 1 } : { ...prev, month: prev.month - 1 });
    setSelected(null);
  };
  const handleNextMonth = () => {
    setSelectedMonth(prev => prev.month === 11 ? { month: 0, year: prev.year + 1 } : { ...prev, month: prev.month + 1 });
    setSelected(null);
  };

  useEffect(() => {
    Promise.all([getClient(clientId), getWorksForClient(clientId), getWorkTypes()]).then(([c, w, wt]) => {
      setClient(c);
      setWorks(w);
      setWorkTypes(wt);
      setLoading(false);
    });
  }, [clientId]);

  if (loading) {
    return (
      <div className="client-section main-content" style={{ padding: '24px 18px' }}>
        <div className="shimmer-container" style={{ gap: 20 }}>
          {/* Hero Shimmer */}
          <div className="shimmer-bar" style={{ height: 120, width: '100%' }} />
          {/* Two column layout */}
          <div className="row gap-6" style={{ alignItems: 'flex-start', flexWrap: 'wrap', width: '100%' }}>
            {/* Left Calendar box */}
            <div className="shimmer-bar" style={{ height: 320, flex: '1 1 300px', minWidth: 280 }} />
            {/* Right List box */}
            <div className="shimmer-container" style={{ flex: '2 1 400px', gap: 12 }}>
              <div className="shimmer-bar" style={{ height: 24, width: 150 }} />
              <div className="shimmer-bar" style={{ height: 60, width: '100%' }} />
              <div className="shimmer-bar" style={{ height: 60, width: '100%' }} />
              <div className="shimmer-bar" style={{ height: 60, width: '100%' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!client) return <div style={{ padding: 40 }}>Cliente no encontrado</div>;

  const monthWorks = worksFor(works, client.id, selectedMonth.year, selectedMonth.month);

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
        <div className="h2" style={{ margin: 0 }}>Calendario editorial</div>
        <div className="text-muted mt-2" style={{ fontSize: 13 }}>Cuándo se publica cada pieza en {MONTH_NAMES[selectedMonth.month].toLowerCase()}</div>
      </div>
      <div className="client-section main-content">
        <div className="row gap-6" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div className="card card-pad calendar-sticky" style={{ flex: '1 1 300px', minWidth: 280 }}>
            <MiniCalendar 
              year={selectedMonth.year} 
              month={selectedMonth.month} 
              works={monthWorks} 
              onPickDay={(d, list) => setSelected({ day: d, list })} 
            />
            <div className="row gap-4 mt-6" style={{ fontSize: 11, flexWrap: 'wrap' }}>
              <span className="row gap-2"><span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--warn)' }} /> Borrador</span>
              <span className="row gap-2"><span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--accent)' }} /> Aprobado</span>
              <span className="row gap-2"><span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--ok)' }} /> Publicado</span>
            </div>
          </div>

          <div className="col gap-4" style={{ flex: '2 1 400px' }}>
            <div className="client-section-head">
              <div className="ttl">
                {selected ? `${selected.day.getDate()} de ${MONTH_NAMES[selected.day.getMonth()].toLowerCase()}` : `Publicaciones de ${MONTH_NAMES[selectedMonth.month].toLowerCase()}`}
              </div>
            </div>
            <div className="work-list">
              {(selected ? selected.list : monthWorks.sort((a, b) => a.date.getTime() - b.date.getTime()))
                .map((w: any) => (
                  <WorkRow 
                    key={w.id} 
                    work={w} 
                    workType={workTypes.find(t => t.id === w.type)} 
                    onClick={() => handleOpenWork(w.id)} 
                    compact 
                  />
                ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
