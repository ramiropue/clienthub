"use client";

import React, { useMemo } from 'react';
import { TODAY } from '@/lib/mock-data';

interface MiniCalendarProps {
  year: number;
  month: number;
  works: any[];
  onPickDay?: (d: Date, works: any[]) => void;
}

export function MiniCalendar({ year, month, works, onPickDay }: MiniCalendarProps) {
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
  
  const isToday = (d: Date) => d.toDateString() === TODAY.toDateString();
  
  const worksByDay = useMemo(() => {
    const m: Record<number, any[]> = {};
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
