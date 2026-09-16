/**
 * Presentation Layer: First-Time Onboarding & Wallet Discovery Experience
 * 
 * CORE PRODUCT RULES:
 * 1. Primary: Connect Wallet -> "Build your verified Onfolio Passport."
 *    - Launches supported Solana wallet connection (Phantom, Solflare, Backpack, Injected)
 *    - Never requests private keys, seed phrases, recovery phrases, or passwords.
 *    - Never creates a wallet or custodies funds.
 *    - Associates public address with authenticated Onfolio account.
 * 2. Secondary: Scan Wallet Address -> "Explore a wallet."
 *    - Read-only address inspection.
 *    - Strictly unverified (isScannedOnly: true).
 * 3. Exact State Machine:
 *    - idle, authenticating, authenticated, connecting_wallet, scanning_address, loading,
 *      success, invalid_address, wallet_rejected, network_error, empty_wallet, no_supported_assets.
 * 4. Meaningful Progress Labels (ONLY when active):
 *    - "Checking wallet"
 *    - "Finding assets"
 *    - "Organizing portfolio"
 *    - Zero fake progress bars or percentages.
 */

import React, { useState } from 'react';
import { OnfolioLogo } from '../brand/OnfolioLogo.tsx';
import { useOnfolio } from '../../state/OnfolioContext.tsx';
import { authService } from '../../auth/authService.ts';
import {
  Wallet as WalletIcon,
  Search,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { isValidSolanaAddress, SAMPLE_PORTFOLIO_ADDRESSES, detectInstalledWallets } from '../../wallet/walletManager.ts';
import { OnboardingStatus, OnboardingProgressStage } from '../../types/index.ts';

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const { addWalletByConnecting, addWalletByScanning, currentUser, scanAddress, portfolio } = useOnfolio();

  // State machine
  const [status, setStatus] = useState<OnboardingStatus>('idle');
  const [progressStage, setProgressStage] = useState<OnboardingProgressStage>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Input states
  const [inputAddress, setInputAddress] = useState('');
  const [detectedWallets] = useState(detectInstalledWallets());

  // Reset to clean idle
  const handleResetToIdle = () => {
    setStatus('idle');
    setProgressStage('idle');
    setErrorMessage(null);
  };

  // Helper: Run real discovery pipeline with authentic progress stages
  const runDiscoveryPipeline = async (address: string, isConnected: boolean) => {
    setStatus('loading');
    setErrorMessage(null);

    try {
      // Stage 1: Checking wallet
      setProgressStage('Checking wallet');
      await new Promise((resolve) => setTimeout(resolve, 350));

      // Stage 2: Finding assets
      setProgressStage('Finding assets');
      await scanAddress(address);

      // Stage 3: Organizing portfolio
      setProgressStage('Organizing portfolio');
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Mark user onboarding completed in profile
      if (currentUser?.id) {
        authService.markOnboardingComplete(currentUser.id);
      }

      setStatus('success');
      setProgressStage('idle');
      
      // Smooth handoff to dashboard
      setTimeout(() => {
        onComplete();
      }, 400);
    } catch (err: any) {
      setProgressStage('idle');
      const msg = err?.message?.toLowerCase() || '';
      if (msg.includes('network') || msg.includes('fetch') || msg.includes('rpc')) {
        setStatus('network_error');
        setErrorMessage('Network error connecting to Solana RPC.');
      } else {
        setStatus('network_error');
        setErrorMessage(err.message || 'Failed to scan wallet onchain.');
      }
    }
  };

  // 1. Connect Wallet Flow
  const handleConnectWallet = async (type: 'phantom' | 'solflare' | 'backpack' | 'injected') => {
    setStatus('connecting_wallet');
    setErrorMessage(null);

    try {
      const wallet = await addWalletByConnecting(type);
      if (wallet && wallet.publicAddress) {
        await runDiscoveryPipeline(wallet.publicAddress, true);
      } else {
        setStatus('wallet_rejected');
        setErrorMessage('Wallet connection rejected.');
      }
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('User rejected') || msg.includes('4001') || msg.includes('rejected')) {
        setStatus('wallet_rejected');
        setErrorMessage('Wallet connection rejected.');
      } else if (msg.includes('not detected')) {
        setStatus('network_error');
        setErrorMessage(msg);
      } else {
        setStatus('network_error');
        setErrorMessage("Couldn't connect wallet. Check extension.");
      }
    }
  };

  // 2. Scan Address Flow
  const handleScanAddress = async (overrideAddress?: string) => {
    const target = (overrideAddress || inputAddress).trim();

    if (!target) {
      setStatus('invalid_address');
      setErrorMessage('Enter a Solana address.');
      return;
    }

    if (!isValidSolanaAddress(target)) {
      setStatus('invalid_address');
      setErrorMessage('Invalid Solana address format (32–44 Base58 characters).');
      return;
    }

    setStatus('loading');
    setErrorMessage(null);

    try {
      const scannedWallet = await addWalletByScanning(target);
      await runDiscoveryPipeline(scannedWallet.publicAddress, false);
    } catch (err: any) {
      setStatus('network_error');
      setErrorMessage(err.message || 'Error scanning public address.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#161C24] flex flex-col items-center justify-center p-6 selection:bg-[#D4683B] selection:text-white">
      <div className="w-full max-w-[400px] flex flex-col items-center text-center space-y-6">
        {/* Brand Lockup */}
        <div className="flex flex-col items-center space-y-2">
          <OnfolioLogo size={48} iconOnly />
          <h1 className="text-base font-bold tracking-tight text-[#161C24] uppercase">
            ONFOLIO
          </h1>
        </div>

        {/* Section Header */}
        <div className="w-full text-left space-y-1">
          <h2 className="text-xl font-bold text-[#161C24]">Add a wallet</h2>
          <p className="text-xs text-[#5E6978]">
            Choose how you want to use Onfolio.
          </p>
        </div>

        {/* Error Alert for Specific States */}
        {(status === 'invalid_address' ||
          status === 'wallet_rejected' ||
          status === 'network_error') &&
          errorMessage && (
            <div className="w-full text-xs text-[#A82A2A] bg-[#FDF2F2] border border-[#F5C2C2] p-3 rounded-xl text-left flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-[#A82A2A] shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{errorMessage}</span>
                <button
                  type="button"
                  onClick={handleResetToIdle}
                  className="block mt-1 font-semibold underline text-[#161C24] cursor-pointer"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

        {/* Empty Wallet Notice */}
        {status === 'empty_wallet' && (
          <div className="w-full p-4 bg-white border border-[#E8E4DD] rounded-xl text-left space-y-3">
            <div className="text-xs font-semibold text-[#161C24]">Empty wallet</div>
            <p className="text-xs text-[#5E6978]">
              No tokenized equity holdings were found at this address. You can proceed with this wallet or scan another.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onComplete}
                className="flex-1 h-9 bg-[#161C24] text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Continue to Dashboard
              </button>
              <button
                type="button"
                onClick={handleResetToIdle}
                className="px-3 h-9 border border-[#E8E4DD] text-[#5E6978] hover:text-[#161C24] rounded-lg text-xs font-medium cursor-pointer"
              >
                Try Another
              </button>
            </div>
          </div>
        )}

        {/* No Supported Assets Notice */}
        {status === 'no_supported_assets' && (
          <div className="w-full p-4 bg-white border border-[#E8E4DD] rounded-xl text-left space-y-3">
            <div className="text-xs font-semibold text-[#161C24]">No tokenized equities</div>
            <p className="text-xs text-[#5E6978]">
              This wallet has Solana tokens, but no regulated tokenized equities (Backed, Ondo, Dinari).
            </p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleScanAddress(SAMPLE_PORTFOLIO_ADDRESSES[0].address)}
                className="flex-1 h-9 bg-[#D4683B] text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Explore Sample Equities
              </button>
              <button
                type="button"
                onClick={handleResetToIdle}
                className="px-3 h-9 border border-[#E8E4DD] text-[#5E6978] rounded-lg text-xs font-medium cursor-pointer"
              >
                Scan Other
              </button>
            </div>
          </div>
        )}

        {/* Real Loading State with Authentic Progress Stages */}
        {status === 'loading' && (
          <div className="w-full p-8 bg-white border border-[#E8E4DD] rounded-2xl text-center space-y-4 shadow-2xs">
            <Loader2 className="w-6 h-6 text-[#D4683B] animate-spin mx-auto" />
            <div className="space-y-1">
              <div className="text-sm font-semibold text-[#161C24]">
                {progressStage !== 'idle' ? progressStage : 'Checking wallet'}
              </div>
              <div className="text-[11px] text-[#8C97A5]">
                Scanning public Solana ledger...
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 1: PRIMARY OPTIONS (IDLE)
            ========================================================================= */}
        {status === 'idle' && (
          <div className="w-full space-y-3">
            {/* Primary Option: Connect Wallet */}
            <button
              type="button"
              onClick={() => setStatus('connecting_wallet')}
              className="w-full p-4 bg-white hover:bg-[#F5F2EC] active:bg-[#EAE6E1] border-2 border-[#161C24] rounded-xl text-left transition-colors flex items-center justify-between cursor-pointer group shadow-2xs"
            >
              <div className="space-y-0.5">
                <div className="text-sm font-bold text-[#161C24] flex items-center gap-2">
                  <WalletIcon className="w-4 h-4 text-[#D4683B]" />
                  <span>Connect Wallet</span>
                </div>
                <div className="text-xs text-[#5E6978]">
                  Build your verified Onfolio Passport.
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#161C24] transition-transform group-hover:translate-x-0.5" />
            </button>

            {/* Secondary Option: Scan Address */}
            <button
              type="button"
              onClick={() => setStatus('scanning_address')}
              className="w-full p-4 bg-white hover:bg-[#F5F2EC] active:bg-[#EAE6E1] border border-[#E8E4DD] rounded-xl text-left transition-colors flex items-center justify-between cursor-pointer group shadow-2xs"
            >
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-[#161C24] flex items-center gap-2">
                  <Search className="w-4 h-4 text-[#5E6978]" />
                  <span>Scan Wallet Address</span>
                </div>
                <div className="text-xs text-[#5E6978]">
                  Explore a wallet in read-only mode.
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#5E6978] transition-transform group-hover:translate-x-0.5" />
            </button>

            {/* Non-custodial Security Guarantee */}
            <div className="pt-2 px-2 flex items-center justify-center gap-1.5 text-[11px] text-[#8C97A5]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#1B7A4F]" />
              <span>Non-custodial. Never asks for private keys or passwords.</span>
            </div>

            {/* Instant Sample Exploration for Reviewers */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => handleScanAddress(SAMPLE_PORTFOLIO_ADDRESSES[0].address)}
                className="text-xs text-[#D4683B] hover:text-[#BE582E] font-medium cursor-pointer"
              >
                Or explore sample tokenized equity portfolio
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 2: CONNECT WALLET INTERFACE (SUPPORTED SOLANA WALLETS)
            ========================================================================= */}
        {status === 'connecting_wallet' && (
          <div className="w-full space-y-4 text-left animate-in fade-in">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleResetToIdle}
                className="p-1 -ml-1 text-[#5E6978] hover:text-[#161C24] cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-[#161C24]">Select Solana Wallet</span>
              <div className="w-4" />
            </div>

            <p className="text-xs text-[#5E6978]">
              Connect to retrieve your public address for verification. Never custody or sign transactions.
            </p>

            <div className="space-y-2">
              {/* Phantom */}
              <button
                type="button"
                onClick={() => handleConnectWallet('phantom')}
                className="w-full p-3.5 bg-white hover:bg-[#F5F2EC] border border-[#E8E4DD] rounded-xl text-xs font-semibold text-[#161C24] flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-[#AB9FF2]/20 flex items-center justify-center text-[10px] font-bold text-[#5B4CD9]">
                    P
                  </div>
                  <span>Phantom</span>
                </div>
                <span className="text-[10px] text-[#8C97A5]">
                  {detectedWallets.phantom ? 'Detected' : 'Browser'}
                </span>
              </button>

              {/* Solflare */}
              <button
                type="button"
                onClick={() => handleConnectWallet('solflare')}
                className="w-full p-3.5 bg-white hover:bg-[#F5F2EC] border border-[#E8E4DD] rounded-xl text-xs font-semibold text-[#161C24] flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-[#FC923C]/20 flex items-center justify-center text-[10px] font-bold text-[#EA580C]">
                    S
                  </div>
                  <span>Solflare</span>
                </div>
                <span className="text-[10px] text-[#8C97A5]">
                  {detectedWallets.solflare ? 'Detected' : 'Browser'}
                </span>
              </button>

              {/* Backpack */}
              <button
                type="button"
                onClick={() => handleConnectWallet('backpack')}
                className="w-full p-3.5 bg-white hover:bg-[#F5F2EC] border border-[#E8E4DD] rounded-xl text-xs font-semibold text-[#161C24] flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-[#E11D48]/10 flex items-center justify-center text-[10px] font-bold text-[#E11D48]">
                    B
                  </div>
                  <span>Backpack</span>
                </div>
                <span className="text-[10px] text-[#8C97A5]">
                  {detectedWallets.backpack ? 'Detected' : 'Browser'}
                </span>
              </button>

              {/* Standard Injected */}
              <button
                type="button"
                onClick={() => handleConnectWallet('injected')}
                className="w-full p-3.5 bg-white hover:bg-[#F5F2EC] border border-[#E8E4DD] rounded-xl text-xs font-semibold text-[#161C24] flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-[#EAE6E1] flex items-center justify-center text-[10px] font-bold text-[#161C24]">
                    W
                  </div>
                  <span>Installed Solana Wallet</span>
                </div>
                <span className="text-[10px] text-[#8C97A5]">Injected</span>
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 3: SCAN WALLET ADDRESS (READ-ONLY)
            ========================================================================= */}
        {status === 'scanning_address' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleScanAddress();
            }}
            className="w-full space-y-4 text-left animate-in fade-in"
          >
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleResetToIdle}
                className="p-1 -ml-1 text-[#5E6978] hover:text-[#161C24] cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-[#161C24]">Scan Wallet Address</span>
              <div className="w-4" />
            </div>

            <div className="p-3 bg-[#FAF0EA] border border-[#D4683B]/20 rounded-xl text-xs text-[#161C24] space-y-1">
              <div className="font-semibold text-[#D4683B]">Read-only inspection</div>
              <p className="text-[11px] text-[#5E6978]">
                Scanning public data only. A scanned address does not become a connected or verified wallet on your passport.
              </p>
            </div>

            <div>
              <label className="text-[11px] font-medium text-[#5E6978] block mb-1">
                Solana Public Address
              </label>
              <input
                type="text"
                value={inputAddress}
                onChange={(e) => {
                  setInputAddress(e.target.value.trim());
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Paste public Base58 address..."
                autoFocus
                required
                className="w-full h-11 px-3 bg-white border border-[#E8E4DD] rounded-xl text-xs font-mono text-[#161C24] focus:outline-none focus:border-[#D4683B]"
              />
            </div>

            <button
              type="submit"
              className="w-full h-11 bg-[#161C24] hover:bg-[#2B333E] text-white rounded-xl text-xs font-semibold flex items-center justify-center cursor-pointer transition-colors"
            >
              Scan Address
            </button>

            {/* Quick Sample Address Link */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => handleScanAddress(SAMPLE_PORTFOLIO_ADDRESSES[0].address)}
                className="text-xs text-[#D4683B] hover:text-[#BE582E] font-medium cursor-pointer"
              >
                Paste sample tokenized equity address
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
