import React from 'react';

export interface StatusIndicatorProps {
  status: 'online' | 'syncing' | 'offline' | 'warning' | 'live';
  label?: string;
  pulse?: boolean;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  pulse = true,
  className = '',
}) => {
  const dotColor = {
    online: 'bg-emerald-500',
    live: 'bg-emerald-500',
    syncing: 'bg-blue-500',
    warning: 'bg-amber-500',
    offline: 'bg-neutral-400',
  }[status];

  const pulseRing = {
    online: 'bg-emerald-400',
    live: 'bg-emerald-400',
    syncing: 'bg-blue-400',
    warning: 'bg-amber-400',
    offline: 'bg-neutral-300',
  }[status];

  return (
    <div className={`inline-flex items-center gap-2 text-xs text-neutral-700 ${className}`}>
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pulseRing}`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`} />
      </span>
      {label && <span className="font-medium text-neutral-800">{label}</span>}
    </div>
  );
};
