"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CLIENTS, WORKS_INIT, CURRENT_MONTH, totalFor, eur, MONTH_NAMES, getClient } from '@/lib/mock-data';
import { SectionTitle } from '@/components/shared/section-title';
import { MiniCalendar } from '@/components/shared/mini-calendar';
import { StatusBadge } from '@/components/ui/status-badge';
import { AvatarCustom } from '@/components/ui/avatar-custom';
import { ButtonCustom } from '@/components/ui/button-custom';
import { Icon } from '@/components/ui/icon';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [works] = useState(WORKS_INIT);
  const month = CURRENT_MONTH;

  const totalsByClient = CLIENTS.map(c => ({
    client: c,
    ...totalFor(works, c.id, month.year, month.month),
    pending: works.filter(w => w.clientId === c.id && w.date.getMonth() === month.month && w.status === 'borrador').length
  }));

  const totalMonth = totalsByClient.reduce((s, c) => s + c.total, 0);
  const lastMonthTotal = CLIENTS.reduce((s, c) => s + totalFor(works, c.id, 2026, 3).total, 0);
  const deltaPct = Math.round(((totalMonth - lastMonthTotal) / lastMonthTotal) * 100);
  const worksThisMonth = works.filter(w => w.date.getFullYear() === month.year && w.date.getMonth() === month.month);
  const pending = worksThisMonth.filter(w => w.status === 'borrador').length;

  const handleOpenClient = (clientId: string) => {
    router.push(`/admin/client/${clientId}`);
  };

  const handleNewWork = () => {
    // We will implement a NewWorkModal here or redirect to a new page later
    alert("New Work action");
  };

  return (
    <div>
      <div className="main-header">
        <div>
          <div className="eyebrow">Mayo 2026 · Hasta hoy 15 de mayo</div>
          <h1 className="h2" style={{ margin: '6px 0 0' }}>
            Hola Ramiro,<br /><em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>buen mes</em> hasta ahora.
          </h1>
        </div>
        <div className="row gap-2">
          <button className="btn btn-ghost btn-sm">
            <Icon name="calendar" size={14} /> Mayo 2026 <Icon name="chevron_down" size={12} />
          </button>
          <ButtonCustom variant="accent" icon="plus" onClick={handleNewWork}>Nuevo trabajo</ButtonCustom>
        </div>
      </div>

      <div className="main-content">
        <div className="kpi-grid mb-4">
          <div className="kpi accent">
            <div className="kpi-label">Facturado este mes</div>
            <div className="kpi-value"><em>{eur(totalMonth)}</em></div>
            <div className="kpi-delta" style={{ color: deltaPct >= 0 ? 'var(--accent)' : 'rgba(255,255,255,.6)' }}>
              {deltaPct >= 0 ? '↑' : '↓'} {Math.abs(deltaPct)}% vs. abril
            </div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Trabajos</div>
            <div className="kpi-value">{worksThisMonth.length}</div>
            <div className="kpi-delta">en mayo</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Pendientes de aprobar</div>
            <div className="kpi-value">{pending}</div>
            <div className="kpi-delta neg">borradores</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Clientes activos</div>
            <div className="kpi-value">{CLIENTS.length}</div>
            <div className="kpi-delta">con iguala</div>
          </div>
        </div>

        <SectionTitle
          title="Tus clientes"
          subtitle="Resumen del mes en curso"
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
            <div>Iguala</div>
            <div>Trabajos</div>
            <div>Extras</div>
            <div style={{ textAlign: 'right' }}>Total mayo</div>
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
            <div className="eyebrow">Actividad reciente</div>
            <div className="mt-2" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {worksThisMonth.slice().sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 4).map(w => {
                const c = getClient(w.clientId);
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
              <div className="eyebrow">Calendario · mayo</div>
              <span className="text-muted" style={{ fontSize: 11, cursor: 'pointer' }} onClick={() => router.push('/admin/calendar')}>Ver todo →</span>
            </div>
            <MiniCalendar year={2026} month={4} works={worksThisMonth} />
          </div>
        </div>
      </div>
    </div>
  );
}
