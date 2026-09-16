/**
 * Presentation Layer: Security & Transparency Disclosure
 * 
 * Reassures users on Onfolio's read-only trust architecture:
 * - Public ledger scanning only
 * - Zero seed phrases / private keys
 * - Zero fund custody / zero transactions
 */

import React, { useState } from 'react';
import { ShieldCheck, Info, ChevronUp, ChevronDown } from 'lucide-react';

export const SecurityBanner: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-neutral-50 border-b border-neutral-200 text-xs text-neutral-700" id="security-thesis-banner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium text-neutral-900">
            Trust & Security Architecture:
          </span>
          <span className="text-neutral-700 hidden md:inline">
            Onfolio is a read-only attestation layer. It never asks for seed phrases, private keys, or signatures to move assets.
          </span>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-neutral-700 hover:text-neutral-900 font-medium flex items-center gap-1 shrink-0 ml-2"
        >
          <span>{isExpanded ? 'Hide Details' : 'View Security Model'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="border-t border-neutral-200 bg-white px-4 sm:px-6 lg:px-8 py-3 text-xs text-neutral-700 leading-relaxed">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="font-semibold text-neutral-900 block mb-1">1. Public Ledger Reads</span>
              Wallet addresses are public blockchain identifiers. Onfolio parses publicly queryable SPL token accounts and signatures directly from Solana RPC nodes.
            </div>
            <div>
              <span className="font-semibold text-neutral-900 block mb-1">2. Zero Key Access</span>
              We do not generate wallets, store credentials, or execute trade orders. Connecting a wallet merely provides your public key string automatically.
            </div>
            <div>
              <span className="font-semibold text-neutral-900 block mb-1">3. Verifiable Claims</span>
              Every passport claim is derived deterministically from recognized issuers (Backed Finance, Ondo, Dinari, Swarm) and verifiable onchain states.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
