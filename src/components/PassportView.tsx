/**
 * Presentation Layer: Passport Identity View
 * 
 * CORE RULES:
 * Design Passport as a premium identity page.
 * Feels like an investment profile rather than a dashboard.
 * Shows:
 * - Onfolio identity
 * - Portfolio summary
 * - Verified positions
 * - Relevant history
 * - Milestones
 * - Wallet relationship
 * - Verification status
 * Clean, sparse, zero marketing fluff or raw blockchain clutter.
 */

import React, { useState } from 'react';
import { useOnfolio } from '../state/OnfolioContext.tsx';
import { OnfolioLogo } from './brand/OnfolioLogo.tsx';
import {
  ShieldCheck,
  Copy,
  Check,
  Download,
  Sliders,
  Award,
  Wallet as WalletIcon,
  Clock,
  Building2,
} from 'lucide-react';
import { privacyService } from '../privacy/privacyService.ts';

interface PassportViewProps {
  onOpenVerifier: () => void;
  onOpenPrivacy?: () => void;
  onOpenWallets?: () => void;
}

export const PassportView: React.FC<PassportViewProps> = ({
  onOpenVerifier,
  onOpenPrivacy,
  onOpenWallets,
}) => {
  const { passport, portfolio, privacySettings, currentUser, activeWallet } = useOnfolio();
  const [copiedId, setCopiedId] = useState(false);
  const [exported, setExported] = useState(false);

  if (!passport || !portfolio) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-[#E8E4DD] text-center space-y-3 max-w-md mx-auto my-12">
        <h3 className="text-base font-bold text-[#161C24]">No passport generated</h3>
        <p className="text-xs text-[#5E6978]">Connect or scan a wallet to view your investment identity.</p>
      </div>
    );
  }

  const sanitized = privacyService.sanitizePassport(passport, privacySettings);
  const isMasked = privacySettings.hideAbsoluteBalances;
  const isScanned = activeWallet?.isScannedOnly ?? false;
  const isVerified = !isScanned && activeWallet?.verificationStatus === 'verified';

  const handleCopyId = () => {
    navigator.clipboard.writeText(passport.passportId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1500);
  };

  const handleExportProof = () => {
    const proof = privacyService.exportShareableProof(passport, privacySettings);
    const blob = new Blob([JSON.stringify(proof, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `onfolio-passport-${passport.passportId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
    setTimeout(() => setExported(false), 1500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* 1. The Onfolio Identity Credential Card */}
      <div className="bg-white rounded-2xl border border-[#E8E4DD] overflow-hidden shadow-xs">
        {/* Top Header Banner */}
        <div className="p-6 sm:p-8 bg-[#FAF8F5] border-b border-[#E8E4DD] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <OnfolioLogo size={44} iconOnly />
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-widest text-[#8C97A5]">
                Onchain Investment Passport
              </div>
              <h1 className="text-xl font-bold text-[#161C24] tracking-tight">
                {currentUser?.displayName || 'Sovereign Allocator'}
              </h1>
              <div className="text-xs text-[#5E6978] flex items-center gap-2 mt-0.5">
                <span className="font-mono text-[#D4683B] font-semibold">{passport.passportId}</span>
                <span>·</span>
                <span>{passport.tier.split('—')[1]?.trim() || passport.tier}</span>
              </div>
            </div>
          </div>

          <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2">
            {isVerified ? (
              <button
                type="button"
                onClick={onOpenVerifier}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF6EE] text-[#1B7A4F] text-xs font-semibold cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Verified Onchain</span>
              </button>
            ) : (
              <span className="text-xs text-[#5E6978] bg-white border border-[#E8E4DD] px-3 py-1 rounded-full font-medium">
                {isScanned ? 'Read-Only Scanned' : 'Pending Verification'}
              </span>
            )}
            <div className="text-[11px] text-[#8C97A5]">
              Valid thru {new Date(passport.expiresAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Identity Body Metrics */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* Summary Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pb-6 border-b border-[#E8E4DD]/60">
            <div>
              <div className="text-xs text-[#8C97A5]">Attested Valuation</div>
              <div className="text-2xl font-bold text-[#161C24] mt-1">
                {isMasked
                  ? '$••••••••'
                  : `$${portfolio.totalValueUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              </div>
            </div>
            <div>
              <div className="text-xs text-[#8C97A5]">Verified Assets</div>
              <div className="text-2xl font-bold text-[#161C24] mt-1">
                {sanitized.verifiedHoldings.length}
              </div>
            </div>
            <div>
              <div className="text-xs text-[#8C97A5]">Custodial Issuers</div>
              <div className="text-2xl font-bold text-[#161C24] mt-1">
                {portfolio.uniqueIssuersCount}
              </div>
            </div>
          </div>

          {/* Verified Positions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-[#161C24] uppercase tracking-wider">
                Verified Positions
              </h2>
              <span className="text-xs text-[#8C97A5]">Backed 1:1 on Solana</span>
            </div>

            <div className="divide-y divide-[#E8E4DD]/60 border border-[#E8E4DD] rounded-xl overflow-hidden">
              {sanitized.verifiedHoldings.map((h) => (
                <div key={h.mint} className="p-3.5 bg-white flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded bg-[#FAF8F5] border border-[#E8E4DD] flex items-center justify-center font-mono font-bold text-[11px] text-[#D4683B]">
                      {h.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-semibold text-[#161C24] flex items-center gap-1.5">
                        <span>{h.underlyingSecurity || h.symbol}</span>
                        <span className="text-[10px] text-[#1B7A4F] bg-[#EAF6EE] px-1.5 py-0.2 rounded font-medium">
                          Attested
                        </span>
                      </div>
                      <div className="text-[11px] text-[#5E6978]">{h.symbol} · {h.issuer}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-medium text-[#161C24]">
                      {h.isMasked ? '••••••' : h.valueUsd !== null ? `$${h.valueUsd.toLocaleString()}` : '—'}
                    </div>
                    <div className="text-[10px] text-[#8C97A5]">
                      {h.isMasked ? '••• shares' : `${h.amountFormatted} shares`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Milestones & Relevant History */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-[#161C24] uppercase tracking-wider">
              Identity Milestones
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#E8E4DD] space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#161C24]">
                  <Award className="w-3.5 h-3.5 text-[#D4683B]" />
                  <span>Institutional Tier</span>
                </div>
                <p className="text-[11px] text-[#5E6978]">Meets Tier III diversified portfolio threshold.</p>
              </div>

              <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#E8E4DD] space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#161C24]">
                  <Building2 className="w-3.5 h-3.5 text-[#D4683B]" />
                  <span>Multi-Issuer</span>
                </div>
                <p className="text-[11px] text-[#5E6978]">Allocations across Backed, Ondo & Dinari.</p>
              </div>

              <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#E8E4DD] space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#161C24]">
                  <Clock className="w-3.5 h-3.5 text-[#D4683B]" />
                  <span>Proven Tenure</span>
                </div>
                <p className="text-[11px] text-[#5E6978]">Consecutive onchain equity holding &gt; 90 days.</p>
              </div>
            </div>
          </div>

          {/* Wallet Relationship */}
          <div className="pt-2 border-t border-[#E8E4DD]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-[#5E6978]">
              <WalletIcon className="w-3.5 h-3.5 text-[#8C97A5]" />
              <span>Primary Wallet:</span>
              <span className="font-mono text-[#161C24] font-medium">
                {sanitized.walletAddress}
              </span>
            </div>
            {onOpenWallets && (
              <button
                type="button"
                onClick={onOpenWallets}
                className="text-xs text-[#D4683B] hover:text-[#BE582E] font-medium cursor-pointer"
              >
                Manage wallets
              </button>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#FAF8F5] border-t border-[#E8E4DD] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyId}
              className="h-8 px-3 bg-white hover:bg-[#F5F2EC] border border-[#E8E4DD] rounded-lg text-[#161C24] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedId ? <Check className="w-3.5 h-3.5 text-[#1B7A4F]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId ? 'Copied' : 'Copy ID'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportProof}
              className="h-8 px-3 bg-white hover:bg-[#F5F2EC] border border-[#E8E4DD] rounded-lg text-[#161C24] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {exported ? <Check className="w-3.5 h-3.5 text-[#1B7A4F]" /> : <Download className="w-3.5 h-3.5" />}
              <span>{exported ? 'Exported' : 'Export Proof'}</span>
            </button>
          </div>

          {onOpenPrivacy && (
            <button
              type="button"
              onClick={onOpenPrivacy}
              className="h-8 px-3 text-[#5E6978] hover:text-[#161C24] flex items-center gap-1.5 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Privacy</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
