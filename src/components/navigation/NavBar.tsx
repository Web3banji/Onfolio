/**
 * Presentation Layer: Minimal Navigation Bar
 * 
 * CORE RULES:
 * Minimal navigation: Home | Portfolio | Passport.
 * Wallet management & settings accessible without crowding.
 * Official brand logo & typography.
 */

import React, { useState } from 'react';
import { OnfolioLogo } from '../brand/OnfolioLogo.tsx';
import { useOnfolio } from '../../state/OnfolioContext.tsx';
import {
  Wallet as WalletIcon,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  LogOut,
  ChevronDown,
  User as UserIcon,
} from 'lucide-react';

export type ActiveNavTab = 'home' | 'portfolio' | 'passport';

interface NavBarProps {
  currentTab: ActiveNavTab;
  onSelectTab: (tab: ActiveNavTab) => void;
  onOpenWallets: () => void;
  onOpenSettings: () => void;
  onOpenVerifier: () => void;
  onSignOut: () => void;
}

export const NavBar: React.FC<NavBarProps> = ({
  currentTab,
  onSelectTab,
  onOpenWallets,
  onOpenSettings,
  onOpenVerifier,
  onSignOut,
}) => {
  const { activeWallet, wallets, currentUser, verificationRecord } = useOnfolio();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isWalletVerified = activeWallet?.verificationStatus === 'verified';
  const isScannedOnly = activeWallet?.isScannedOnly ?? true;

  const shortAddress = activeWallet
    ? `${activeWallet.publicAddress.slice(0, 4)}...${activeWallet.publicAddress.slice(-4)}`
    : 'No wallet';

  return (
    <nav className="bg-[#FAF8F5] border-b border-[#E8E4DD] sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left: Brand Logo & Wordmark */}
        <div className="flex items-center gap-6 sm:gap-8">
          <button
            type="button"
            onClick={() => onSelectTab('home')}
            className="flex items-center gap-2 cursor-pointer focus:outline-none"
            aria-label="Onfolio Home"
          >
            <OnfolioLogo size={28} showWordmark />
          </button>

          {/* Center Tabs: Minimal Navigation */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onSelectTab('home')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                currentTab === 'home'
                  ? 'bg-[#161C24] text-white'
                  : 'text-[#5E6978] hover:text-[#161C24] hover:bg-[#F0EDE5]'
              }`}
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('portfolio')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                currentTab === 'portfolio'
                  ? 'bg-[#161C24] text-white'
                  : 'text-[#5E6978] hover:text-[#161C24] hover:bg-[#F0EDE5]'
              }`}
            >
              Portfolio
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('passport')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                currentTab === 'passport'
                  ? 'bg-[#161C24] text-white'
                  : 'text-[#5E6978] hover:text-[#161C24] hover:bg-[#F0EDE5]'
              }`}
            >
              Passport
            </button>
          </div>
        </div>

        {/* Right: Wallet & Account Actions */}
        <div className="flex items-center gap-2">
          {/* Active Wallet Trigger */}
          <button
            type="button"
            onClick={onOpenWallets}
            id="nav-wallet-btn"
            className="h-9 px-3 bg-white hover:bg-[#F5F2EC] active:bg-[#EAE6E1] border border-[#E8E4DD] rounded-lg text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
            title="Manage Wallets"
          >
            <WalletIcon className="w-3.5 h-3.5 text-[#5E6978]" />
            <span className="font-mono text-[#161C24]">{shortAddress}</span>
            {isWalletVerified && !isScannedOnly && (
              <span className="w-2 h-2 rounded-full bg-[#1B7A4F]" title="Verified Wallet" />
            )}
            {isScannedOnly && (
              <span className="text-[10px] text-[#8C97A5] font-sans">Scanned</span>
            )}
            <ChevronDown className="w-3 h-3 text-[#8C97A5]" />
          </button>

          {/* Verification Status Trigger */}
          <button
            type="button"
            onClick={onOpenVerifier}
            className="h-9 px-2.5 bg-white hover:bg-[#F5F2EC] border border-[#E8E4DD] rounded-lg text-xs flex items-center gap-1.5 text-[#5E6978] hover:text-[#161C24] transition-colors cursor-pointer shadow-2xs hidden sm:flex"
            title="Verification status"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#1B7A4F]" />
            <span>Verify</span>
          </button>

          {/* User Profile / Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-9 h-9 bg-white hover:bg-[#F5F2EC] border border-[#E8E4DD] rounded-lg flex items-center justify-center text-[#161C24] cursor-pointer shadow-2xs overflow-hidden"
              aria-label="User Account"
            >
              {currentUser?.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.displayName || 'User'}
                  className="w-full h-full object-cover rounded-lg"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <UserIcon className="w-3.5 h-3.5 text-[#5E6978]" />
              )}
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-white border border-[#E8E4DD] rounded-xl shadow-lg p-1.5 z-50 text-xs">
                <div className="px-3 py-2 border-b border-[#E8E4DD]/60">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <div className="font-semibold text-[#161C24] truncate">
                      {currentUser?.displayName || 'Investor'}
                    </div>
                    {currentUser?.authProvider === 'google' && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-[#FAF0EA] text-[#D4683B] font-medium rounded">
                        Google
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#8C97A5] truncate">
                    {currentUser?.email || 'Connected'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    onOpenWallets();
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[#F5F2EC] rounded-lg text-[#161C24] flex items-center gap-2 cursor-pointer"
                >
                  <WalletIcon className="w-3.5 h-3.5 text-[#5E6978]" />
                  <span>Wallets ({wallets.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    onOpenSettings();
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[#F5F2EC] rounded-lg text-[#161C24] flex items-center gap-2 cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5 text-[#5E6978]" />
                  <span>Settings</span>
                </button>

                <div className="pt-1 mt-1 border-t border-[#E8E4DD]/60">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      onSignOut();
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-[#FDF2F2] rounded-lg text-[#A82A2A] flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
