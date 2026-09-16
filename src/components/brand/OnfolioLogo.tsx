import React from 'react';

interface OnfolioLogoProps {
  size?: number | string;
  showWordmark?: boolean;
  className?: string;
  iconOnly?: boolean;
  wordmarkColor?: string;
}

/**
 * Official Onfolio Brand Mark & Wordmark
 * Source of truth based on official brand assets.
 */
export const OnfolioLogo: React.FC<OnfolioLogoProps> = ({
  size = 36,
  showWordmark = true,
  className = '',
  iconOnly = false,
  wordmarkColor = '#161C24',
}) => {
  const numericSize = typeof size === 'number' ? size : parseInt(size as string, 10) || 36;
  const markSize = numericSize;

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Official Onfolio Vector Mark */}
      <svg
        width={markSize}
        height={markSize}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-label="Onfolio Brand Mark"
      >
        {/* Left crescent arc */}
        <path
          d="M52 14.8C31.5 18.2 16 35.8 16 57C16 78.2 31.5 95.8 52 99.2V83.6C39.8 80.5 30.8 69.8 30.8 57C30.8 44.2 39.8 33.5 52 30.4V14.8Z"
          fill="#D4683B"
        />

        {/* Center opening folio door */}
        <path
          d="M56 12L78 19V95L56 102V12Z"
          fill="#D4683B"
        />

        {/* Right crescent arc */}
        <path
          d="M82 20.4C95.2 26.5 104 39.8 104 57C104 74.2 95.2 87.5 82 93.6V109C103.8 102.2 119 82.2 119 57C119 31.8 103.8 11.8 82 5V20.4Z"
          fill="#D4683B"
        />
      </svg>

      {/* Official Onfolio Wordmark */}
      {showWordmark && !iconOnly && (
        <span
          className="font-bold tracking-tight text-[1.25em] leading-none"
          style={{ color: wordmarkColor, letterSpacing: '-0.025em' }}
        >
          Onfolio
        </span>
      )}
    </div>
  );
};
