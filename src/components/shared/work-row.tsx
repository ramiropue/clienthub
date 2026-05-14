import React from 'react';
import { getType, MONTH_NAMES, eur } from '@/lib/mock-data';
import { Icon } from '@/components/ui/icon';
import { StatusBadge } from '@/components/ui/status-badge';

interface WorkRowProps {
  work: any;
  onClick?: () => void;
  showStatus?: boolean;
  showThumb?: boolean;
  compact?: boolean;
}

export function WorkRow({ work, onClick, showStatus = true, showThumb = true, compact }: WorkRowProps) {
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
