import React from 'react';
import { ShieldCheck, ShieldAlert, Eye, Check } from 'lucide-react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'verified' | 'unverified' | 'scanned' | 'warning' | 'neutral' | 'outline';
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  showIcon = false,
  className = '',
  ...props
}) => {
  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  const variantStyles = {
    default: 'bg-neutral-900 text-white border-transparent',
    verified: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold',
    unverified: 'bg-neutral-100 text-neutral-700 border-neutral-200',
    scanned: 'bg-blue-50 text-blue-800 border-blue-200 font-medium',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    neutral: 'bg-neutral-100 text-neutral-800 border-neutral-200',
    outline: 'bg-transparent text-neutral-700 border-neutral-300',
  };

  const getIcon = () => {
    if (!showIcon) return null;
    switch (variant) {
      case 'verified':
        return <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />;
      case 'scanned':
        return <Eye className="w-3 h-3 text-blue-600 shrink-0" />;
      case 'warning':
        return <ShieldAlert className="w-3 h-3 text-amber-600 shrink-0" />;
      case 'default':
        return <Check className="w-3 h-3 text-white shrink-0" />;
      default:
        return null;
    }
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border font-medium whitespace-nowrap leading-none ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {getIcon()}
      <span>{children}</span>
    </span>
  );
};
