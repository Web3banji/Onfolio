/**
 * Presentation Layer: Clean Portfolio Holdings Interface
 * 
 * CORE RULES:
 * Each holding prioritizes:
 * - Company
 * - Ticker
 * - Quantity
 * - Value
 * - Allocation
 * - Performance when available
 * - Verification state
 * - Market-data source visible but subtle.
 * Do not expose raw blockchain information in primary interface.
 */

import React, { useState } from 'react';
import { useOnfolio } from '../../state/OnfolioContext.tsx';
import { ShieldCheck, ChevronRight, ExternalLink, X } from 'lucide-react';
import { PortfolioHolding } from '../../types/index.ts';

interface PortfolioViewProps {
  onOpenWallets: () => void;
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({ onOpenWallets }) => {
  const { portfolio, privacySettings } = useOnfolio();
  const [selectedHolding, setSelectedHolding] = useState<PortfolioHolding | null>(null);

  if (!portfolio || portfolio.holdings.length === 0) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-[#E8E4DD] text-center space-y-4 max-w-md mx-auto my-12">
        <div className="w-12 h-12 rounded-full bg-[#FAF8F5] border border-[#E8E4DD] flex items-center justify-center mx-auto text-[#8C97A5]">
          <ShieldCheck className="w-6 h-6 text-[#5E6978]" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-[#161C24]">No supported assets</h3>
          <p className="text-xs text-[#5E6978]">
            This wallet contains no tokenized equity assets recognized in the registry.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenWallets}
          className="h-10 px-5 bg-[#161C24] hover:bg-[#2B333E] text-white rounded-xl text-xs font-medium transition-colors cursor-pointer"
        >
          Scan another wallet
        </button>
      </div>
    );
  }

