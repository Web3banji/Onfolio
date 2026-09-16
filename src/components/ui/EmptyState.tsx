import React from 'react';
import { LucideIcon, Search, AlertCircle, Loader2, Info } from 'lucide-react';
import { Button } from './Button.tsx';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Search,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`p-8 text-center bg-white rounded-xl border border-dashed border-neutral-300 flex flex-col items-center justify-center max-w-lg mx-auto my-4 ${className}`}>
      <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-bold text-neutral-900 mb-1">{title}</h4>
      <p className="text-xs text-neutral-500 max-w-sm mb-4">{description}</p>
      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export interface LoadingStateProps {
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Scanning Solana ledger & verifying token accounts...',
  className = '',
}) => {
  return (
    <div className={`p-12 text-center flex flex-col items-center justify-center ${className}`}>
      <div className="relative mb-4">
        <div className="w-10 h-10 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
      </div>
      <p className="text-xs font-medium text-neutral-800">{message}</p>
      <p className="text-[11px] text-neutral-400 mt-1">Direct cryptographic inspection of token accounts</p>
    </div>
  );
};

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Encountered an issue',
  message,
  onRetry,
  className = '',
}) => {
  return (
    <div className={`p-5 rounded-xl bg-red-50/70 border border-red-200 text-xs flex items-start gap-3 text-red-900 ${className}`}>
      <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <h4 className="font-bold mb-0.5">{title}</h4>
        <p className="text-red-700 leading-relaxed">{message}</p>
        {onRetry && (
          <div className="mt-3">
            <Button size="sm" variant="outline" onClick={onRetry} className="bg-white border-red-300 text-red-800 hover:bg-red-50">
              Retry Operation
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export interface ToastProps {
  type?: 'success' | 'info' | 'warning' | 'error';
  message: string;
  onDismiss?: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  type = 'info',
  message,
  onDismiss,
}) => {
  const styles = {
    success: 'bg-emerald-900 text-white border-emerald-800',
    info: 'bg-neutral-900 text-white border-neutral-800',
    warning: 'bg-amber-900 text-white border-amber-800',
    error: 'bg-red-900 text-white border-red-800',
  }[type];

  return (
    <div className={`fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-lg shadow-xl border text-xs font-medium flex items-center gap-2.5 ${styles} animate-in slide-in-from-bottom-2`}>
      <Info className="w-4 h-4 shrink-0" />
      <span>{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="ml-2 text-white/70 hover:text-white"
        >
          ✕
        </button>
      )}
    </div>
  );
};
