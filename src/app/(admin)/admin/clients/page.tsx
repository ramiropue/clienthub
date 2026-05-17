"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { eur, totalFor, MONTH_NAMES, worksFor } from '@/lib/mock-data';
import { getClients, getWorks, Client, Work } from '@/lib/data';
import { AvatarCustom } from '@/components/ui/avatar-custom';
import { ButtonCustom } from '@/components/ui/button-custom';
import { Icon } from '@/components/ui/icon';
import { NewClientModal } from '@/components/admin/new-client-modal';

// ── Helpers ──────────────────────────────────────────────────
const now = new Date();
const CY   = now.getFullYear();
const CM   = now.getMonth();

// ── Client card ──────────────────────────────────────────────
interface ClientCardProps {
  client: Client;
  works: Work[];
  onClick: () => void;
}

function ClientCard({ client, works, onClick }: ClientCardProps) {
  const totals   = totalFor(works, client.id, CY, CM);
  const pending  = worksFor(works, client.id, CY, CM).filter(w => w.status === 'borrador').length;
  const monthStr = MONTH_NAMES[CM].toLowerCase();

  return (
    <div
      className="card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter') onClick(); }}
      style={{
        cursor: 'pointer',
        transition: 'box-shadow .15s, transform .15s',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = '';
        (e.currentTarget as HTMLElement).style.transform = '';
      }}
    >
      {/* Color band top */}
      <div style={{ height: 4, background: client.color }} />

      <div style={{ padding: '20px 20px 0' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <AvatarCustom
              name={client.name}
              color={client.color}
              initials={client.initials}
              size="lg"
              logoUrl={client.logoUrl}
            />
            <div>
              <div style={{ fontWeight: 600, fontSize: 15, letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                {client.name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                {client.handle} · {client.sector}
              </div>
            </div>
          </div>
          <Icon name="chevron_right" size={16} style={{ color: 'var(--muted)', flexShrink: 0, marginTop: 4 }} />
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--line-2)', margin: '16px 0' }} />

        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 4 }}>Total {monthStr}</div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 22,
              lineHeight: 1,
              letterSpacing: '-0.015em',
            }}>
              {eur(totals.total)}
            </div>
          </div>
          <div>
            <div className="eyebrow" style={{ marginBottom: 4 }}>Piezas</div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 22,
              lineHeight: 1,
              letterSpacing: '-0.015em',
            }}>
              {totals.count}
            </div>
          </div>
          <div>
            <div className="eyebrow" style={{ marginBottom: 4 }}>Iguala</div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 14,
              lineHeight: 1,
              paddingTop: 4,
            }}>
              {eur(client.monthlyRetainer)}
            </div>
          </div>
        </div>
      </div>

      {/* Footer strip */}
      <div style={{
        marginTop: 'auto',
        background: 'var(--paper)',
        borderTop: '1px solid var(--line-2)',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
      }}>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
          Cliente desde{' '}
          <strong style={{ color: 'var(--ink-2)' }}>
            {client.startDate
              ? client.startDate.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })
              : client.since}
          </strong>
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          {pending > 0 && (
            <span className="badge badge-warn">
              <span className="dot" /> {pending} pendiente{pending > 1 ? 's' : ''}
            </span>
          )}
          {pending === 0 && totals.count > 0 && (
            <span className="badge badge-ok">
              <span className="dot" /> Al día
            </span>
          )}
          {totals.count === 0 && (
            <span className="badge badge-muted">Sin actividad</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────
export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [works,   setWorks]   = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    Promise.all([getClients(), getWorks()]).then(([c, w]) => {
      setClients(c);
      setWorks(w);
      setLoading(false);
    });
  }, []);

  function reload() {
    Promise.all([getClients(), getWorks()]).then(([c, w]) => {
      setClients(c);
      setWorks(w);
    });
  }

  const filtered = useMemo(() =>
    clients.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.handle.toLowerCase().includes(search.toLowerCase()) ||
      c.sector.toLowerCase().includes(search.toLowerCase())
    ),
    [clients, search]
  );

  // Summary totals
  const totalMes = clients.reduce((s, c) => s + totalFor(works, c.id, CY, CM).total, 0);
  const totalPendientes = clients.reduce((s, c) =>
    s + worksFor(works, c.id, CY, CM).filter(w => w.status === 'borrador').length, 0
  );

  if (loading) return <div style={{ padding: 40, opacity: 0.5 }}>Cargando clientes...</div>;

  return (
    <div>
      {/* ── Header ── */}
      <div className="main-header">
        <div>
          <div className="eyebrow">{MONTH_NAMES[CM]} {CY} · {clients.length} clientes</div>
          <h1 className="h2" style={{ margin: '6px 0 0' }}>
            Tus <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>clientes</em>
          </h1>
        </div>
        <div className="row gap-2">
          <ButtonCustom variant="primary" icon="plus" onClick={() => setModalOpen(true)}>
            Nuevo cliente
          </ButtonCustom>
        </div>
      </div>

      <div className="main-content">

        {/* ── Summary strip ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
          marginBottom: 24,
        }}>
          <div className="kpi">
            <div className="kpi-label">Clientes activos</div>
            <div className="kpi-value">{clients.length}</div>
            <div className="kpi-delta">con iguala</div>
          </div>
          <div className="kpi accent">
            <div className="kpi-label">Facturado — {MONTH_NAMES[CM].toLowerCase()}</div>
            <div className="kpi-value"><em>{eur(totalMes)}</em></div>
            <div className="kpi-delta">total combinado</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Pendientes de aprobación</div>
            <div className="kpi-value">{totalPendientes}</div>
            <div className="kpi-delta neg">borradores activos</div>
          </div>
        </div>

        {/* ── Search bar ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 20,
        }}>
          <div style={{
            flex: 1,
            position: 'relative',
          }}>
            <span style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--muted)',
              display: 'flex',
              pointerEvents: 'none',
            }}>
              <Icon name="search" size={15} />
            </span>
            <input
              className="input"
              placeholder="Buscar cliente, handle o sector…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 36 }}
            />
          </div>
          {search && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setSearch('')}
            >
              Limpiar
            </button>
          )}
        </div>

        {/* ── Client grid ── */}
        {filtered.length === 0 ? (
          <div style={{
            padding: '60px 0',
            textAlign: 'center',
            color: 'var(--muted)',
            fontSize: 14,
          }}>
            <Icon name="users" size={32} stroke={1} style={{ opacity: 0.3, marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
            No se encontró ningún cliente para <strong>"{search}"</strong>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 16,
          }}>
            {filtered.map(client => (
              <ClientCard
                key={client.id}
                client={client}
                works={works}
                onClick={() => router.push(`/admin/client/${client.id}`)}
              />
            ))}
          </div>
        )}

        {/* ── Empty-state new client hint ── */}
        {clients.length > 0 && filtered.length === clients.length && (
          <div style={{
            marginTop: 16,
            border: '1.5px dashed var(--line)',
            borderRadius: 'var(--r-lg)',
            padding: '28px 20px',
            textAlign: 'center',
            color: 'var(--muted)',
            fontSize: 13,
            cursor: 'pointer',
            transition: 'border-color .15s, background .15s',
          }}
          onClick={() => setModalOpen(true)}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--ink-2)';
            (e.currentTarget as HTMLElement).style.background = 'var(--paper-2)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.borderColor = '';
            (e.currentTarget as HTMLElement).style.background = '';
          }}
          >
            <Icon name="plus" size={18} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.4 }} />
            Añadir nuevo cliente
          </div>
        )}
      </div>

      <NewClientModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => { reload(); setModalOpen(false); }}
      />
    </div>
  );
}