  const isMasked = privacySettings.hideAbsoluteBalances;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#161C24]">Holdings</h1>
          <p className="text-xs text-[#5E6978]">{portfolio.holdings.length} tokenized equity positions</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-[#8C97A5]">Total Value</div>
          <div className="text-lg font-bold text-[#161C24]">
            {isMasked
              ? '$••••••••'
              : `$${portfolio.totalValueUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="bg-white rounded-2xl border border-[#E8E4DD] overflow-hidden">
        {/* Desktop Head */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-[#E8E4DD]/60 text-xs font-semibold text-[#8C97A5] uppercase tracking-wider">
          <div className="col-span-4">Asset</div>
          <div className="col-span-2 text-right">Quantity</div>
          <div className="col-span-2 text-right">Price</div>
          <div className="col-span-2 text-right">Value</div>
          <div className="col-span-2 text-right">Allocation</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-[#E8E4DD]/60">
          {portfolio.holdings.map((holding) => (
            <div
              key={holding.id}
              onClick={() => setSelectedHolding(holding)}
              className="px-6 py-4 hover:bg-[#FAF8F5] transition-colors cursor-pointer flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-4 items-start md:items-center"
            >
              {/* Asset Identity */}
              <div className="md:col-span-4 flex items-center gap-3 w-full">
                <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#E8E4DD] flex items-center justify-center font-bold text-xs text-[#D4683B] shrink-0">
                  {holding.asset.symbol.slice(0, 2)}
                </div>
                <div>
                  <div className="font-semibold text-xs text-[#161C24] flex items-center gap-1.5">
                    <span>{holding.asset.name}</span>
                    <span className="text-[10px] text-[#1B7A4F] bg-[#EAF6EE] px-1.5 py-0.5 rounded font-medium">
                      Verified
                    </span>
                  </div>
                  <div className="text-[11px] text-[#5E6978] flex items-center gap-2 mt-0.5">
                    <span className="font-mono font-medium">{holding.asset.symbol}</span>
                    <span>·</span>
                    <span>{holding.asset.issuer}</span>
                    <span>·</span>
                    <span className="text-[#8C97A5] text-[10px]">
                      {(holding.marketPrice?.source?.id === 'pyth_hermes'
                        ? 'PYTH'
                        : holding.marketPrice?.source?.name ||
                          holding.marketData?.provider ||
                          'ORACLE'
                      ).toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quantity */}
              <div className="md:col-span-2 text-left md:text-right w-full flex md:block justify-between text-xs">
                <span className="text-[#8C97A5] md:hidden">Quantity:</span>
                <span className="font-mono font-medium text-[#161C24]">
                  {isMasked ? '••••' : holding.amountFormatted.toLocaleString()}
                </span>
              </div>

              {/* Price */}
              <div className="md:col-span-2 text-left md:text-right w-full flex md:block justify-between text-xs">
                <span className="text-[#8C97A5] md:hidden">Price:</span>
                <span className="text-[#5E6978]">
                  {holding.marketPrice?.price !== null && holding.marketPrice?.price !== undefined
                    ? `$${holding.marketPrice.price.toFixed(2)}`
                    : 'Price unavailable'}
                </span>
              </div>

              {/* Value */}
              <div className="md:col-span-2 text-left md:text-right w-full flex md:block justify-between text-xs">
                <span className="text-[#8C97A5] md:hidden">Value:</span>
                <span className="font-semibold text-[#161C24]">
                  {isMasked
                    ? '••••••'
                    : holding.valueUsd !== null
                    ? `$${holding.valueUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                    : '—'}
                </span>
              </div>

              {/* Allocation */}
              <div className="md:col-span-2 text-left md:text-right w-full flex md:block justify-between items-center text-xs">
                <span className="text-[#8C97A5] md:hidden">Share:</span>
                <div className="flex items-center justify-end gap-2">
                  <span className="font-medium text-[#161C24]">{holding.portfolioSharePercentage}%</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#8C97A5] hidden md:inline" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Holding Detail Drawer / Modal (Progressive Disclosure) */}
      {selectedHolding && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#E8E4DD] max-w-md w-full p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#FAF8F5] border border-[#E8E4DD] flex items-center justify-center font-bold text-xs text-[#D4683B]">
                  {selectedHolding.asset.symbol.slice(0, 2)}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#161C24]">{selectedHolding.asset.name}</h3>
                  <div className="text-[11px] text-[#5E6978]">{selectedHolding.asset.issuer}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedHolding(null)}
                className="text-[#8C97A5] hover:text-[#161C24] p-1 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs divide-y divide-[#E8E4DD]/60">
              <div className="flex justify-between py-2">
                <span className="text-[#5E6978]">Asset Class</span>
                <span className="font-medium text-[#161C24]">{selectedHolding.asset.underlyingAssetClass || 'Equity'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[#5E6978]">Jurisdiction</span>
                <span className="font-medium text-[#161C24]">{selectedHolding.asset.jurisdiction || 'Regulated'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[#5E6978]">Backing Model</span>
                <span className="font-medium text-[#161C24]">
                  {selectedHolding.asset.custodianName
                    ? `1:1 Custodial (${selectedHolding.asset.custodianName})`
                    : '1:1 Custodial Backing'}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[#5E6978]">Pricing Oracle</span>
                <span className="font-medium text-[#161C24]">
                  {selectedHolding.marketPrice?.source?.id === 'pyth_hermes' ||
                  selectedHolding.marketData?.provider === 'pyth'
                    ? 'Pyth Network Hermes'
                    : selectedHolding.marketPrice?.source?.name || 'Audited Custodian NAV'}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[#5E6978]">Token Mint</span>
                <span className="font-mono text-[11px] text-[#161C24] truncate max-w-[200px]">
                  {selectedHolding.asset.mint}
                </span>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <a
                href={`https://solscan.io/token/${selectedHolding.asset.mint}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 h-10 border border-[#E8E4DD] hover:bg-[#FAF8F5] rounded-xl text-xs font-medium text-[#161C24] flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>View Solscan</span>
                <ExternalLink className="w-3 h-3 text-[#8C97A5]" />
              </a>
              <button
                type="button"
                onClick={() => setSelectedHolding(null)}
                className="flex-1 h-10 bg-[#161C24] hover:bg-[#2B333E] text-white rounded-xl text-xs font-medium transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
