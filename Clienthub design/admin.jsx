/* global React, window */
// ───────────── Admin views ─────────────
const { useState: useStateA, useMemo: useMemoA } = React;

// ───────────── Sidebar ─────────────
function AdminSidebar({ view, setView, totals }) {
  const items = [
    { id: 'dashboard', label: 'Dashboard',  icon: 'dashboard' },
    { id: 'clients',   label: 'Clientes',   icon: 'users', count: CLIENTS.length },
    { id: 'calendar',  label: 'Calendario', icon: 'calendar' },
    { id: 'invoices',  label: 'Facturación', icon: 'invoice' },
  ];
  const settings = [
    { id: 'types',    label: 'Tipos de trabajo', icon: 'wrench' },
    { id: 'settings', label: 'Ajustes',     icon: 'settings' },
  ];
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="dot-mark" /> ClientHub
      </div>
      <div className="nav-group">
        <div className="nav-label">Trabajo</div>
        {items.map(it => (
          <div
            key={it.id}
            className={`nav-item ${view === it.id ? 'active' : ''}`}
            onClick={() => setView(it.id)}
          >
            <Icon name={it.icon} size={16} />
            <span>{it.label}</span>
            {it.count != null && <span className="count">{it.count}</span>}
          </div>
        ))}
      </div>
      <div className="nav-group">
        <div className="nav-label">Configuración</div>
        {settings.map(it => (
          <div
            key={it.id}
            className={`nav-item ${view === it.id ? 'active' : ''}`}
            onClick={() => setView(it.id)}
          >
            <Icon name={it.icon} size={16} />
            <span>{it.label}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 'auto', padding: 10 }}>
        <div className="row gap-3" style={{ alignItems: 'center' }}>
          <Avatar name="Antía Vázquez" color="#161311" size="sm" />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 500 }}>Antía Vázquez</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>Social Media · Freelance</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ───────────── Dashboard (lista de clientes) ─────────────
