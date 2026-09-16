import React, { InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, leftIcon, rightIcon, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1 text-left">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-neutral-800">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-neutral-400 pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full text-xs text-neutral-900 bg-white border rounded-lg transition-colors placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 ${
              leftIcon ? 'pl-9' : 'pl-3'
            } ${rightIcon ? 'pr-9' : 'pr-3'} py-2 ${
              error
                ? 'border-red-500 focus:ring-red-500 bg-red-50/20'
                : 'border-neutral-300 hover:border-neutral-400'
            } ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 text-neutral-400 pointer-events-none flex items-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-[11px] text-red-600 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-[11px] text-neutral-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
