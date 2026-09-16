/**
 * Presentation Layer: Provider & RPC Settings Modal
 * 
 * Minimal settings modal for Solana network and data layer configuration.
 */

import React, { useState } from 'react';
import { X, Sliders } from 'lucide-react';
import { useOnfolio } from '../state/OnfolioContext.tsx';
import { ProviderMode } from '../solana/solanaProviderFactory.ts';
import { SolanaNetwork } from '../types/index.ts';

interface ProviderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProviderSettingsModal: React.FC<ProviderSettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    currentProviderMode,
    setProviderModeState,
    preferences,
    setNetwork,
    setCustomRpcUrl,
    activeAddress,
    scanAddress,
  } = useOnfolio();

  const [tempRpcUrl, setTempRpcUrl] = useState(preferences.customRpcUrl || '');
  const [selectedMode, setSelectedMode] = useState<ProviderMode>(currentProviderMode);
  const [selectedNet, setSelectedNet] = useState<SolanaNetwork>(preferences.selectedNetwork);

  if (!isOpen) return null;

  const handleSave = () => {
    setProviderModeState(selectedMode);
    setNetwork(selectedNet);
    setCustomRpcUrl(tempRpcUrl.trim());
    if (activeAddress) {
      scanAddress(activeAddress, { mode: selectedMode });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-2xl border border-[#E8E4DD] max-w-md w-full p-6 space-y-5 shadow-xl text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#161C24]" />
            <h2 className="text-base font-bold text-[#161C24]">Settings</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8C97A5] hover:text-[#161C24] p-1 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#161C24] block mb-1">Network</label>
            <select
              value={selectedNet}
              onChange={(e) => setSelectedNet(e.target.value as SolanaNetwork)}
              className="w-full h-10 px-3 bg-white border border-[#E8E4DD] rounded-xl text-xs text-[#161C24] focus:outline-none focus:border-[#D4683B]"
            >
              <option value="mainnet-beta">Mainnet Beta</option>
              <option value="devnet">Devnet</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#161C24] block mb-1">Provider Mode</label>
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value as ProviderMode)}
              className="w-full h-10 px-3 bg-white border border-[#E8E4DD] rounded-xl text-xs text-[#161C24] focus:outline-none focus:border-[#D4683B]"
            >
              <option value="auto">Auto (Live RPC with Sandbox Fallback)</option>
              <option value="rpc">Live Solana RPC Only</option>
              <option value="adapter">Development Sandbox Only</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#161C24] block mb-1">Custom RPC Endpoint</label>
            <input
              type="text"
              value={tempRpcUrl}
              onChange={(e) => setTempRpcUrl(e.target.value)}
              placeholder="https://api.mainnet-beta.solana.com"
              className="w-full h-10 px-3 bg-white border border-[#E8E4DD] rounded-xl text-xs font-mono text-[#161C24] focus:outline-none focus:border-[#D4683B]"
            />
          </div>
        </div>

        <div className="pt-2 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-10 border border-[#E8E4DD] hover:bg-[#FAF8F5] rounded-xl text-xs font-medium text-[#5E6978] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 h-10 bg-[#161C24] hover:bg-[#2B333E] text-white rounded-xl text-xs font-medium transition-colors cursor-pointer"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
