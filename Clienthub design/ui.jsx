/* global React, window */
// ───────────── UI primitives & icons ─────────────

const { useState, useEffect, useRef, useMemo } = React;

// ───────────── Icons (lucide-style, hand-trimmed) ─────────────
const I = {
  // navigation
  dashboard: <path d="M3 13h8V3H3v10Zm10 8h8V11h-8v10ZM3 21h8v-6H3v6ZM13 3v6h8V3h-8Z" />,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.6-3 3.4-5 6.5-5s5.9 2 6.5 5" /><circle cx="17" cy="7" r="2.8" /><path d="M14.5 14.2C16 13.5 17 13 17.5 13c2.5 0 4.6 1.6 5 4" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  invoice: <><path d="M5 3h11l3.5 3.5V21H5V3Z" /><path d="M15.5 3v4H20M9 12h7M9 16h7M9 8h2" /></>,
  history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5M12 8v5l3.5 2" /></>,
  settings: <><circle cx="12" cy="12" r="3.2" /><path d="M19.4 14.5a8 8 0 0 0 0-5l1.6-1.3-2-3.4-2 .8a8 8 0 0 0-4.4-2.5l-.3-2.1h-4l-.3 2.1a8 8 0 0 0-4.4 2.5l-2-.8-2 3.4 1.6 1.3a8 8 0 0 0 0 5l-1.6 1.3 2 3.4 2-.8a8 8 0 0 0 4.4 2.5l.3 2.1h4l.3-2.1a8 8 0 0 0 4.4-2.5l2 .8 2-3.4-1.6-1.3Z" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="M20.5 20.5l-5-5" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  chevron_down: <path d="M6 9l6 6 6-6" />,
  chevron_left: <path d="M15 6l-6 6 6 6" />,
  chevron_right: <path d="M9 6l6 6-6 6" />,
  arrow_right: <path d="M5 12h14M13 5l7 7-7 7" />,
  arrow_up_right: <path d="M7 17 17 7M8 7h9v9" />,
  download: <><path d="M12 4v12M6 12l6 6 6-6" /><path d="M4 20h16" /></>,
  close: <path d="M6 6l12 12M6 18L18 6" />,
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  more: <><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></>,
  // work-type icons
  video: <><rect x="3" y="6" width="13" height="12" rx="2" /><path d="M16 10l5-3v10l-5-3" /></>,
  image: <><rect x="3" y="3" width="18" height="18" rx="2.5" /><circle cx="9" cy="9" r="1.7" /><path d="M21 16l-5-5L5 21" /></>,
  layers: <><path d="M12 3 2 8.5 12 14l10-5.5L12 3Z" /><path d="m2 13.5 10 5.5 10-5.5M2 17.5l10 5.5 10-5.5" /></>,
  compass: <><circle cx="12" cy="12" r="9.5" /><path d="m15.5 8.5-2 6-6 2 2-6 6-2Z" /></>,
  mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8" /></>,
  chat: <path d="M21 12a8.5 8.5 0 0 1-12.4 7.6L3 21l1.4-5.6A8.5 8.5 0 1 1 21 12Z" />,
  wrench: <path d="m14.5 6.5 3-3a5 5 0 0 0-6.6 6.6l-7.4 7.4a2 2 0 0 0 2.8 2.8l7.4-7.4a5 5 0 0 0 6.6-6.6l-3 3-2.8-2.8Z" />,
  bell: <><path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9Z" /><path d="M10 21a2 2 0 0 0 4 0" /></>,
  paperclip: <path d="M21 11.5 12.5 20a5 5 0 0 1-7-7L14 4.5a3.5 3.5 0 0 1 5 5L10.5 18a2 2 0 0 1-3-3L15 7.5" />,
  filter: <path d="M3 5h18l-7 9v6l-4-2v-4L3 5Z" />,
  desktop: <><rect x="2.5" y="4" width="19" height="13" rx="2" /><path d="M8 21h8M12 17v4" /></>,
  mobile: <><rect x="7" y="2.5" width="10" height="19" rx="2.5" /><path d="M11 18.5h2" /></>,
  send: <path d="M21 3 3 11l7 3 3 7 8-18Z" />,
  smile: <><circle cx="12" cy="12" r="9.5" /><path d="M8.5 14s1.3 2 3.5 2 3.5-2 3.5-2" /><circle cx="9" cy="10" r=".8" fill="currentColor" /><circle cx="15" cy="10" r=".8" fill="currentColor" /></>,
  star: <path d="m12 3 2.7 5.6 6.3.9-4.5 4.4 1 6.2L12 17l-5.5 3 1-6.1L3 9.5l6.3-.9L12 3Z" />,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
  edit: <><path d="M4 20h4l10-10-4-4L4 16v4Z" /><path d="m14 6 4 4" /></>,
  trash: <><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></>,
  receipt: <path d="M5 2h14v20l-3.5-2L12 22l-3.5-2L5 22V2Z M8 8h8 M8 12h8 M8 16h5" />,
  external: <><path d="M14 4h6v6" /><path d="M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" /></>,
};

