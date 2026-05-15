"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CURRENT_MONTH, worksFor, groupByWeek, totalFor, eur, STATUS } from '@/lib/mock-data';
import { getClient, getWorksForClient, Client, Work } from '@/lib/data';
import { AvatarCustom } from '@/components/ui/avatar-custom';
import { Icon } from '@/components/ui/icon';
import { ButtonCustom } from '@/components/ui/button-custom';
import { WorkRow } from '@/components/shared/work-row';
import { MiniCalendar } from '@/components/shared/mini-calendar';
import { NewWorkModal } from '@/components/admin/new-work-modal';

export default function AdminClientDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const clientId = params.id;
  const [client, setClient] = useState<Client | null>(null);
  const [works, setWorks] = useState<Work[]>([]);
  const [tab, setTab] = useState('trabajos');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    loadWorks();
  }, [clientId]);

  function loadWorks() {
    Promise.all([getClient(clientId), getWorksForClient(clientId)]).then(([c, w]) => {
      setClient(c);
      setWorks(w);
      setLoading(false);
    });
  }
  
  if (loading) return <div style={{ padding: 40, opacity: 0.5 }}>Cargando datos...</div>;
  if (!client) return <div style={{ padding: 40 }}>Cliente no encontrado</div>;

  const month = CURRENT_MONTH;
  const monthWorks = worksFor(works, clientId, month.year, month.month).sort((a, b) => b.date.getTime() - a.date.getTime());
  const groups = groupByWeek(monthWorks);
  const totals = totalFor(works, clientId, month.year, month.month);

  const months = [
    { y: 2026, m: 4, label: 'Mayo 2026', isCurrent: true },
    { y: 2026, m: 3, label: 'Abril 2026' },
    { y: 2026, m: 2, label: 'Marzo 2026' }
  ];

  const updateWork = (id: string, patch: any) => {
    setWorks((prev) => prev.map((w) => w.id === id ? { ...w, ...patch } : w));
  };

  const page = (
    <div>
      <div className="main-header">
        <div className="col gap-2">
          <button onClick={() => router.push('/admin')} className="row gap-2" style={{ background: 'transparent', border: 0, color: 'var(--muted)', fontSize: 12, padding: 0, cursor: 'pointer' }}>
            <Icon name="chevron_left" size={14} /> Volver a clientes
          </button>
          <div className="client-header" style={{ padding: 0, border: 0, margin: 0 }}>
            <AvatarCustom name={client.name} color={client.color} initials={client.initials} size="xl" />
            <div>
              <div className="name">{client.name}</div>
              <div className="sub">{client.handle} · {client.sector} · cliente desde {client.since}</div>
            </div>
          </div>
        </div>
        <div className="row gap-2">
          <button className="btn-icon"><Icon name="bell" size={16} /></button>
          <button className="btn-icon"><Icon name="more" size={16} /></button>
          <ButtonCustom variant="accent" icon="plus" onClick={() => setModalOpen(true)}>Añadir trabajo</ButtonCustom>
        </div>
      </div>

      <div className="main-content">
        <div className="tabs">
          <div className={`tab ${tab === 'trabajos' ? 'active' : ''}`} onClick={() => setTab('trabajos')}>
            Trabajos del mes <span className="badge badge-muted">{monthWorks.length}</span>
          </div>
          <div className={`tab ${tab === 'calendario' ? 'active' : ''}`} onClick={() => setTab('calendario')}>Calendario</div>
          <div className={`tab ${tab === 'historico' ? 'active' : ''}`} onClick={() => setTab('historico')}>Histórico</div>
          <div className={`tab ${tab === 'notas' ? 'active' : ''}`} onClick={() => setTab('notas')}>Notas</div>
        </div>

        <div className="detail-grid">
          <div>
            {tab === 'trabajos' && (
              <>
                <div className="row between mb-4" style={{ alignItems: 'center' }}>
                  <div className="pills">
                    <span className="pill active">Todo</span>
                    <span className="pill">Borrador</span>
                    <span className="pill">Aprobado</span>
                    <span className="pill">Publicado</span>
                  </div>
                  <div className="segment">
                    <button className="active">Mes</button>
                    <button>Semana</button>
                  </div>
                </div>

                {groups.map(g => (
                  <div className="week-group" key={g.week}>
                    <div className="week-head">
                      <div className="label">Semana {g.week}</div>
                      <div className="range">{g.range}</div>
                    </div>
                    <div className="work-list">
                      {g.items.map((w: any) => (
                        <WorkRow
                          key={w.id}
                          work={w}
                          onClick={() => {
                            // toggle status quick demo
                            const next = w.status === 'borrador' ? 'aprobado' : (w.status === 'aprobado' ? 'publicado' : 'borrador');
                            updateWork(w.id, { status: next });
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}

            {tab === 'calendario' && (
              <div className="card card-pad">
                <div className="row between mb-4" style={{ alignItems: 'baseline' }}>
                  <h3 className="h3">Mayo 2026</h3>
                  <div className="text-muted" style={{ fontSize: 12 }}>{monthWorks.length} piezas programadas</div>
                </div>
                <MiniCalendar year={2026} month={4} works={monthWorks} />
                <div className="row gap-4 mt-6" style={{ fontSize: 12 }}>
                  <span className="row gap-2"><span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--warn)' }} /> Borrador</span>
                  <span className="row gap-2"><span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--accent)' }} /> Aprobado</span>
                  <span className="row gap-2"><span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--ok)' }} /> Publicado</span>
                </div>
              </div>
            )}

            {tab === 'historico' && (
              <div className="card" style={{ overflow: 'hidden' }}>
                {months.map(m => {
                  const t = totalFor(works, clientId, m.y, m.m);
                  return (
                    <div key={m.label} className="history-row fade-in" style={{ padding: '18px 22px' }}>
                      <div className="col" style={{ gap: 2, flex: 1 }}>
                        <div className="h-month">{m.label}</div>
                        <div className="h-meta">{t.count} piezas · iguala {eur(t.retainer)}</div>
                      </div>
                      {m.isCurrent && <span className="badge badge-accent"><span className="dot" /> En curso</span>}
                      <div className="h-amount">{eur(t.total)}</div>
                      <Icon name="chevron_right" size={16} className="h-arrow" />
                    </div>
                  );
                })}
              </div>
            )}

            {tab === 'notas' && (
              <div className="card card-pad">
                <div className="eyebrow mb-2">Notas internas</div>
                <div className="col gap-4">
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>Tono de marca</div>
                    <p className="text-ink-2" style={{ fontSize: 13, margin: '4px 0 0' }}>Cercano, sin tecnicismos. Usar segunda persona. Evitar emojis salvo en stories.</p>
                  </div>
                  <div className="divider" />
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>Accesos & contraseñas</div>
                    <p className="text-ink-2" style={{ fontSize: 13, margin: '4px 0 0' }}>Instagram: vía Meta Business Suite. Drive con plantillas en /clientes/studio-pilar.</p>
                  </div>
                  <div className="divider" />
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>Próxima reunión</div>
                    <p className="text-ink-2" style={{ fontSize: 13, margin: '4px 0 0' }}>30 de mayo — revisión campaña verano.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: invoice summary */}
          <div className="invoice-card">
            <div className="eyebrow">Facturación · Mayo 2026</div>
            <div className="total">
              {eur(totals.total).replace('€','')}<em>€</em>
            </div>
            <div className="total-sub">{totals.count} trabajos + iguala mensual</div>

            <div className="line-item">
              <span className="label">{client.retainerLabel}</span>
              <span className="amount">{eur(totals.retainer)}</span>
            </div>
            <div className="line-item">
              <span className="label">Trabajos extra</span>
              <span className="amount">{eur(totals.variable)}</span>
            </div>
            <div className="line-item total-line">
              <span className="label">Total a facturar</span>
              <span className="amount">{eur(totals.total)}</span>
            </div>

            <div className="actions">
              <button className="btn btn-ghost btn-sm" style={{ flex: 1 }}><Icon name="download" size={13} /> PDF</button>
              <button className="btn btn-accent btn-sm" style={{ flex: 1 }}><Icon name="send" size={13} /> Enviar</button>
            </div>

            <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,.1)' }}>
              <div className="row between" style={{ fontSize: 12, color: 'rgba(255,255,255,.55)' }}>
                <span>Abril 2026</span><span className="mono">{eur(totalFor(works, clientId, 2026, 3).total)}</span>
              </div>
              <div className="row between mt-2" style={{ fontSize: 12, color: 'rgba(255,255,255,.55)' }}>
                <span>Marzo 2026</span><span className="mono">{eur(totalFor(works, clientId, 2026, 2).total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {page}
      {client && (
        <NewWorkModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          clients={[client]}
          preselectClientId={clientId}
          onCreated={loadWorks}
        />
      )}
    </>
  );
}
