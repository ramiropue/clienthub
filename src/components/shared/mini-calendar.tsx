"use client";

import React, { useMemo } from 'react';
import { TODAY } from '@/lib/mock-data';

interface MiniCalendarProps {
  year: number;
  month: number;
  works: any[];
  onPickDay?: (d: Date, works: any[]) => void;
  viewMode?: 'month' | 'week';
}

export function MiniCalendar({ year, month, works, onPickDay, viewMode = 'month' }: MiniCalendarProps) {
  const first = new Date(year, month, 1);
  const startOfGrid = new Date(first);
  const dayOfWeek = (first.getDay() + 6) % 7; // monday-first
  startOfGrid.setDate(1 - dayOfWeek);
  
  const days = [];
  if (viewMode === 'week') {
    // Week containing TODAY
    const dayOfWeekToday = (TODAY.getDay() + 6) % 7;
    const startOfWeek = new Date(TODAY);
    startOfWeek.setDate(TODAY.getDate() - dayOfWeekToday);
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d);
    }
  } else {
    for (let i = 0; i < 42; i++) {
      const d = new Date(startOfGrid);
      d.setDate(startOfGrid.getDate() + i);
      days.push(d);
    }
  }
  
  const isToday = (d: Date) => d.toDateString() === TODAY.toDateString();
  
  const worksByDay = useMemo(() => {
    const m: Record<string, any[]> = {};
    works.forEach(w => {
      const k = w.date.toDateString();
      if (!m[k]) m[k] = [];
      m[k].push(w);
    });
    return m;
  }, [works]);

  return (
    <div>
      <div className="cal-grid">
        {['L','M','X','J','V','S','D'].map((d, i) => <div className="cal-dow" key={i}>{d}</div>)}
        {days.map((d, i) => {
          const inMonth = viewMode === 'week' ? true : d.getMonth() === month;
          const list = worksByDay[d.toDateString()] || [];
          return (
            <div
              key={i}
              className={`cal-day ${!inMonth ? 'muted' : ''} ${list.length ? 'has-work' : ''} ${isToday(d) ? 'today' : ''}`}
              onClick={() => onPickDay && onPickDay(d, list)}
              style={{ cursor: 'pointer' }}
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
