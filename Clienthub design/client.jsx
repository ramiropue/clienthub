/* global React, window */
// ───────────── Cliente views (mobile-first) ─────────────
const { useState: useStateC } = React;

function ClienteTopbar({ client, onLogout }) {
  return (
    <div className="client-topbar">
      <div className="brand">
        <span className="dot-mark" /> ClientHub
      </div>
      <div className="row gap-3" style={{ alignItems: 'center' }}>
        <button className="btn-icon" style={{ border: 0 }}><Icon name="bell" size={16} /></button>
        <Avatar name={client.name} color={client.color} initials={client.initials} size="sm" />
      </div>
    </div>
  );
}

function ClienteBottomNav({ view, setView }) {
  const items = [
    { id: 'home',     label: 'Este mes', icon: 'dashboard' },
    { id: 'calendar', label: 'Calendario', icon: 'calendar' },
    { id: 'invoice',  label: 'Factura',  icon: 'receipt' },
    { id: 'history',  label: 'Histórico', icon: 'history' }
  ];
  return (
    <nav style={{
      position: 'sticky',
      bottom: 0,
      background: 'rgba(245,242,236,.92)',
      backdropFilter: 'blur(10px)',
      borderTop: '1px solid var(--line)',
      padding: '8px 8px 14px',
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 4,
      zIndex: 9
    }}>
      {items.map(it => (
        <button
          key={it.id}
          onClick={() => setView(it.id)}
          style={{
            background: 'transparent',
            border: 0,
            padding: '8px 4px 6px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            color: view === it.id ? 'var(--ink)' : 'var(--muted)',
            fontSize: 10,
            fontWeight: view === it.id ? 500 : 400,
            cursor: 'pointer'
          }}
        >
          <Icon name={it.icon} size={20} stroke={view === it.id ? 1.8 : 1.5} />
          <span>{it.label}</span>
        </button>
      ))}
    </nav>
  );
}

