import React from 'react';
import { getType, MONTH_NAMES, eur } from '@/lib/mock-data';
import { Icon } from '@/components/ui/icon';
import { StatusBadge } from '@/components/ui/status-badge';

interface WorkRowProps {
  work: any;
  workType?: any;
  onClick?: () => void;
  onStatusChange?: (newStatus: string) => void;
  showStatus?: boolean;
  showThumb?: boolean;
  compact?: boolean;
}

export function WorkRow({ work, workType, onClick, onStatusChange, showStatus = true, showThumb = true, compact }: WorkRowProps) {
  const type = workType || getType(work.type);
  const actuallyShowStatus = showStatus && type?.group === 'contenido';

  let dateStr = `${work.date.getDate()} ${MONTH_NAMES[work.date.getMonth()].toLowerCase()}`;
  if (type?.id === 'reunion') {
    let meetingTime = '';
    if (work.notes) {
      const timeMatch = work.notes.match(/\*\*Hora:\*\* (.*)/);
      if (timeMatch) meetingTime = timeMatch[1].trim();
    }
    
    if (meetingTime) {
      dateStr += ` a las ${meetingTime}`;
    } else {
      const hours = work.date.getHours();
      const minutes = work.date.getMinutes();
      if (hours !== 0 || minutes !== 0) {
        dateStr += ` a las ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
    }
  }

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
          <span>{dateStr}</span>
          {work.notes && !compact && <>
            <span className="sep" />
            <span><Icon name="paperclip" size={11} /> nota</span>
          </>}
        </div>
      </div>
      {actuallyShowStatus && (
        <div className="work-status-cell" onClick={(e) => {
          if (onStatusChange) {
            e.stopPropagation();
            const next = work.status === 'borrador' ? 'aprobado' : (work.status === 'aprobado' ? 'publicado' : 'borrador');
            onStatusChange(next);
          }
        }}>
          <StatusBadge status={work.status} />
        </div>
      )}
      <div className="work-price">{eur(work.price)}</div>
      <Icon name="chevron_right" size={16} style={{ color: 'var(--muted)' }} />
    </div>
  );
}
