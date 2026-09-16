import React from 'react';

export interface ChartContainerProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  subtitle,
  actions,
  children,
  className = '',
}) => {
  return (
    <div className={`bg-white rounded-xl border border-neutral-200 p-5 shadow-2xs ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-4 border-b border-neutral-100 pb-3">
        <div>
          <h4 className="text-sm font-bold text-neutral-900">{title}</h4>
          {subtitle && <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="w-full min-h-[180px] flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};
