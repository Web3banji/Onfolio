import React from 'react';
import { Holding } from '../../types/index.ts';
import { Badge } from './Badge.tsx';
import { ShieldCheck, ExternalLink, AlertCircle } from 'lucide-react';

export interface AssetRowProps {
  holding: Holding;
  onInspect?: (holding: Holding) => void;
  currencySymbol?: string;
}

export const AssetRow: React.FC<AssetRowProps> = ({
  holding,
  onInspect,
  currencySymbol = '$',
}) => {
  const { asset, amountFormatted, valueUsd, marketPrice, portfolioSharePercentage } = holding;

  return (
    <div
      onClick={() => onInspect?.(holding)}
      className="p-3.5 bg-white rounded-lg border border-neutral-200 hover:border-neutral-300 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
    >
      {/* Left: Asset info & regulatory status */}
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-neutral-900 text-white font-bold flex items-center justify-center shrink-0 text-xs font-mono shadow-2xs">
          {asset.underlyingTicker.slice(0, 4)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-neutral-900 text-sm">{asset.symbol}</span>
            <span className="text-neutral-500 font-medium">({asset.underlyingTicker})</span>
            <Badge variant="outline" size="sm">
              {asset.issuer}
            </Badge>
            {holding.isCompliantToken2022 && (
              <Badge variant="neutral" size="sm">
                Token-2022
              </Badge>
            )}
          </div>
          <p className="text-neutral-500 text-[11px] truncate mt-0.5">
            {asset.name} • {asset.jurisdiction}
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 mt-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
            <span>Custodian: {asset.custodianName}</span>
            <span>•</span>
            <span className="font-mono text-neutral-500">{marketPrice.statusText}</span>
          </div>
        </div>
      </div>

      {/* Right: Quantity, Valuation, & Allocation */}
      <div className="flex sm:flex-col items-between sm:items-end justify-between shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
        <div>
          <div className="text-right font-bold text-neutral-900 sm:text-sm">
            {valueUsd !== null ? (
              `${currencySymbol}${valueUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            ) : (
              <span className="text-neutral-400 text-xs flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-amber-500" />
                Price unavailable
              </span>
            )}
          </div>
          <div className="text-right text-[11px] text-neutral-500 font-mono mt-0.5">
            {amountFormatted.toLocaleString()} {asset.symbol}
            {portfolioSharePercentage > 0 && ` (${portfolioSharePercentage}%)`}
          </div>
        </div>
      </div>
    </div>
  );
};
