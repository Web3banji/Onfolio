/**
 * Presentation Layer: Multi-Wallet Management Modal
 * 
 * CORE RULES:
 * - Strict distinction between SCANNED WALLET and CONNECTED WALLET.
 * - Scanned wallet: read-only, never gets verified badge, never requires connection.
 * - Connected wallet: may undergo signature ownership verification challenge.
 * - Multi-wallet support allows associating multiple verified wallets with one Onfolio identity.
 */

import React, { useState } from 'react';
import { useOnfolio } from '../state/OnfolioContext.tsx';
import { Modal, Button, Input, Badge, WalletRow } from './ui/index.ts';
import { Plus, ShieldCheck, Eye, Wallet as WalletIcon, Check, AlertCircle } from 'lucide-react';
import { isValidSolanaAddress } from '../wallet/walletManager.ts';

export interface ManageWalletsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManageWalletsModal: React.FC<ManageWalletsModalProps> = ({ isOpen, onClose }) => {
  const {
    wallets,
    activeWallet,
    selectActiveWallet,
    addWalletByScanning,
    addWalletByConnecting,
    verifyWalletOwnership,
    removeWallet,
    currentUser,
  } = useOnfolio();

  const [activeTab, setActiveTab] = useState<'list' | 'add_scan' | 'add_connect'>('list');
  const [inputAddress, setInputAddress] = useState('');
  const [inputLabel, setInputLabel] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [verificationFeedback, setVerificationFeedback] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleAddScanned = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const cleanAddress = inputAddress.trim();

    if (!cleanAddress) {
      setFormError('Please enter a public address.');
      return;
    }

    if (!isValidSolanaAddress(cleanAddress)) {
      setFormError('Invalid Solana address. Must be 32–44 Base58 characters.');
      return;
    }

    try {
      await addWalletByScanning(cleanAddress, inputLabel.trim() || undefined);
      setInputAddress('');
      setInputLabel('');
      setActiveTab('list');
    } catch (err: any) {
      setFormError(err.message || 'Failed to add scanned address.');
    }
  };

  const handleConnectWallet = async (type: 'phantom' | 'solflare' | 'backpack' | 'injected') => {
    setFormError(null);
    try {
      const w = await addWalletByConnecting(type);
      if (w) {
        setActiveTab('list');
      }
    } catch (err: any) {
      setFormError(err.message || 'Connection failed.');
    }
  };

  const handleVerify = async (walletId: string) => {
    setIsVerifying(true);
    setVerificationFeedback(null);
    const res = await verifyWalletOwnership(walletId);
    setIsVerifying(false);

    if (res.success) {
      setVerificationFeedback('Cryptographic challenge verified! Wallet marked as Verified Onchain.');
    } else {
      setVerificationFeedback(res.error || 'Challenge verification failed.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <WalletIcon className="w-4 h-4 text-neutral-900" />
          <span>Wallet Identity Management</span>
        </div>
      }
      description="Manage connected and scanned Solana addresses associated with your Onfolio Passport."
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-[11px] text-neutral-600">
            {wallets.length} wallet(s) registered
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Tab selector */}
        <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'list'
                ? 'bg-white text-neutral-900 shadow-2xs'
                : 'text-neutral-700 hover:text-neutral-900'
            }`}
          >
            Registered Wallets ({wallets.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('add_scan')}
            className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'add_scan'
                ? 'bg-white text-neutral-900 shadow-2xs'
                : 'text-neutral-700 hover:text-neutral-900'
            }`}
          >
            + Scan Address
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('add_connect')}
            className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'add_connect'
                ? 'bg-white text-neutral-900 shadow-2xs'
                : 'text-neutral-700 hover:text-neutral-900'
            }`}
          >
            + Connect Wallet
          </button>
        </div>

        {verificationFeedback && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{verificationFeedback}</span>
          </div>
        )}

        {/* Tab 1: Wallets List */}
        {activeTab === 'list' && (
          <div className="space-y-3">
            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-[11px] text-neutral-700 leading-relaxed">
              <strong className="text-neutral-900">Security Rule:</strong> Scanned wallets are read-only and will never show a verified badge. Only connected wallets that complete a zero-gas message signature challenge receive verified status.
            </div>

            {wallets.length === 0 ? (
              <div className="text-center py-6 text-neutral-600 text-xs">
                No wallets added yet. Paste an address or connect your wallet.
              </div>
            ) : (
              <div className="space-y-2">
                {wallets.map((w) => (
                  <WalletRow
                    key={w.id}
                    wallet={w}
                    isActive={activeWallet?.id === w.id}
                    onSelect={(selected) => selectActiveWallet(selected)}
                    onVerify={(target) => handleVerify(target.id)}
                    onRemove={(target) => removeWallet(target.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Add by Scanning */}
        {activeTab === 'add_scan' && (
          <form onSubmit={handleAddScanned} className="space-y-3">
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-900">
              <strong>Scan Without Connecting:</strong> You can monitor and inspect any public address on Solana without connecting or approving permissions.
            </div>

            <Input
              label="Solana Public Address"
              placeholder="e.g. 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
              value={inputAddress}
              onChange={(e) => setInputAddress(e.target.value)}
              error={formError || undefined}
            />

            <Input
              label="Wallet Label (Optional)"
              placeholder="e.g. Cold Storage / Treasury"
              value={inputLabel}
              onChange={(e) => setInputLabel(e.target.value)}
            />

            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setActiveTab('list')}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Add & Scan Address
              </Button>
            </div>
          </form>
        )}

        {/* Tab 3: Add by Connecting */}
        {activeTab === 'add_connect' && (
          <div className="space-y-3">
            <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-700">
              Connecting allows you to prove wallet ownership with a zero-cost cryptographic signature challenge to unlock full verified status on your Passport.
            </div>

            {formError && (
              <div className="p-2.5 rounded bg-red-50 border border-red-200 text-xs text-red-700">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleConnectWallet('phantom')}
                className="p-3 rounded-lg border border-neutral-200 hover:border-neutral-400 bg-white text-left text-xs font-semibold flex items-center justify-between"
              >
                <span>Phantom</span>
                <span className="text-[10px] text-neutral-500">Browser Extension</span>
              </button>
              <button
                type="button"
                onClick={() => handleConnectWallet('solflare')}
                className="p-3 rounded-lg border border-neutral-200 hover:border-neutral-400 bg-white text-left text-xs font-semibold flex items-center justify-between"
              >
                <span>Solflare</span>
                <span className="text-[10px] text-neutral-500">Browser Extension</span>
              </button>
              <button
                type="button"
                onClick={() => handleConnectWallet('backpack')}
                className="p-3 rounded-lg border border-neutral-200 hover:border-neutral-400 bg-white text-left text-xs font-semibold flex items-center justify-between"
              >
                <span>Backpack</span>
                <span className="text-[10px] text-neutral-500">Browser Extension</span>
              </button>
              <button
                type="button"
                onClick={() => handleConnectWallet('injected')}
                className="p-3 rounded-lg border border-neutral-200 hover:border-neutral-400 bg-white text-left text-xs font-semibold flex items-center justify-between"
              >
                <span>Standard Window Provider</span>
                <span className="text-[10px] text-neutral-500">Generic</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