function AdminDashboard({ works, onOpenClient, onNewWork, setView }) {
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

  return (
    <div>
      <div className="main-header">
        <div>
          <div className="eyebrow">Mayo 2026 · Hasta hoy 15 de mayo</div>
          <h1 className="h2" style={{ margin: '6px 0 0' }}>
            Hola Antía,<br /><em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>buen mes</em> hasta ahora.
          </h1>
        </div>
        <div className="row gap-2">
          <button className="btn btn-ghost btn-sm"><Icon name="calendar" size={14} /> Mayo 2026 <Icon name="chevron_down" size={12} /></button>
          <Button variant="accent" icon="plus" onClick={onNewWork}>Nuevo trabajo</Button>
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
            <div key={client.id} className="client-row" onClick={() => onOpenClient(client.id)}>
              <div className="cell-client">
                <Avatar name={client.name} color={client.color} initials={client.initials} />
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
              {worksThisMonth.slice().sort((a, b) => b.date - a.date).slice(0, 4).map(w => {
                const c = getClient(w.clientId);
                return (
                  <div key={w.id} className="row gap-3">
                    <Avatar name={c.name} color={c.color} initials={c.initials} size="sm" />
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
              <a className="text-muted" style={{ fontSize: 11, cursor: 'pointer' }} onClick={() => setView('calendar')}>Ver todo →</a>
            </div>
            <MiniCalendar year={2026} month={4} works={worksThisMonth} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ───────────── Cliente detail ─────────────
function AdminClientDetail({ clientId, works, onBack, onNewWork, setToast, updateWork }) {
  const client = getClient(clientId);
  const [tab, setTab] = useStateA('trabajos');
  const month = CURRENT_MONTH;
  const monthWorks = worksFor(works, clientId, month.year, month.month).sort((a, b) => b.date - a.date);
  const groups = groupByWeek(monthWorks);
  const totals = totalFor(works, clientId, month.year, month.month);

  const months = [
    { y: 2026, m: 4, label: 'Mayo 2026', isCurrent: true },
    { y: 2026, m: 3, label: 'Abril 2026' },
    { y: 2026, m: 2, label: 'Marzo 2026' }
  ];

  return (
    <div>
      <div className="main-header">
        <div className="col gap-2">
          <button onClick={onBack} className="row gap-2" style={{ background: 'transparent', border: 0, color: 'var(--muted)', fontSize: 12, padding: 0, cursor: 'pointer' }}>
            <Icon name="chevron_left" size={14} /> Volver a clientes
          </button>
          <div className="client-header" style={{ padding: 0, border: 0, margin: 0 }}>
            <Avatar name={client.name} color={client.color} initials={client.initials} size="xl" />
            <div>
              <div className="name">{client.name}</div>
              <div className="sub">{client.handle} · {client.sector} · cliente desde {client.since}</div>
            </div>
          </div>
        </div>
        <div className="row gap-2">
          <button className="btn-icon"><Icon name="bell" size={16} /></button>
          <button className="btn-icon"><Icon name="more" size={16} /></button>
          <Button variant="accent" icon="plus" onClick={() => onNewWork(client.id)}>Añadir trabajo</Button>
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
                      {g.items.map(w => (
                        <WorkRow
                          key={w.id}
                          work={w}
                          onClick={() => {
                            // toggle status as quick demo
                            const next = w.status === 'borrador' ? 'aprobado' : (w.status === 'aprobado' ? 'publicado' : 'borrador');
                            updateWork(w.id, { status: next });
                            setToast(`Estado actualizado: ${STATUS[next].label}`);
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
}

// ───────────── Add work modal ─────────────
function NewWorkModal({ open, onClose, preselectClient, works, onCreate }) {
  const [clientId, setClientId] = useStateA(preselectClient || 'pilar');
  const [typeId, setTypeId]   = useStateA('reel');
  const [title, setTitle]     = useStateA('');
  const [date, setDate]       = useStateA('2026-05-16');
  const [status, setStatus]   = useStateA('aprobado');
  const [notes, setNotes]     = useStateA('');
  const [price, setPrice]     = useStateA(65);

  React.useEffect(() => {
    if (preselectClient) setClientId(preselectClient);
  }, [preselectClient, open]);
  React.useEffect(() => {
    const t = getType(typeId);
    if (t) setPrice(t.price);
  }, [typeId]);
  React.useEffect(() => {
    if (open) {
      setTitle('');
      setNotes('');
      setStatus('aprobado');
    }
  }, [open]);

  const submit = () => {
    const [y, m, d] = date.split('-').map(Number);
    onCreate({
      id: 'new-' + Date.now(),
      clientId, type: typeId, title: title || getType(typeId).name,
      date: new Date(y, m - 1, d), status, price, notes
    });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="modal-head">
        <div>
          <h2>Nuevo trabajo</h2>
          <div className="sub">Registra una pieza para añadir a la facturación del mes.</div>
        </div>
        <button className="btn-icon" onClick={onClose}><Icon name="close" size={16} /></button>
      </div>
      <div className="modal-body">
        <div className="col gap-4">
          <div className="field">
            <label>Cliente</label>
            <div className="row gap-2">
              {CLIENTS.map(c => (
                <button
                  key={c.id}
                  onClick={() => setClientId(c.id)}
                  className="btn"
                  style={{
                    background: clientId === c.id ? 'var(--ink)' : 'var(--card)',
                    color: clientId === c.id ? '#fff' : 'var(--ink)',
                    border: '1px solid ' + (clientId === c.id ? 'var(--ink)' : 'var(--line)'),
                    flex: 1, justifyContent: 'flex-start', padding: '8px 12px'
                  }}
                >
                  <Avatar name={c.name} color={c.color} initials={c.initials} size="sm" />
                  <span style={{ fontSize: 13 }}>{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Tipo de trabajo</label>
            <div className="type-grid">
              {WORK_TYPES.map(t => (
                <button
                  key={t.id}
                  type="button"
                  className={`type-card ${typeId === t.id ? 'selected' : ''}`}
                  onClick={() => setTypeId(t.id)}
                >
                  <div className="row gap-2"><Icon name={t.icon} size={14} /><span className="t-name">{t.name}</span></div>
                  <span className="t-price">{eur(t.price)} / {t.unit}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Título / descripción</label>
            <input className="input" placeholder="Ej. Reel rutina matinal — 30s" value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          <div className="row gap-3">
            <div className="field flex-1">
              <label>Fecha publicación</label>
              <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="field flex-1">
              <label>Precio</label>
              <input className="input mono" type="number" value={price} onChange={e => setPrice(+e.target.value)} />
            </div>
          </div>

          <div className="field">
            <label>Estado</label>
            <div className="status-picker">
              {Object.entries(STATUS).map(([k, s]) => (
                <span
                  key={k}
                  className={`badge ${s.className} ${status === k ? 'selected' : ''}`}
                  onClick={() => setStatus(k)}
                >
                  <span className="dot" /> {s.label}
                </span>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Adjuntar previsualización</label>
            <div className="drop-zone">
              <Icon name="image" size={20} /><br />
              Arrastra una imagen o <strong>busca un archivo</strong><br />
              <span style={{ fontSize: 11 }}>JPG, PNG, MP4 — máx 50MB</span>
            </div>
          </div>

          <div className="field">
            <label>Notas para el cliente</label>
            <textarea className="textarea" placeholder="Opcional: contexto, ideas, links…" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
      </div>
      <div className="modal-foot">
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" onClick={() => { setStatus('borrador'); submit(); }}>Guardar borrador</Button>
        <Button variant="accent" icon="check" onClick={submit}>Añadir trabajo</Button>
      </div>
    </Modal>
  );
}

// ───────────── Calendar full view ─────────────
function AdminCalendarView({ works, onOpenClient }) {
  const monthWorks = works.filter(w => w.date.getFullYear() === 2026 && w.date.getMonth() === 4);
  return (
    <div>
      <div className="main-header">
        <div>
          <div className="eyebrow">Calendario editorial</div>
          <h1 className="h2" style={{ margin: '6px 0 0' }}>Mayo 2026</h1>
        </div>
        <div className="row gap-2">
          <div className="segment">
            <button className="active">Mes</button>
            <button>Semana</button>
          </div>
        </div>
      </div>
      <div className="main-content">
        <div className="card card-pad">
          <MiniCalendar year={2026} month={4} works={monthWorks} />
        </div>
        <div className="row gap-4 mt-6" style={{ flexWrap: 'wrap' }}>
          {CLIENTS.map(c => {
            const list = monthWorks.filter(w => w.clientId === c.id);
            return (
              <div key={c.id} className="card card-pad flex-1" style={{ minWidth: 300, cursor: 'pointer' }} onClick={() => onOpenClient(c.id)}>
                <div className="row gap-3" style={{ alignItems: 'center' }}>
                  <Avatar name={c.name} color={c.color} initials={c.initials} />
                  <div className="flex-1">
                    <div style={{ fontWeight: 500 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{list.length} piezas en mayo</div>
                  </div>
                  <Icon name="chevron_right" size={16} className="text-muted" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ───────────── Invoices summary ─────────────
function AdminInvoicesView({ works }) {
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
          const byClient = CLIENTS.map(c => ({ client: c, total: totalFor(works, c.id, mn.y, mn.m) }));
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
                    <Avatar name={client.name} color={client.color} initials={client.initials} size="sm" />
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

// ───────────── Wrapper ─────────────
function AdminApp({ works, updateWork, addWork }) {
  const [view, setView] = useStateA('dashboard');
  const [openClient, setOpenClient] = useStateA(null);
  const [newWorkOpen, setNewWorkOpen] = useStateA(false);
  const [newWorkClient, setNewWorkClient] = useStateA(null);
  const [toast, setToast] = useStateA('');

  const openNewWork = (cid) => { setNewWorkClient(cid || null); setNewWorkOpen(true); };

  return (
    <div className="admin-shell">
      <AdminSidebar view={openClient ? 'clients' : view} setView={(v) => { setOpenClient(null); setView(v); }} />
      <main className="main">
        {openClient
          ? <AdminClientDetail
              clientId={openClient}
              works={works}
              onBack={() => setOpenClient(null)}
              onNewWork={(cid) => openNewWork(cid)}
              updateWork={updateWork}
              setToast={setToast}
            />
          : view === 'dashboard'
            ? <AdminDashboard works={works} onOpenClient={setOpenClient} onNewWork={() => openNewWork(null)} setView={setView} />
          : view === 'clients'
            ? <AdminDashboard works={works} onOpenClient={setOpenClient} onNewWork={() => openNewWork(null)} setView={setView} />
          : view === 'calendar'
            ? <AdminCalendarView works={works} onOpenClient={setOpenClient} />
          : view === 'invoices'
            ? <AdminInvoicesView works={works} />
            : <div className="main-content"><div className="placeholder">Sección en construcción</div></div>
        }
      </main>

      <NewWorkModal
        open={newWorkOpen}
        onClose={() => setNewWorkOpen(false)}
        preselectClient={newWorkClient}
        works={works}
        onCreate={(w) => { addWork(w); setToast(`Trabajo añadido a ${getClient(w.clientId).name}`); }}
      />
      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  );
}

Object.assign(window, { AdminApp });
