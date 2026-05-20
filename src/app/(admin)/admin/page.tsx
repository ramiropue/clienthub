"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { totalFor, eur, MONTH_NAMES } from '@/lib/mock-data';
import { getClients, getWorks, Client, Work } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import { SectionTitle } from '@/components/shared/section-title';
import { MiniCalendar } from '@/components/shared/mini-calendar';
import { WorkRow } from '@/components/shared/work-row';
import { StatusBadge } from '@/components/ui/status-badge';
import { AvatarCustom } from '@/components/ui/avatar-custom';
import { ButtonCustom } from '@/components/ui/button-custom';
import { Icon } from '@/components/ui/icon';
import { NewWorkModal } from '@/components/admin/new-work-modal';
import { NotificationsBell } from '@/components/shared/notifications-bell';

// ── helpers ────────────────────────────────────────────────
const now = new Date();
const INITIAL_MONTH = { year: now.getFullYear(), month: now.getMonth() };

function prevMonth(m: { year: number; month: number }) {
  return m.month === 0
    ? { year: m.year - 1, month: 11 }
    : { year: m.year, month: m.month - 1 };
}
function nextMonth(m: { year: number; month: number }) {
  return m.month === 11
    ? { year: m.year + 1, month: 0 }
    : { year: m.year, month: m.month + 1 };
}

