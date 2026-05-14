import React from 'react';
import { STATUS } from '@/lib/mock-data';

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const s = STATUS[status as keyof typeof STATUS] || STATUS.borrador;
  return (
    <span className={`badge ${s.className}`}>
      <span className="dot" /> {s.label}
    </span>
  );
}
