/**
 * Presentation Layer: Address Scanner & Manual Lookup
 * 
 * Allows users to paste any Solana address or select sample onchain portfolios.
 * Wallet connection is strictly optional.
 */

import React, { useState } from 'react';
import { Search, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { useOnfolio } from '../state/OnfolioContext.tsx';
import { SAMPLE_PORTFOLIO_ADDRESSES } from '../wallet/walletManager.ts';

export const AddressScanner: React.FC = () => {
  const {
    activeAddress,
    isScanning,
    scanError,
    scanAddress,
    loadSampleProfile,
  } = useOnfolio();

  const [inputAddress, setInputAddress] = useState(activeAddress || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputAddress.trim()) {
      scanAddress(inputAddress.trim());
    }
  };

  return (
    <div className="bg-white border-b border-neutral-200 py-4 px-4 sm:px-6 lg:px-8" id="address-scanner-section">
      <div className="max-w-7xl mx-auto space-y-3">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-600">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              id="solana-address-input"
              value={inputAddress}
              onChange={(e) => setInputAddress(e.target.value)}
              placeholder="Paste public Solana wallet address (e.g. 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU)..."
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs sm:text-sm font-mono text-neutral-900 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white transition-all"
              spellCheck={false}
            />
          </div>

          <button
            type="submit"
            id="scan-address-btn"
            disabled={isScanning || !inputAddress.trim()}
            className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-300 text-white rounded-lg text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Scanning Ledger...</span>
              </>
            ) : (
              <span>Scan & Generate Passport</span>
            )}
          </button>
        </form>

        {/* Error Notice */}
        {scanError && (
          <div
            id="scan-error-message"
            className="flex items-center gap-2 p-2.5 rounded-md bg-rose-50 border border-rose-200 text-xs text-rose-800"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{scanError}</span>
          </div>
        )}

        {/* Quick Sample Profiles for Instant Exploration */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-neutral-700 flex items-center gap-1 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-neutral-600" /> Sample Portfolios:
          </span>
          {SAMPLE_PORTFOLIO_ADDRESSES.map((profile) => {
            const isSelected = activeAddress === profile.address;
            return (
              <button
                key={profile.address}
                type="button"
                onClick={() => {
                  setInputAddress(profile.address);
                  loadSampleProfile(profile.address);
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                  isSelected
                    ? 'bg-neutral-900 text-white border-neutral-900'
                    : 'bg-neutral-100 text-neutral-700 border-neutral-200 hover:bg-neutral-200'
                }`}
                title={`${profile.description} (${profile.tierPreview})`}
              >
                <span>{profile.label}</span>
                <span className="ml-1.5 opacity-60 text-[10px]">({profile.tierPreview.split('—')[0].trim()})</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
