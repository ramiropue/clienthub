import React from 'react';

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export function SectionTitle({ title, subtitle, right }: SectionTitleProps) {
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
