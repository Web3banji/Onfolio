/**
 * Presentation Layer: Clean Wallet Management Modal
 * 
 * CORE RULES:
 * Users can:
 * - Add wallet
 * - View wallet
 * - Rename wallet
 * - Set primary wallet
 * - Copy address
 * - View explorer
 * - Remove wallet
 * Show whether wallet is: Connected or Scanned.
 * Do not show "Verified" for a merely scanned wallet.
 * Concise, sparse, zero fluff.
 */

import React, { useState } from 'react';
import { useOnfolio } from '../../state/OnfolioContext.tsx';
import { Wallet } from '../../types/index.ts';
import {
  X,
  Plus,
  ShieldCheck,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  Edit2,
  Star,
  Wallet as WalletIcon,
  Search,
} from 'lucide-react';
import { isValidSolanaAddress } from '../../wallet/walletManager.ts';

interface WalletsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletsModal: React.FC<WalletsModalProps> = ({ isOpen, onClose }) => {
  const {
    wallets,
    activeWallet,
    selectActiveWallet,
    addWalletByScanning,
    addWalletByConnecting,
    verifyWalletOwnership,
    removeWallet,
    renameWallet,
    setPrimaryWallet,
  } = useOnfolio();

  const [mode, setMode] = useState<'list' | 'add_scan' | 'add_connect'>('list');
  const [editingWalletId, setEditingWalletId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [scanAddressInput, setScanAddressInput] = useState('');
  const [scanLabelInput, setScanLabelInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifyingId, setIsVerifyingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (wallet: Wallet) => {
    navigator.clipboard.writeText(wallet.publicAddress);
    setCopiedId(wallet.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleStartRename = (wallet: Wallet) => {
    setEditingWalletId(wallet.id);
    setRenameValue(wallet.label || 'Wallet');
  };

  const handleSaveRename = async (walletId: string) => {
    if (renameValue.trim()) {
      await renameWallet(walletId, renameValue.trim());
    }
    setEditingWalletId(null);
  };

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = scanAddressInput.trim();
    if (!target) return;
    if (!isValidSolanaAddress(target)) {
      setError('Invalid Solana address format.');
      return;
    }
    setError(null);
    try {
      await addWalletByScanning(target, scanLabelInput.trim() || undefined);
      setScanAddressInput('');
      setScanLabelInput('');
      setMode('list');
    } catch {
      setError("Couldn't add address.");
    }
  };

  const handleConnectSubmit = async (type: 'phantom' | 'solflare' | 'backpack' | 'injected') => {
    setError(null);
    try {
      const w = await addWalletByConnecting(type);
      if (w) setMode('list');
    } catch {
      setError("Couldn't connect.");
    }
  };

  const handleVerify = async (walletId: string) => {
    setIsVerifyingId(walletId);
    setError(null);
    const res = await verifyWalletOwnership(walletId);
    setIsVerifyingId(null);
    if (!res.success) {
      setError(res.error || 'Verification failed.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-2xl border border-[#E8E4DD] max-w-lg w-full p-6 space-y-5 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#161C24]">Wallets</h2>
            <span className="text-xs text-[#8C97A5]">({wallets.length})</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8C97A5] hover:text-[#161C24] p-1 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="text-xs text-[#A82A2A] bg-[#FDF2F2] border border-[#F5C2C2] p-2.5 rounded-lg">
            {error}
          </div>
        )}

        {/* View: List */}
        {mode === 'list' && (
          <div className="space-y-4">
            <div className="divide-y divide-[#E8E4DD]/60 max-h-[380px] overflow-y-auto pr-1">
              {wallets.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#8C97A5]">No wallets registered</div>
              ) : (
                wallets.map((w) => {
                  const isCurrent = activeWallet?.id === w.id;
                  const isScanned = w.isScannedOnly;
                  const isVerified = !isScanned && w.verificationStatus === 'verified';
                  const shortAddr = `${w.publicAddress.slice(0, 4)}...${w.publicAddress.slice(-4)}`;

                  return (
                    <div
                      key={w.id}
                      className={`py-3 flex flex-col gap-2 rounded-xl px-2 transition-colors ${
                        isCurrent ? 'bg-[#FAF8F5]' : 'hover:bg-[#FAF8F5]/60'
                      }`}
                    >
                      {/* Top line: Label, status chip, set primary, delete */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          {editingWalletId === w.id ? (
                            <input
                              type="text"
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onBlur={() => handleSaveRename(w.id)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(w.id)}
                              autoFocus
                              className="px-2 py-0.5 border border-[#D4683B] rounded text-xs font-semibold text-[#161C24] focus:outline-none"
                            />
                          ) : (
                            <span
                              onClick={() => selectActiveWallet(w)}
                              className="font-semibold text-[#161C24] cursor-pointer hover:underline flex items-center gap-1.5"
                            >
                              <span>{w.label || 'Wallet'}</span>
                              {w.isPrimary && (
                                <Star className="w-3 h-3 text-[#D4683B] fill-[#D4683B]" title="Primary Wallet" />
                              )}
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleStartRename(w)}
                            className="text-[#8C97A5] hover:text-[#161C24] p-0.5 rounded cursor-pointer"
                            title="Rename"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Status badge */}
                        <div className="flex items-center gap-1.5">
                          {isVerified ? (
                            <span className="text-[10px] font-medium text-[#1B7A4F] bg-[#EAF6EE] px-2 py-0.5 rounded-full flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" />
                              <span>Verified</span>
                            </span>
                          ) : isScanned ? (
                            <span className="text-[10px] font-medium text-[#5E6978] bg-[#F5F2EC] px-2 py-0.5 rounded-full">
                              Scanned
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-[#9E6700] bg-[#FEF8E7] px-2 py-0.5 rounded-full">
                              Connected (Unverified)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bottom line: Public address and actions */}
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-[#E8E4DD]/40">
                        <div className="font-mono text-[#5E6978] text-[11px]">{shortAddr}</div>

                        <div className="flex items-center gap-2">
                          {/* Copy Address */}
                          <button
                            type="button"
                            onClick={() => handleCopy(w)}
                            className="p-1 text-[#8C97A5] hover:text-[#161C24] rounded cursor-pointer"
                            title="Copy address"
                          >
                            {copiedId === w.id ? (
                              <Check className="w-3.5 h-3.5 text-[#1B7A4F]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Explorer */}
                          <a
                            href={`https://solscan.io/account/${w.publicAddress}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 text-[#8C97A5] hover:text-[#161C24] rounded"
                            title="View on Solscan"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          {/* Verify button if connected but unverified */}
                          {!isScanned && !isVerified && (
                            <button
                              type="button"
                              onClick={() => handleVerify(w.id)}
                              disabled={isVerifyingId === w.id}
                              className="px-2 py-0.5 bg-[#161C24] hover:bg-[#2B333E] text-white rounded text-[10px] font-medium cursor-pointer"
                            >
                              {isVerifyingId === w.id ? '...' : 'Verify'}
                            </button>
                          )}

                          {/* Set Primary */}
                          {!w.isPrimary && (
                            <button
                              type="button"
                              onClick={() => setPrimaryWallet(w.id)}
                              className="text-[10px] text-[#5E6978] hover:text-[#161C24] cursor-pointer"
                            >
                              Set primary
                            </button>
                          )}

                          {/* Remove */}
                          <button
                            type="button"
                            onClick={() => removeWallet(w.id)}
                            className="p-1 text-[#8C97A5] hover:text-[#A82A2A] rounded cursor-pointer"
                            title="Remove wallet"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Actions: Add */}
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setMode('add_connect')}
                className="flex-1 h-9 bg-[#161C24] hover:bg-[#2B333E] text-white rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Connect Wallet</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('add_scan')}
                className="flex-1 h-9 border border-[#E8E4DD] hover:bg-[#FAF8F5] text-[#161C24] rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Search className="w-3.5 h-3.5 text-[#5E6978]" />
                <span>Scan Address</span>
              </button>
            </div>
          </div>
        )}

        {/* View: Add by Scan */}
        {mode === 'add_scan' && (
          <form onSubmit={handleScanSubmit} className="space-y-4">
            <h3 className="text-xs font-semibold text-[#161C24]">Scan public address</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-[#5E6978] block mb-1">Public Address</label>
                <input
                  type="text"
                  value={scanAddressInput}
                  onChange={(e) => setScanAddressInput(e.target.value)}
                  placeholder="7xKXtg...JosgAsU"
                  required
                  className="w-full h-9 px-3 bg-white border border-[#E8E4DD] rounded-lg text-xs font-mono text-[#161C24] focus:outline-none focus:border-[#D4683B]"
                />
              </div>
              <div>
                <label className="text-[11px] text-[#5E6978] block mb-1">Label (Optional)</label>
                <input
                  type="text"
                  value={scanLabelInput}
                  onChange={(e) => setScanLabelInput(e.target.value)}
                  placeholder="e.g. Cold Storage"
                  className="w-full h-9 px-3 bg-white border border-[#E8E4DD] rounded-lg text-xs text-[#161C24] focus:outline-none focus:border-[#D4683B]"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setMode('list')}
                className="px-3 py-1.5 text-xs text-[#5E6978] hover:text-[#161C24] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#161C24] hover:bg-[#2B333E] text-white rounded-lg text-xs font-medium cursor-pointer"
              >
                Scan
              </button>
            </div>
          </form>
        )}

        {/* View: Add by Connect */}
        {mode === 'add_connect' && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-[#161C24]">Select provider</h3>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleConnectSubmit('phantom')}
                className="w-full p-3 bg-white hover:bg-[#FAF8F5] border border-[#E8E4DD] rounded-lg text-xs font-medium text-[#161C24] flex items-center justify-between cursor-pointer"
              >
                <span>Phantom</span>
                <span className="text-[10px] text-[#8C97A5]">Browser</span>
              </button>
              <button
                type="button"
                onClick={() => handleConnectSubmit('solflare')}
                className="w-full p-3 bg-white hover:bg-[#FAF8F5] border border-[#E8E4DD] rounded-lg text-xs font-medium text-[#161C24] flex items-center justify-between cursor-pointer"
              >
                <span>Solflare</span>
                <span className="text-[10px] text-[#8C97A5]">Browser</span>
              </button>
              <button
                type="button"
                onClick={() => handleConnectSubmit('backpack')}
                className="w-full p-3 bg-white hover:bg-[#FAF8F5] border border-[#E8E4DD] rounded-lg text-xs font-medium text-[#161C24] flex items-center justify-between cursor-pointer"
              >
                <span>Backpack</span>
                <span className="text-[10px] text-[#8C97A5]">Browser</span>
              </button>
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setMode('list')}
                className="px-3 py-1.5 text-xs text-[#5E6978] hover:text-[#161C24] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