// ───────────── Cliente · Dashboard del mes ─────────────
function ClienteHome({ client, works, onOpenWork, onPay, onOpenInvoice }) {
  const month = CURRENT_MONTH;
  const monthWorks = worksFor(works, client.id, month.year, month.month).sort((a, b) => b.date - a.date);
  const groups = groupByWeek(monthWorks);
  const totals = totalFor(works, client.id, month.year, month.month);
  const pending = monthWorks.filter(w => w.status === 'borrador').length;

  const totalStr = eur(totals.total).replace('€','').trim();

  return (
    <>
      <div className="client-hero">
        <div className="month">
          <span>Mayo 2026 · hasta el 15</span>
          <div className="nav">
            <button><Icon name="chevron_left" size={14} /></button>
            <button><Icon name="chevron_right" size={14} /></button>
          </div>
        </div>
        <div className="total">
          {totalStr}<em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>€</em>
        </div>
        <div className="text-muted mt-2" style={{ fontSize: 13 }}>
          Facturación acumulada de este mes
        </div>
        <div className="breakdown">
          <span className="chip"><span className="lbl">Iguala</span> <span className="val mono">{eur(totals.retainer)}</span></span>
          <span className="chip"><span className="lbl">Extras</span> <span className="val mono">{eur(totals.variable)}</span></span>
          <span className="chip"><span className="lbl">Piezas</span> <span className="val">{totals.count}</span></span>
        </div>
      </div>

      {pending > 0 && (
        <div className="client-pending fade-in" onClick={() => {
          const first = monthWorks.find(w => w.status === 'borrador');
          if (first) onOpenWork(first.id);
        }}>
          <span className="accent-dot" />
          <div className="body">
            <div className="ttl">{pending} {pending === 1 ? 'pieza esperando' : 'piezas esperando'} tu visto bueno</div>
            <div className="sub">Échale un ojo cuando puedas — Antía espera para publicar</div>
          </div>
          <Icon name="chevron_right" size={18} />
        </div>
      )}

      <div className="client-section">
        <div className="client-section-head">
          <div className="ttl">Trabajos del mes</div>
          <span className="more">{monthWorks.length} en total</span>
        </div>
        {groups.map(g => (
          <div className="week-group" key={g.week}>
            <div className="week-head">
              <div className="label">Semana {g.week}</div>
              <div className="range">{g.range}</div>
            </div>
            <div className="work-list">
              {g.items.map(w => (
                <WorkRow key={w.id} work={w} onClick={() => onOpenWork(w.id)} compact />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="client-section" style={{ paddingTop: 8 }}>
        <div className="card card-pad" onClick={onOpenInvoice} style={{ cursor: 'pointer' }}>
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

// ───────────── Cliente · Calendario ─────────────
function ClienteCalendar({ client, works, onOpenWork }) {
  const monthWorks = worksFor(works, client.id, CURRENT_MONTH.year, CURRENT_MONTH.month);
  const [selected, setSelected] = useStateC(null);
  return (
    <>
      <div className="client-hero">
        <div className="month">
          <span>Mayo 2026</span>
          <div className="nav">
            <button><Icon name="chevron_left" size={14} /></button>
            <button><Icon name="chevron_right" size={14} /></button>
          </div>
        </div>
        <div className="h2" style={{ margin: 0 }}>Calendario editorial</div>
        <div className="text-muted mt-2" style={{ fontSize: 13 }}>Cuándo se publica cada pieza este mes</div>
      </div>
      <div className="client-section">
        <div className="card card-pad">
          <MiniCalendar year={2026} month={4} works={monthWorks} onPickDay={(d, list) => setSelected({ day: d, list })} />
          <div className="row gap-4 mt-6" style={{ fontSize: 11, flexWrap: 'wrap' }}>
            <span className="row gap-2"><span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--warn)' }} /> Borrador</span>
            <span className="row gap-2"><span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--accent)' }} /> Programado</span>
            <span className="row gap-2"><span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--ok)' }} /> Publicado</span>
          </div>
        </div>

        <div className="client-section-head" style={{ marginTop: 18 }}>
          <div className="ttl">
            {selected ? `${selected.day.getDate()} de ${MONTH_NAMES[selected.day.getMonth()].toLowerCase()}` : 'Próximas publicaciones'}
          </div>
        </div>
        <div className="work-list">
          {(selected ? selected.list : monthWorks.filter(w => w.date >= TODAY).sort((a, b) => a.date - b.date).slice(0, 4))
            .map(w => <WorkRow key={w.id} work={w} onClick={() => onOpenWork(w.id)} compact />)}
        </div>
      </div>
    </>
  );
}

// ───────────── Cliente · Factura del mes ─────────────
function ClienteInvoice({ client, works, monthYear }) {
  const my = monthYear || CURRENT_MONTH;
  const list = worksFor(works, client.id, my.year, my.month);
  const totals = totalFor(works, client.id, my.year, my.month);
  // group by type
  const byType = {};
  list.forEach(w => {
    if (!byType[w.type]) byType[w.type] = { type: getType(w.type), items: [], total: 0 };
    byType[w.type].items.push(w);
    byType[w.type].total += w.price;
  });
  const groups = Object.values(byType);

  const monthLabel = `${MONTH_NAMES[my.month]} ${my.year}`;

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
            <strong>Antía Vázquez</strong>
            Social media & estrategia<br />
            ESB-12345678<br />
            hola@antiav.studio
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="num">N.º 2026-05-{client.id === 'pilar' ? '014' : '015'}</div>
            <div className="text-muted mt-2" style={{ fontSize: 11 }}>Emisión 31 may 2026</div>
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
        </div>

        <div className="grand">
          <div className="lbl">Total a pagar</div>
          <div className="amt">{eurFull(totals.total)}</div>
        </div>

      </div>

      <div className="client-section" style={{ paddingTop: 6 }}>
        <div className="row gap-2">
          <Button variant="ghost" icon="download" style={{ flex: 1 }}>Descargar PDF</Button>
        </div>
      </div>
    </div>
  );
}

// ───────────── Cliente · Histórico ─────────────
function ClienteHistory({ client, works, onOpenMonth }) {
  const months = [
    { y: 2026, m: 4, label: 'Mayo 2026', state: 'En curso' },
    { y: 2026, m: 3, label: 'Abril 2026', state: 'Pagada' },
    { y: 2026, m: 2, label: 'Marzo 2026', state: 'Pagada' }
  ];
  return (
    <>
      <div className="client-hero" style={{ paddingBottom: 18 }}>
        <div className="month"><span>Tu cuenta</span></div>
        <div className="h2" style={{ margin: 0 }}>Histórico de meses</div>
        <div className="text-muted mt-2" style={{ fontSize: 13 }}>Cliente desde {client.since}</div>
      </div>
      <div className="client-section">
        <div className="card card-pad" style={{ background: 'var(--ink)', color: '#fff' }}>
          <div className="eyebrow" style={{ color: 'rgba(255,255,255,.5)' }}>Total facturado contigo</div>
          <div className="num-display mt-2" style={{ fontSize: 56, lineHeight: 1 }}>
            {eur(months.reduce((s, m) => s + totalFor(works, client.id, m.y, m.m).total, 0))}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)' }}>desde {client.since}</div>
        </div>

        <div className="mt-6">
          {months.map(m => {
            const t = totalFor(works, client.id, m.y, m.m);
            return (
              <div key={m.label} className="history-row" onClick={() => onOpenMonth(m)}>
                <div className="col" style={{ gap: 2, flex: 1 }}>
                  <div className="h-month">{m.label}</div>
                  <div className="h-meta">{t.count} piezas · iguala {eur(t.retainer)}</div>
                </div>
                <span className={`badge ${m.state === 'Pagada' ? 'badge-ok' : 'badge-accent'}`}>
                  <span className="dot" /> {m.state}
                </span>
                <div className="h-amount" style={{ marginLeft: 12 }}>{eur(t.total)}</div>
                <Icon name="chevron_right" size={16} className="h-arrow" />
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ───────────── Cliente · Trabajo detalle ─────────────
function ClienteWorkDetail({ work, client, onBack, onApprove }) {
  const type = getType(work.type);
  const [status, setStatus] = useStateC(work.status);
  return (
    <div>
      <div style={{ position: 'sticky', top: 0, background: 'var(--paper)', borderBottom: '1px solid var(--line)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, zIndex: 10 }}>
        <button className="btn-icon" onClick={onBack}><Icon name="chevron_left" size={16} /></button>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{type?.name}</div>
        <StatusBadge status={status} />
      </div>

      <div style={{ padding: 18 }}>
        <div
          style={{
            width: '100%',
            aspectRatio: '4/5',
            background: work.thumb
              ? `linear-gradient(135deg, ${work.thumb}, ${client.color})`
              : 'var(--paper-2)',
            borderRadius: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid var(--line)'
          }}
        >
          <Icon name={type?.icon || 'image'} size={48} stroke={1.3} style={{ opacity: .55 }} />
          <div style={{ position: 'absolute', bottom: 14, left: 14, right: 14, color: '#fff', fontFamily: 'var(--font-display)', fontSize: 24, lineHeight: 1.1, textShadow: '0 1px 12px rgba(0,0,0,.3)' }}>
            {work.title}
          </div>
        </div>

        <div className="h2 mt-6" style={{ margin: '20px 0 4px' }}>{work.title}</div>
        <div className="text-muted" style={{ fontSize: 13 }}>
          {type.name} · publicación prevista {work.date.getDate()} {MONTH_NAMES[work.date.getMonth()].toLowerCase()}
        </div>

        <div className="row mt-6 gap-4" style={{ alignItems: 'baseline' }}>
          <div>
            <div className="eyebrow">Precio</div>
            <div className="num-display" style={{ fontSize: 32 }}>{eur(work.price)}</div>
          </div>
          <div style={{ flex: 1 }} />
        </div>

        {work.notes && (
          <div className="card card-pad mt-4">
            <div className="eyebrow mb-2">Nota de Antía</div>
            <div style={{ fontSize: 13, lineHeight: 1.5 }}>{work.notes}</div>
          </div>
        )}

        {status === 'borrador' && (
          <div className="row gap-2 mt-6">
            <Button variant="ghost" style={{ flex: 1 }}>Pedir cambios</Button>
            <Button
              variant="accent"
              icon="check"
              style={{ flex: 1 }}
              onClick={() => { setStatus('aprobado'); onApprove(work.id); }}
            >Aprobar</Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ───────────── Wrapper ─────────────
function ClienteApp({ clientId, works, updateWork }) {
  const client = getClient(clientId);
  const [view, setView] = useStateC('home');
  const [openWork, setOpenWork] = useStateC(null);
  const [openMonth, setOpenMonth] = useStateC(null);

  if (openWork) {
    const w = works.find(x => x.id === openWork);
    return (
      <div className="client-app-shell">
        <ClienteWorkDetail
          work={w}
          client={client}
          onBack={() => setOpenWork(null)}
          onApprove={(id) => updateWork(id, { status: 'aprobado' })}
        />
      </div>
    );
  }

  return (
    <div className="client-app-shell" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <ClienteTopbar client={client} />
      <div style={{ flex: 1 }}>
        {view === 'home'     && <ClienteHome client={client} works={works} onOpenWork={setOpenWork} onOpenInvoice={() => setView('invoice')} />}
        {view === 'calendar' && <ClienteCalendar client={client} works={works} onOpenWork={setOpenWork} />}
        {view === 'invoice'  && <ClienteInvoice client={client} works={works} monthYear={openMonth} />}
        {view === 'history'  && <ClienteHistory client={client} works={works} onOpenMonth={(m) => { setOpenMonth({ year: m.y, month: m.m }); setView('invoice'); }} />}
      </div>
      <ClienteBottomNav view={view} setView={(v) => { setOpenMonth(null); setView(v); }} />
    </div>
  );
}

Object.assign(window, { ClienteApp });