// ── page ───────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [works, setWorks]     = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen]               = useState(false);
  const [preselectClientId, setPreselectClientId] = useState<string | null>(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);

  // ── month state ────────────────────────────────────────
  const [month, setMonth]           = useState(INITIAL_MONTH);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const updateWorkStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('works').update({ status: newStatus }).eq('id', id);
    if (!error) {
      setWorks(works.map(w => w.id === id ? { ...w, status: newStatus } : w));
    }
  };

  // Close picker when clicking outside
  useEffect(() => {
    if (!pickerOpen) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [pickerOpen]);

  // ── data ──────────────────────────────────────────────
  useEffect(() => { loadData(); }, []);

  function loadData() {
    Promise.all([getClients(), getWorks()]).then(([c, w]) => {
      setClients(c);
      setWorks(w);
      setLoading(false);
    });
  }

  const openNewWork = (clientId?: string) => {
    setPreselectClientId(clientId || null);
    setModalOpen(true);
  };

  // ── derived data (all reactive to `month`) ────────────
  const totalsByClient = clients.map(c => ({
    client: c,
    ...totalFor(works, c.id, month.year, month.month),
    pending: works.filter(
      w => w.clientId === c.id &&
           w.date.getFullYear() === month.year &&
           w.date.getMonth() === month.month &&
           w.status === 'borrador'
    ).length,
  }));

  const totalMonth   = totalsByClient.reduce((s, c) => s + c.total, 0);
  const prev         = prevMonth(month);
  const lastTotal    = clients.reduce((s, c) => s + totalFor(works, c.id, prev.year, prev.month).total, 0);
  const deltaPct     = lastTotal > 0 ? Math.round(((totalMonth - lastTotal) / lastTotal) * 100) : 0;
  const prevMonthName = MONTH_NAMES[prev.month].toLowerCase();

  const worksThisMonth = works.filter(
    w => w.date.getFullYear() === month.year && w.date.getMonth() === month.month
  );
  const pending = worksThisMonth.filter(w => w.status === 'borrador').length;

  const isCurrentMonth =
    month.year === now.getFullYear() && month.month === now.getMonth();
  const todayStr = isCurrentMonth ? ` · Hasta hoy ${now.getDate()} de ${MONTH_NAMES[month.month].toLowerCase()}` : '';

  const handleOpenClient = (clientId: string) => {
    router.push(`/admin/client/${clientId}`);
  };

  if (loading) return <div style={{ padding: 40, opacity: 0.5 }}>Cargando datos...</div>;

  const monthLabel = `${MONTH_NAMES[month.month]} ${month.year}`;

  return (
    <div>
      <div className="main-header">
        <div>
          <div className="eyebrow">{monthLabel}{todayStr}</div>
          <h1 className="h2" style={{ margin: '6px 0 0' }}>
            Hola Ramiro,<br /><em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>buen mes</em> hasta ahora.
          </h1>
        </div>
        <div className="row gap-2" style={{ position: 'relative' }}>

          {/* ── Month picker button ── */}
          <div ref={pickerRef} style={{ position: 'relative' }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setPickerOpen(p => !p)}
              aria-haspopup="true"
              aria-expanded={pickerOpen}
            >
              <Icon name="calendar" size={14} />
              {monthLabel}
              <Icon name="chevron_down" size={12} />
            </button>

            {pickerOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  zIndex: 200,
                  background: 'var(--card)',
                  border: '1px solid var(--line)',
                  borderRadius: 12,
                  padding: 16,
                  width: 264,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                }}
              >
                {/* Year nav */}
                <div className="row between" style={{ alignItems: 'center', marginBottom: 12 }}>
                  <button
                    className="btn-icon"
                    onClick={() => setMonth(m => ({ ...m, year: m.year - 1 }))}
                    aria-label="Año anterior"
                  >
                    <Icon name="chevron_left" size={14} />
                  </button>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{month.year}</span>
                  <button
                    className="btn-icon"
                    onClick={() => setMonth(m => ({ ...m, year: m.year + 1 }))}
                    aria-label="Año siguiente"
                  >
                    <Icon name="chevron_right" size={14} />
                  </button>
                </div>

                {/* Month grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
                  {MONTH_NAMES.map((name, idx) => {
                    const isSelected = idx === month.month;
                    const isCurrent  = idx === now.getMonth() && month.year === now.getFullYear();
                    return (
                      <button
                        key={idx}
                        onClick={() => { setMonth(m => ({ ...m, month: idx })); setPickerOpen(false); }}
                        style={{
                          padding: '6px 0',
                          borderRadius: 8,
                          border: isCurrent && !isSelected ? '1px solid var(--accent)' : '1px solid transparent',
                          background: isSelected ? 'var(--ink)' : 'transparent',
                          color: isSelected ? '#fff' : isCurrent ? 'var(--accent)' : 'var(--ink)',
                          fontSize: 12,
                          fontWeight: isSelected ? 700 : 400,
                          cursor: 'pointer',
                          transition: 'background .15s',
                        }}
                      >
                        {name.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>

                {/* Quick-nav arrows at the bottom */}
                <div className="row" style={{ marginTop: 12, justifyContent: 'space-between' }}>
                  <button
                    className="btn btn-ghost"
                    style={{ padding: '4px 8px', fontSize: 11, gap: 4 }}
                    onClick={() => { setMonth(prevMonth(month)); setPickerOpen(false); }}
                  >
                    <Icon name="chevron_left" size={10} /> Anterior
                  </button>
                  <button
                    className="btn btn-ghost"
                    style={{ padding: '4px 10px', fontSize: 11 }}
                    onClick={() => { setMonth(INITIAL_MONTH); setPickerOpen(false); }}
                  >
                    Hoy
                  </button>
                  <button
                    className="btn btn-ghost"
                    style={{ padding: '4px 8px', fontSize: 11, gap: 4 }}
                    onClick={() => { setMonth(nextMonth(month)); setPickerOpen(false); }}
                  >
                    Siguiente <Icon name="chevron_right" size={10} />
                  </button>
                </div>
              </div>
            )}
          </div>

          <NotificationsBell recipient="admin" align="right" />
          <ButtonCustom variant="accent" icon="plus" onClick={() => openNewWork()}>Nuevo trabajo</ButtonCustom>
        </div>
      </div>

      <div className="main-content">
        <div className="kpi-grid mb-4">
          <div className="kpi accent">
            <div className="kpi-label">Facturado este mes</div>
            <div className="kpi-value"><em>{eur(totalMonth)}</em></div>
            <div className="kpi-delta" style={{ color: deltaPct >= 0 ? 'var(--accent)' : 'rgba(255,255,255,.6)' }}>
              {deltaPct >= 0 ? '↑' : '↓'} {Math.abs(deltaPct)}% vs. {prevMonthName}
            </div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Trabajos</div>
            <div className="kpi-value">{worksThisMonth.length}</div>
            <div className="kpi-delta">en {MONTH_NAMES[month.month].toLowerCase()}</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Pendientes de aprobar</div>
            <div className="kpi-value">{pending}</div>
            <div className="kpi-delta neg">borradores</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Clientes activos</div>
            <div className="kpi-value">{clients.length}</div>
            <div className="kpi-delta">con cuota mensual</div>
          </div>
        </div>

        <SectionTitle
          title="Tus clientes"
          subtitle={`Resumen de ${MONTH_NAMES[month.month].toLowerCase()} ${month.year}`}
          right={
            <div className="row gap-2">
              <button className="btn-icon"><Icon name="search" size={16} /></button>
              <button className="btn-icon"><Icon name="filter" size={16} /></button>
            </div>
          }
        />

        <div className="client-table">
          <div className="client-row head">
            <div>Cliente</div>
            <div>Cuota mensual</div>
            <div>Trabajos</div>
            <div>Extras</div>
            <div style={{ textAlign: 'right' }}>Total {MONTH_NAMES[month.month].slice(0, 3).toLowerCase()}.</div>
            <div />
          </div>
          {totalsByClient.map(({ client, retainer, variable, total, count, pending }) => (
            <div key={client.id} className="client-row" onClick={() => handleOpenClient(client.id)}>
              <div className="cell-client">
                <AvatarCustom name={client.name} color={client.color} initials={client.initials} />
                <div className="meta">
                  <div className="name">{client.name}</div>
                  <div className="sub">{client.handle} · {client.sector}</div>
                </div>
              </div>
              <div className="cell-hide-mobile mono">{eur(retainer)}</div>
              <div className="cell-hide-mobile">
                {count} <span style={{ color: 'var(--muted)' }}>piezas</span>
                {pending > 0 && <span className="badge badge-warn" style={{ marginLeft: 8 }}><span className="dot" /> {pending}</span>}
              </div>
              <div className="cell-hide-mobile mono">{eur(variable)}</div>
              <div className="cell-amount" style={{ textAlign: 'right' }}>{eur(total)}</div>
              <Icon name="chevron_right" size={16} style={{ color: 'var(--muted)' }} />
            </div>
          ))}
        </div>

        <div className="row gap-4 mt-6" style={{ flexWrap: 'wrap' }}>
          <div className="card card-pad flex-1" style={{ minWidth: 280 }}>
            <div className="eyebrow">Actividad · {MONTH_NAMES[month.month].toLowerCase()}</div>
            <div className="mt-2" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {worksThisMonth.length === 0 && (
                <p style={{ fontSize: 13, color: 'var(--muted)' }}>Sin actividad este mes.</p>
              )}
              {worksThisMonth.slice().sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 4).map(w => {
                const c = clients.find(cl => cl.id === w.clientId);
                if (!c) return null;
                return (
                  <div key={w.id} className="row gap-3">
                    <AvatarCustom name={c.name} color={c.color} initials={c.initials} size="sm" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, lineHeight: 1.3 }}>{w.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{c.name} · {w.date.getDate()} {MONTH_NAMES[w.date.getMonth()].toLowerCase()}</div>
                    </div>
                    <StatusBadge status={w.status} />
                  </div>
                );
              })}
            </div>
          </div>
          <div className="card card-pad" style={{ width: 320 }}>
            <div className="row between" style={{ alignItems: 'baseline', marginBottom: 4 }}>
              <div className="eyebrow">Calendario · {MONTH_NAMES[month.month].toLowerCase()}</div>
              <span className="text-muted" style={{ fontSize: 11, cursor: 'pointer' }} onClick={() => router.push('/admin/calendar')}>Ver todo →</span>
            </div>
            <MiniCalendar 
              year={month.year} 
              month={month.month} 
              works={worksThisMonth} 
              onPickDay={(d) => setSelectedCalendarDate(d)}
            />
          </div>
        </div>
      </div>

      <NewWorkModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        clients={clients}
        preselectClientId={preselectClientId}
        onCreated={loadData}
      />

      {selectedCalendarDate && (
        <div className="modal-overlay" onClick={() => setSelectedCalendarDate(null)}>
          <div className="modal fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 500, padding: 24, maxHeight: '80vh', overflowY: 'auto' }}>
            <div className="row between mb-4">
              <h3 className="h3 m-0">Trabajos del {selectedCalendarDate.getDate()} de {MONTH_NAMES[selectedCalendarDate.getMonth()]} de {selectedCalendarDate.getFullYear()}</h3>
              <button className="btn-icon" onClick={() => setSelectedCalendarDate(null)}><Icon name="close" size={20} /></button>
            </div>
            
            <div className="mb-4">
              <ButtonCustom 
                variant="primary" 
                icon="plus" 
                onClick={() => {
                  setPreselectClientId(null);
                  setModalOpen(true);
                }}
                style={{ width: '100%' }}
              >
                Añadir trabajo
              </ButtonCustom>
            </div>

            <div className="work-list" style={{ border: 'none', background: 'transparent' }}>
              {works
                .filter(w => w.type !== 'herramientas' && w.date.getDate() === selectedCalendarDate.getDate() && w.date.getMonth() === selectedCalendarDate.getMonth() && w.date.getFullYear() === selectedCalendarDate.getFullYear())
                .map(w => {
                  const client = clients.find(c => c.id === w.clientId);
                  return (
                    <div key={w.id} className="mb-4">
                      <div 
                        className="row gap-2 mb-2" 
                        style={{ fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
                        onClick={() => router.push(`/admin/client/${client?.id}`)}
                      >
                        {client && <AvatarCustom name={client.name} color={client.color} initials={client.initials} size="sm" logoUrl={client.logoUrl} />}
                        {client?.name || 'Cliente desconocido'}
                      </div>
                      <WorkRow
                        work={w}
                        onClick={() => router.push(`/admin/work/${w.id}`)}
                        onStatusChange={(newStatus: string) => updateWorkStatus(w.id, newStatus)}
                        compact
                      />
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
