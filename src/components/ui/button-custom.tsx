import React from 'react';
import { Icon } from '@/components/ui/icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'ghost' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  iconRight?: string;
}

export function ButtonCustom({ 
  variant = 'primary', 
  size, 
  children, 
  icon, 
  iconRight, 
  className = '', 
  ...props 
}: ButtonProps) {
  const sizeClass = size ? `btn-${size}` : '';
  const variantClass = `btn-${variant}`;
  
  return (
    <button
      className={`btn ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {icon && <Icon name={icon} size={size === 'sm' ? 13 : 14} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === 'sm' ? 13 : 14} />}
    </button>
  );
}
