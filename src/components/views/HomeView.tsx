/**
 * Presentation Layer: Home / Dashboard View
 * 
 * CORE RULES:
 * The dashboard must immediately communicate:
 * - Portfolio value
 * - Holdings
 * - Allocation
 * - Recent activity
 * - Verification
 * Do not overload the screen. Use progressive disclosure.
 * Very little text, clear numbers, whitespace, visual hierarchy.
 */

import React from 'react';
import { useOnfolio } from '../../state/OnfolioContext.tsx';
import { ShieldCheck, ArrowRight, ExternalLink, AlertCircle } from 'lucide-react';

interface HomeViewProps {
  onNavigateToPortfolio: () => void;
  onNavigateToPassport: () => void;
  onOpenVerifier: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigateToPortfolio,
  onNavigateToPassport,
  onOpenVerifier,
}) => {
  const { portfolio, passport, privacySettings, activeWallet } = useOnfolio();

  if (!portfolio) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="text-sm font-medium text-[#161C24]">No portfolio loaded</div>
        <p className="text-xs text-[#5E6978]">Connect or scan a wallet to view holdings.</p>
      </div>
    );
  }

  const isMasked = privacySettings.hideAbsoluteBalances;
  const isScanned = activeWallet?.isScannedOnly ?? false;
  const isVerified = !isScanned && activeWallet?.verificationStatus === 'verified';

  const formattedTotal = isMasked
    ? '$••••••••'
    : `$${portfolio.totalValueUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const topHoldings = portfolio.holdings.slice(0, 4);
  const recentTxs = portfolio.transactions.slice(0, 3);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. Value Hero */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E8E4DD] space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#5E6978] font-medium tracking-wide">PORTFOLIO VALUE</span>
          {isVerified ? (
            <button
              type="button"
              onClick={onOpenVerifier}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EAF6EE] text-[#1B7A4F] text-xs font-medium cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Onchain</span>
            </button>
          ) : isScanned ? (
            <span className="text-xs text-[#5E6978] bg-[#F5F2EC] px-2.5 py-1 rounded-full font-medium">
              Scanned Wallet (Read-Only)
            </span>
          ) : (
            <span className="text-xs text-[#9E6700] bg-[#FEF8E7] px-2.5 py-1 rounded-full font-medium">
              Unverified Wallet
            </span>
          )}
        </div>

        <div className="text-3xl sm:text-5xl font-bold tracking-tight text-[#161C24]">
          {formattedTotal}
        </div>

        {/* Quick Indicators */}
        <div className="pt-4 border-t border-[#E8E4DD]/60 grid grid-cols-3 gap-4 text-xs">
          <div>
            <div className="text-[#8C97A5] text-[11px]">Holdings</div>
            <div className="font-semibold text-[#161C24] text-sm mt-0.5">
              {portfolio.holdings.length}
            </div>
          </div>
          <div>
            <div className="text-[#8C97A5] text-[11px]">Issuers</div>
            <div className="font-semibold text-[#161C24] text-sm mt-0.5">
              {portfolio.uniqueIssuersCount}
            </div>
          </div>
          <div>
            <div className="text-[#8C97A5] text-[11px]">Identity Tier</div>
            <div className="font-semibold text-[#161C24] text-sm mt-0.5 truncate">
              {passport?.tier ? passport.tier.split('—')[1]?.trim() || passport.tier : 'Explorer'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Allocation Bar */}
      {portfolio.holdings.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-[#E8E4DD] space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#161C24] uppercase tracking-wider">Allocation</span>
            <button
              type="button"
              onClick={onNavigateToPortfolio}
              className="text-xs text-[#D4683B] hover:text-[#BE582E] font-medium inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Segmented bar */}
          <div className="h-3 w-full rounded-full bg-[#F0EDE5] flex overflow-hidden">
            {portfolio.holdings.map((h, i) => {
              const colors = ['#D4683B', '#161C24', '#5E6978', '#9E6700', '#2E7D32'];
              const color = colors[i % colors.length];
              return (
                <div
                  key={h.id}
                  style={{ width: `${Math.max(h.portfolioSharePercentage, 4)}%`, backgroundColor: color }}
                  title={`${h.asset.symbol}: ${h.portfolioSharePercentage}%`}
                />
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 pt-1 text-xs">
            {portfolio.holdings.map((h, i) => {
              const colors = ['#D4683B', '#161C24', '#5E6978', '#9E6700', '#2E7D32'];
              const color = colors[i % colors.length];
              return (
                <div key={h.id} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="font-medium text-[#161C24]">{h.asset.symbol}</span>
                  <span className="text-[#8C97A5]">{h.portfolioSharePercentage}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Top Holdings & Activity Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Holdings Summary */}
        <div className="bg-white p-6 rounded-2xl border border-[#E8E4DD] space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#161C24] uppercase tracking-wider">Top Holdings</span>
            <button
              type="button"
              onClick={onNavigateToPortfolio}
              className="text-xs text-[#D4683B] hover:text-[#BE582E] font-medium inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {topHoldings.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#8C97A5]">No holdings identified</div>
          ) : (
            <div className="divide-y divide-[#E8E4DD]/60">
              {topHoldings.map((h) => (
                <div key={h.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-[#161C24]">{h.asset.name}</div>
                    <div className="text-[#5E6978]">{h.asset.symbol} · {h.asset.issuer}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-[#161C24]">
                      {isMasked ? '••••••' : h.valueUsd !== null ? `$${h.valueUsd.toLocaleString()}` : 'Price unavailable'}
                    </div>
                    <div className="text-[11px] text-[#8C97A5]">
                      {isMasked ? '•••' : `${h.amountFormatted} shares`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-2xl border border-[#E8E4DD] space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#161C24] uppercase tracking-wider">Recent Activity</span>
            <button
              type="button"
              onClick={onNavigateToPassport}
              className="text-xs text-[#D4683B] hover:text-[#BE582E] font-medium inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Passport</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentTxs.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#8C97A5]">No recent activity</div>
          ) : (
            <div className="divide-y divide-[#E8E4DD]/60">
              {recentTxs.map((tx) => (
                <div key={tx.signature} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-medium text-[#161C24]">
                      {tx.type} {tx.assetSymbol}
                    </div>
                    <div className="text-[11px] text-[#8C97A5]">
                      {new Date(tx.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-xs text-[#161C24]">
                      +{tx.amount} {tx.assetSymbol}
                    </div>
                    <span className="text-[10px] text-[#1B7A4F] bg-[#EAF6EE] px-1.5 py-0.5 rounded font-medium">
                      Finalized
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
