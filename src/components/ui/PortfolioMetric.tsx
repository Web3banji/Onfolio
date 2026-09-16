import React from 'react';
import { HelpCircle, AlertCircle } from 'lucide-react';

export interface PortfolioMetricProps {
  label: string;
  value: React.ReactNode;
  subtitle?: string;
  tooltip?: string;
  isUnavailable?: boolean;
  unavailableText?: string;
  icon?: React.ReactNode;
  className?: string;
}

export const PortfolioMetric: React.FC<PortfolioMetricProps> = ({
  label,
  value,
  subtitle,
  tooltip,
  isUnavailable = false,
  unavailableText = 'Unavailable',
  icon,
  className = '',
}) => {
  return (
    <div className={`p-4 bg-white rounded-xl border border-neutral-200 shadow-2xs text-xs flex flex-col justify-between ${className}`}>
      <div className="flex items-center justify-between gap-1 text-neutral-500 mb-1">
        <div className="flex items-center gap-1.5 font-semibold text-neutral-600">
          {icon}
          <span>{label}</span>
        </div>
        {tooltip && (
          <div className="text-neutral-400 hover:text-neutral-600 cursor-help" title={tooltip}>
            <HelpCircle className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      <div className="my-1">
        {isUnavailable ? (
          <div className="text-sm font-semibold text-neutral-400 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            <span>{unavailableText}</span>
          </div>
        ) : (
          <div className="text-lg font-bold text-neutral-900 tracking-tight">
            {value}
          </div>
        )}
      </div>

      {subtitle && (
        <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
          {subtitle}
        </div>
      )}
    </div>
  );
};
