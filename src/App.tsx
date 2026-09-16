/**
 * Onfolio — Lead Engineer & Product Architect
 * 
 * LOCKED VISUAL & UX SYSTEM:
 * - Brand Source of Truth: Terracotta #D4683B & Onyx #161C24 on Alabaster Canvas #FAF8F5
 * - Minimal text philosophy: Short labels, clear numbers, whitespace, visual hierarchy
 * - Minimal navigation: Home | Portfolio | Passport
 * - Clean First Impression: Onfolio Logo -> ONFOLIO -> Continue with Google / Email
 * - Clean Onboarding: Connect Wallet ("Build your verified Onfolio Passport") / Scan Address ("Explore a wallet")
 * - Clean Dashboard (Home), Holdings (Portfolio), Identity (Passport), and Management (Wallets)
 */

import React, { useState, useEffect } from 'react';
import { OnfolioProvider, useOnfolio } from './state/OnfolioContext.tsx';
import { AuthScreen } from './components/auth/AuthScreen.tsx';
import { authService } from './auth/authService.ts';
import { OnboardingScreen } from './components/onboarding/OnboardingScreen.tsx';
import { NavBar, ActiveNavTab } from './components/navigation/NavBar.tsx';
import { HomeView } from './components/views/HomeView.tsx';
import { PortfolioView } from './components/views/PortfolioView.tsx';
import { PassportView } from './components/PassportView.tsx';
import { WalletsModal } from './components/views/WalletsModal.tsx';
import { VerificationModal } from './components/VerificationModal.tsx';
import { PrivacySettingsModal } from './components/PrivacySettingsModal.tsx';
import { ProviderSettingsModal } from './components/ProviderSettingsModal.tsx';
import { Loader2 } from 'lucide-react';

function OnfolioAppContent() {
  const {
    currentUser,
    logoutUser,
    wallets,
    activeWallet,
    isScanning,
    scanError,
    scanAddress,
  } = useOnfolio();

  const [currentTab, setCurrentTab] = useState<ActiveNavTab>('home');
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Modal states
  const [isWalletsOpen, setIsWalletsOpen] = useState(false);
  const [isVerifierOpen, setIsVerifierOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Listen to session expiration
  useEffect(() => {
    const unsub = authService.onAuthStateChanged((user, event) => {
      if (event === 'session_expired') {
        setSessionExpired(true);
      } else if (event === 'sign_in') {
        setSessionExpired(false);
      }
    });
    return unsub;
  }, []);

  // 1. FIRST IMPRESSION: Authentication required
  if (!currentUser) {
    return <AuthScreen sessionExpired={sessionExpired} />;
  }

  // 2. ONBOARDING: If user has no wallets and hasn't completed onboarding yet
  const isUserOnboarded = Boolean(currentUser?.hasCompletedOnboarding || wallets.length > 0 || hasCompletedOnboarding);

  if (!isUserOnboarded) {
    return (
      <OnboardingScreen
        onComplete={() => {
          setHasCompletedOnboarding(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#161C24] font-sans flex flex-col selection:bg-[#D4683B] selection:text-white">
      {/* Top Navigation */}
      <NavBar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenWallets={() => setIsWalletsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenVerifier={() => setIsVerifierOpen(true)}
        onSignOut={logoutUser}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Error notification banner if any */}
        {scanError && (
          <div className="mb-6 p-4 bg-[#FDF2F2] border border-[#F5C2C2] rounded-xl text-xs text-[#A82A2A] flex items-center justify-between">
            <span>{scanError}</span>
            {activeWallet && (
              <button
                type="button"
                onClick={() => scanAddress(activeWallet.publicAddress)}
                className="font-semibold underline hover:no-underline cursor-pointer"
              >
                Retry
              </button>
            )}
          </div>
        )}

        {/* Global scanning indicator */}
        {isScanning ? (
          <div className="py-24 text-center space-y-3">
            <Loader2 className="w-6 h-6 text-[#D4683B] animate-spin mx-auto" />
            <div className="text-xs text-[#5E6978]">Retrieving onchain portfolio...</div>
          </div>
        ) : (
          <>
            {/* View 1: Home / Dashboard */}
            {currentTab === 'home' && (
              <HomeView
                onNavigateToPortfolio={() => setCurrentTab('portfolio')}
                onNavigateToPassport={() => setCurrentTab('passport')}
                onOpenVerifier={() => setIsVerifierOpen(true)}
              />
            )}

            {/* View 2: Portfolio Holdings */}
            {currentTab === 'portfolio' && (
              <PortfolioView onOpenWallets={() => setIsWalletsOpen(true)} />
            )}

            {/* View 3: Passport Identity */}
            {currentTab === 'passport' && (
              <PassportView
                onOpenVerifier={() => setIsVerifierOpen(true)}
                onOpenPrivacy={() => setIsPrivacyOpen(true)}
                onOpenWallets={() => setIsWalletsOpen(true)}
              />
            )}
          </>
        )}
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-[#E8E4DD] py-6 px-4 text-center text-xs text-[#8C97A5]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>Onfolio · Onchain Investment Passport</div>
          <div>Non-custodial public ledger verification</div>
        </div>
      </footer>

      {/* Modals */}
      <WalletsModal
        isOpen={isWalletsOpen}
        onClose={() => setIsWalletsOpen(false)}
      />

      <VerificationModal
        isOpen={isVerifierOpen}
        onClose={() => setIsVerifierOpen(false)}
      />

      <PrivacySettingsModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />

      <ProviderSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <OnfolioProvider>
      <OnfolioAppContent />
    </OnfolioProvider>
  );
}
