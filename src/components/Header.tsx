/**
 * Presentation Layer: Header
 * Displays identity, security guarantee, network status, and wallet connection state.
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  Wallet as WalletIcon,
  CheckCircle2,
  ChevronDown,
  Sliders,
  Lock,
  Layers,
} from 'lucide-react';
import { useOnfolio } from '../state/OnfolioContext.tsx';
import { formatAddressWithPrivacy } from '../privacy/privacyManager.ts';
import { Button, Badge } from './ui/index.ts';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenVerifier: () => void;
  onOpenWallets: () => void;
  onOpenPrivacy: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  onOpenVerifier,
  onOpenWallets,
  onOpenPrivacy,
}) => {
  const {
    walletState,
    connectWallet,
    disconnectWallet,
    preferences,
    clusterSlot,
    portfolio,
    wallets,
    privacySettings,
  } = useOnfolio();

  const [showWalletModal, setShowWalletModal] = useState(false);
  const isDevAdapter = portfolio?.dataSource === 'dev_adapter';

  return (
    <header className="border-b border-neutral-200 bg-white" id="onfolio-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Brand & Thesis */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold text-lg tracking-wider shadow-2xs">
            ON
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-neutral-900 tracking-tight">Onfolio</h1>
              <Badge variant="outline" size="sm">
                Solana RWA Passport
              </Badge>
            </div>
            <p className="text-xs text-neutral-500 hidden sm:block">
              Verifiable onchain investment passport for tokenized equities
            </p>
          </div>
        </div>

        {/* Security Assurance, Network & Wallet Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Security Guarantee Badge */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium"
            title="Read-only query of public blockchain data. Never asks for private keys or transaction signatures."
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Read-Only · Zero Custody</span>
          </div>

          {/* Provider Mode Indicator */}
          <button
            onClick={onOpenSettings}
            id="provider-status-badge"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-colors ${
              isDevAdapter
                ? 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                : 'bg-neutral-50 text-neutral-800 border-neutral-200 hover:bg-neutral-100'
            }`}
            title="Configure Solana RPC / Provider settings"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isDevAdapter ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            />
            <span>{isDevAdapter ? 'Dev Sandbox' : 'Solana Mainnet'}</span>
            <span className="text-neutral-500">#{clusterSlot.toLocaleString()}</span>
            <Sliders className="w-3 h-3 text-neutral-500 ml-1" />
          </button>

          {/* Wallets Manager Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenWallets}
            leftIcon={<WalletIcon className="w-3.5 h-3.5" />}
          >
            Wallets ({wallets.length})
          </Button>

          {/* Privacy & Selective Disclosure Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenPrivacy}
            leftIcon={<Lock className="w-3.5 h-3.5" />}
          >
            Privacy
          </Button>

          {/* Independent Verifier Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenVerifier}
            id="open-verifier-btn"
          >
            Verify Passport
          </Button>

          {/* Primary Connect / Status Button */}
          {walletState.isConnected ? (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-neutral-900 text-white rounded-md text-xs font-mono">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>{formatAddressWithPrivacy(walletState.address, preferences.privacyMode)}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={disconnectWallet}
                id="disconnect-wallet-btn"
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="relative">
              <Button
                size="sm"
                onClick={() => setShowWalletModal(!showWalletModal)}
                id="connect-wallet-btn"
                leftIcon={<WalletIcon className="w-3.5 h-3.5" />}
                rightIcon={<ChevronDown className="w-3 h-3 opacity-70" />}
              >
                Connect Wallet
              </Button>

              {/* Wallet Dropdown Modal */}
              {showWalletModal && (
                <div
                  className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-neutral-200 p-3.5 z-50 text-left animate-in fade-in zoom-in-95 duration-100"
                  id="wallet-connect-dropdown"
                >
                  <div className="text-xs font-bold text-neutral-900 mb-1">
                    Connect Solana Wallet
                  </div>
                  <p className="text-[11px] text-neutral-500 mb-3 leading-relaxed">
                    Provides your public address automatically. Onfolio never requests seed phrases, private keys, or fund approvals.
                  </p>

                  <div className="space-y-1.5">
                    <button
                      onClick={() => {
                        connectWallet('phantom');
                        setShowWalletModal(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-neutral-100 flex items-center justify-between text-xs font-medium text-neutral-800"
                    >
                      <span>Phantom</span>
                      {walletState.detectedWallets.phantom ? (
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">Detected</span>
                      ) : (
                        <span className="text-[10px] text-neutral-400">Extension</span>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        connectWallet('solflare');
                        setShowWalletModal(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-neutral-100 flex items-center justify-between text-xs font-medium text-neutral-800"
                    >
                      <span>Solflare</span>
                      {walletState.detectedWallets.solflare ? (
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">Detected</span>
                      ) : (
                        <span className="text-[10px] text-neutral-400">Extension</span>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        connectWallet('backpack');
                        setShowWalletModal(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-neutral-100 flex items-center justify-between text-xs font-medium text-neutral-800"
                    >
                      <span>Backpack</span>
                      {walletState.detectedWallets.backpack ? (
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">Detected</span>
                      ) : (
                        <span className="text-[10px] text-neutral-400">Extension</span>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        connectWallet('injected');
                        setShowWalletModal(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-neutral-100 flex items-center justify-between text-xs font-medium text-neutral-800"
                    >
                      <span>Standard Solana (Window)</span>
                      <span className="text-[10px] text-neutral-400">Generic</span>
                    </button>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-neutral-100 text-[10px] text-neutral-500 text-center">
                    Prefer not to connect? You can paste any address to scan it read-only.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