function Icon({ name, size = 16, stroke = 1.6, className, style }) {
  const path = I[name];
  if (!path) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >{path}</svg>
  );
}

// ───────────── Avatar ─────────────
function Avatar({ name, color, size = 'md', initials }) {
  const cls = { sm: 'avatar avatar-sm', md: 'avatar', lg: 'avatar avatar-lg', xl: 'avatar avatar-xl' }[size];
  const ini = initials || (name || '?').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  return (
    <span className={cls} style={{ background: color || '#E5E0D6', color: '#fff' }} aria-label={name}>
      {ini}
    </span>
  );
}

// ───────────── Status badge ─────────────
function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.borrador;
  return <span className={`badge ${s.className}`}><span className="dot" /> {s.label}</span>;
}

// ───────────── Button ─────────────
function Button({ variant = 'primary', size, children, icon, iconRight, onClick, type = 'button', disabled, style }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant} ${size ? 'btn-' + size : ''}`}
      style={style}
    >
      {icon && <Icon name={icon} size={size === 'sm' ? 13 : 14} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === 'sm' ? 13 : 14} />}
    </button>
  );
}

// ───────────── Work row (shared admin + cliente) ─────────────
function WorkRow({ work, onClick, showStatus = true, showThumb = true, compact }) {
  const type = getType(work.type);
  return (
    <div className="work-row fade-in" onClick={onClick}>
      {showThumb && (
        <div
          className={`work-thumb ${work.thumb ? 'has-img' : ''}`}
          style={work.thumb ? { background: work.thumb } : undefined}
          aria-hidden="true"
        >
          {!work.thumb && <Icon name={type?.icon || 'image'} size={22} stroke={1.4} />}
        </div>
      )}
      <div className="work-main">
        <div className="work-title">{work.title}</div>
        <div className="work-meta">
          <span>{type?.name}</span>
          <span className="sep" />
          <span>{work.date.getDate()} {MONTH_NAMES[work.date.getMonth()].toLowerCase()}</span>
          {work.notes && !compact && <>
            <span className="sep" />
            <span><Icon name="paperclip" size={11} /> nota</span>
          </>}
        </div>
      </div>
      {showStatus && (
        <div className="work-status-cell">
          <StatusBadge status={work.status} />
        </div>
      )}
      <div className="work-price">{eur(work.price)}</div>
      <Icon name="chevron_right" size={16} style={{ color: 'var(--muted)' }} />
    </div>
  );
}

// ───────────── Mini calendar (month grid) ─────────────
function MiniCalendar({ year, month, works, onPickDay }) {
  const first = new Date(year, month, 1);
  const startOfGrid = new Date(first);
  const dayOfWeek = (first.getDay() + 6) % 7; // monday-first
  startOfGrid.setDate(1 - dayOfWeek);
  const days = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(startOfGrid);
    d.setDate(startOfGrid.getDate() + i);
    days.push(d);
  }
  const isToday = (d) => d.toDateString() === TODAY.toDateString();
  const worksByDay = useMemo(() => {
    const m = {};
    works.filter(w => w.date.getFullYear() === year && w.date.getMonth() === month).forEach(w => {
      const k = w.date.getDate();
      if (!m[k]) m[k] = [];
      m[k].push(w);
    });
    return m;
  }, [works, year, month]);

  return (
    <div>
      <div className="cal-grid">
        {['L','M','X','J','V','S','D'].map((d, i) => <div className="cal-dow" key={i}>{d}</div>)}
        {days.map((d, i) => {
          const inMonth = d.getMonth() === month;
          const list = inMonth ? (worksByDay[d.getDate()] || []) : [];
          return (
            <div
              key={i}
              className={`cal-day ${!inMonth ? 'muted' : ''} ${list.length ? 'has-work' : ''} ${isToday(d) ? 'today' : ''}`}
              onClick={() => list.length && onPickDay && onPickDay(d, list)}
            >
              {d.getDate()}
              {list.length > 0 && (
                <div className="marks">
                  {list.slice(0, 3).map((w, idx) => (
                    <span key={idx} className={`mark ${w.status === 'borrador' ? 'draft' : (w.status === 'publicado' ? 'ok' : '')}`} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ───────────── Modal ─────────────
function Modal({ open, onClose, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

// ───────────── Toast ─────────────
function Toast({ message, onDone }) {
  useEffect(() => {
    if (!message) return;
    const id = setTimeout(onDone, 2400);
    return () => clearTimeout(id);
  }, [message, onDone]);
  if (!message) return null;
  return (
    <div className="toast"><span className="toast-dot" />{message}</div>
  );
}

// ───────────── Section header ─────────────
function SectionTitle({ title, subtitle, right }) {
  return (
    <div className="row between" style={{ alignItems: 'flex-end', marginBottom: 18 }}>
      <div>
        <h1 className="section-title">{title}</h1>
        {subtitle && <div className="section-sub">{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}

Object.assign(window, {
  Icon, Avatar, StatusBadge, Button, WorkRow, MiniCalendar, Modal, Toast, SectionTitle
});
