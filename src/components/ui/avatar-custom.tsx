import React from 'react';

interface AvatarProps {
  name?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  initials?: string;
  logoUrl?: string | null;
}

export function AvatarCustom({ name, color, size = 'md', initials, logoUrl }: AvatarProps) {
  const cls = {
    sm: 'avatar avatar-sm',
    md: 'avatar',
    lg: 'avatar avatar-lg',
    xl: 'avatar avatar-xl',
  }[size];

  const ini = initials || (name || '?').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt={name || 'logo'}
        className={cls}
        style={{ objectFit: 'cover', background: color || '#E5E0D6' }}
      />
    );
  }

  return (
    <span
      className={cls}
      style={{ background: color || '#E5E0D6', color: '#fff' }}
      aria-label={name}
    >
      {ini}
    </span>
  );
}
