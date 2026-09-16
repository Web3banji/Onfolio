/**
 * Presentation Layer: Privacy & Selective Disclosure Settings
 * 
 * CORE RULES:
 * Minimal text, clear toggles, professional fintech aesthetic.
 */

import React, { useState } from 'react';
import { useOnfolio } from '../state/OnfolioContext.tsx';
import { X, EyeOff, Shield, Copy, Check } from 'lucide-react';
import { privacyService } from '../privacy/privacyService.ts';

export interface PrivacySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacySettingsModal: React.FC<PrivacySettingsModalProps> = ({ isOpen, onClose }) => {
  const { passport, privacySettings, updatePrivacySettings } = useOnfolio();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleExportShareableProof = () => {
    if (!passport) return;
    const proof = privacyService.exportShareableProof(passport, privacySettings);
    navigator.clipboard.writeText(JSON.stringify(proof, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-2xl border border-[#E8E4DD] max-w-md w-full p-6 space-y-5 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#161C24]">Privacy</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8C97A5] hover:text-[#161C24] p-1 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Toggle: Hide Balances */}
          <label className="flex items-center justify-between p-3.5 rounded-xl border border-[#E8E4DD] hover:bg-[#FAF8F5] transition-colors cursor-pointer">
            <div>
              <div className="text-xs font-semibold text-[#161C24]">Hide Dollar Values</div>
              <div className="text-[11px] text-[#5E6978]">Displays values as $••••••</div>
            </div>
            <input
              type="checkbox"
              checked={privacySettings.hideAbsoluteBalances}
              onChange={(e) => updatePrivacySettings({ hideAbsoluteBalances: e.target.checked })}
              className="h-4 w-4 rounded accent-[#D4683B] cursor-pointer"
            />
          </label>

          {/* Toggle: Hide Addresses */}
          <label className="flex items-center justify-between p-3.5 rounded-xl border border-[#E8E4DD] hover:bg-[#FAF8F5] transition-colors cursor-pointer">
            <div>
              <div className="text-xs font-semibold text-[#161C24]">Mask Wallet Addresses</div>
              <div className="text-[11px] text-[#5E6978]">Obfuscates public key characters</div>
            </div>
            <input
              type="checkbox"
              checked={privacySettings.hideWalletAddresses}
              onChange={(e) => updatePrivacySettings({ hideWalletAddresses: e.target.checked })}
              className="h-4 w-4 rounded accent-[#D4683B] cursor-pointer"
            />
          </label>

          {/* Toggle: Percentage-Only */}
          <label className="flex items-center justify-between p-3.5 rounded-xl border border-[#E8E4DD] hover:bg-[#FAF8F5] transition-colors cursor-pointer">
            <div>
              <div className="text-xs font-semibold text-[#161C24]">Percentage-Only Allocation</div>
              <div className="text-[11px] text-[#5E6978]">Hides token quantity units</div>
            </div>
            <input
              type="checkbox"
              checked={privacySettings.percentageOnlyAllocation}
              onChange={(e) => updatePrivacySettings({ percentageOnlyAllocation: e.target.checked })}
              className="h-4 w-4 rounded accent-[#D4683B] cursor-pointer"
            />
          </label>
        </div>

        <div className="pt-2 flex gap-2">
          <button
            type="button"
            onClick={handleExportShareableProof}
            className="flex-1 h-10 border border-[#E8E4DD] hover:bg-[#FAF8F5] rounded-xl text-xs font-medium text-[#161C24] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#1B7A4F]" /> : <Copy className="w-3.5 h-3.5 text-[#5E6978]" />}
            <span>{copied ? 'Proof Copied' : 'Copy Proof JSON'}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-10 bg-[#161C24] hover:bg-[#2B333E] text-white rounded-xl text-xs font-medium transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
