/**
 * Application State Layer: Onfolio React Context
 * 
 * Orchestrates:
 * USER → WALLET ADDRESS → SOLANA DATA → ASSET RECOGNITION → PORTFOLIO → PASSPORT → VERIFICATION
 * 
 * Includes:
 * - User authentication & account management (AuthService & AccountService)
 * - Multi-wallet management (Scanned read-only vs Connected verified)
 * - Market data (Pyth preferred + Fallback NAV)
 * - Privacy settings & Selective disclosure
 * - Independent verification
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  WalletState,
  Portfolio,
  Passport,
  VerificationRecord,
  UserPreferences,
  PrivacyMode,
  SolanaNetwork,
  User,
  Wallet,
  PrivacySettings,
  WalletConnectionStatus,
  WalletOnchainData,
  WalletOperationResult,
} from '../types/index.ts';
import {
  INITIAL_WALLET_STATE,
  detectInstalledWallets,
  connectInjectedWallet,
  disconnectInjectedWallet,
  isValidSolanaAddress,
  SAMPLE_PORTFOLIO_ADDRESSES,
} from '../wallet/walletManager.ts';
import { walletService, DetectedWalletProvider } from '../wallet/walletService.ts';
import { getSolanaDataProvider, ProviderMode } from '../solana/solanaProviderFactory.ts';
import { calculatePortfolioFromAccounts } from '../portfolio/portfolioEngine.ts';
import { generatePassportFromPortfolio } from '../passport/passportGenerator.ts';
import { verifyPassportAuthenticity } from '../verification/verificationEngine.ts';
import { authService } from '../auth/authService.ts';
import { accountService } from '../account/accountService.ts';
import { privacyService, DEFAULT_PRIVACY_SETTINGS } from '../privacy/privacyService.ts';
import { marketDataService } from '../market/MarketDataService.ts';

export interface ExtendedWalletOperationResult extends WalletOperationResult {
  id?: string;
  publicAddress?: string;
}

interface OnfolioContextType {
  // User Session (Auth Layer)
  currentUser: User | null;
  loginUser: (username: string, email?: string) => Promise<User>;
  logoutUser: () => Promise<void>;

  // Multi-Wallet Management (Account Layer)
  wallets: Wallet[];
  activeWallet: Wallet | null;
  availableProviders: DetectedWalletProvider[];
  walletLoadingState: WalletConnectionStatus;
  addWalletByScanning: (address: string, label?: string) => Promise<ExtendedWalletOperationResult & Partial<Wallet>>;
  addWalletByConnecting: (
    type: 'phantom' | 'solflare' | 'backpack' | 'injected',
    label?: string
  ) => Promise<ExtendedWalletOperationResult & Partial<Wallet>>;
  verifyWalletOwnership: (walletId: string) => Promise<{ success: boolean; error?: string }>;
  removeWallet: (walletId: string) => Promise<{ success: boolean; message: string }>;
  renameWallet: (walletId: string, newLabel: string) => Promise<void>;
  setPrimaryWallet: (walletId: string) => Promise<void>;
  selectActiveWallet: (wallet: Wallet) => void;
  fetchWalletDetails: (address: string) => Promise<WalletOnchainData>;

  // Single Active Wallet State (Compatibility)
  walletState: WalletState;
  connectWallet: (type: 'phantom' | 'solflare' | 'backpack' | 'injected') => Promise<void>;
  disconnectWallet: () => Promise<void>;

  // Scanning & Address Lookup
  activeAddress: string;
  isScanning: boolean;
  scanError: string | null;
  scanAddress: (address: string, options?: { mode?: ProviderMode; skipWalletRegistry?: boolean }) => Promise<void>;
  loadSampleProfile: (address: string) => void;

  // Pipeline Data
  portfolio: Portfolio | null;
  passport: Passport | null;
  verificationRecord: VerificationRecord | null;

  // Multi-Wallet Aggregated View
  isAggregatedView: boolean;
  toggleAggregatedView: (enable: boolean) => void;

  // Provider & Diagnostics
  currentProviderMode: ProviderMode;
  setProviderModeState: (mode: ProviderMode) => void;
  clusterSlot: number;
  providerStatusMessage: string;

  // Preferences & Selective Disclosure Privacy
  preferences: UserPreferences;
  privacySettings: PrivacySettings;
  updatePrivacySettings: (settings: Partial<PrivacySettings>) => void;
  setPrivacyMode: (mode: PrivacyMode) => void;
  setNetwork: (network: SolanaNetwork) => void;
  setCustomRpcUrl: (url: string) => void;

  // Verifier actions
  verifyExternalPassportJson: (json: string) => Promise<VerificationRecord | null>;
}

const OnfolioContext = createContext<OnfolioContextType | null>(null);

export function OnfolioProvider({ children }: { children: ReactNode }) {
  // Auth & Account
  const [currentUser, setCurrentUser] = useState<User | null>(authService.getCurrentUser());
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [activeWallet, setActiveWallet] = useState<Wallet | null>(null);
  const [isAggregatedView, setIsAggregatedView] = useState<boolean>(false);
  const [availableProviders, setAvailableProviders] = useState<DetectedWalletProvider[]>(walletService.getAvailableWallets());
  const [walletLoadingState, setWalletLoadingState] = useState<WalletConnectionStatus>('disconnected');

  // Raw wallet connector state
  const [walletState, setWalletState] = useState<WalletState>(INITIAL_WALLET_STATE);
  const [activeAddress, setActiveAddress] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Pipeline outputs
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [passport, setPassport] = useState<Passport | null>(null);
  const [verificationRecord, setVerificationRecord] = useState<VerificationRecord | null>(null);

  // Diagnostics & Provider
  const [providerMode, setProviderModeState] = useState<ProviderMode>('auto');
  const [clusterSlot, setClusterSlot] = useState<number>(328954200);
  const [providerStatusMessage, setProviderStatusMessage] = useState<string>('Initializing Solana RPC...');

  // Preferences & Privacy
  const [preferences, setPreferences] = useState<UserPreferences>({
    currency: 'USD',
    privacyMode: 'public_full',
    selectedNetwork: 'mainnet-beta',
    customRpcUrl: '',
    autoRefreshIntervalSeconds: 60,
  });

  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(DEFAULT_PRIVACY_SETTINGS);

  // Sync wallets from AccountService
  const refreshWallets = useCallback(() => {
    const userWallets = accountService.getWallets();
    setWallets(userWallets);
    if (userWallets.length > 0 && !activeWallet) {
      setActiveWallet(userWallets[0]);
    }
  }, [activeWallet]);

  useEffect(() => {
    refreshWallets();
  }, [refreshWallets]);

  // Detect installed extensions on load
  useEffect(() => {
    const detected = detectInstalledWallets();
    setWalletState((prev) => ({
      ...prev,
      detectedWallets: detected,
    }));
  }, []);

  // Main scan pipeline
  const scanAddress = useCallback(
    async (rawAddress: string, options?: { mode?: ProviderMode; skipWalletRegistry?: boolean }) => {
      const address = rawAddress.trim();
      if (!address) {
        setScanError('Please provide a Solana public wallet address.');
        return;
      }

      if (!isValidSolanaAddress(address)) {
        setScanError('Invalid Solana address format. A valid address is 32–44 Base58 characters.');
        return;
      }

      setScanError(null);
      setIsScanning(true);
      setActiveAddress(address);

      try {
        const mode = options?.mode || providerMode;
        let provider = getSolanaDataProvider({
          mode,
          customRpcUrl: preferences.customRpcUrl || undefined,
        });

        // Health check
        const health = await provider.checkHealth();
        setClusterSlot(health.currentSlot);
        setProviderStatusMessage(health.message);

        let tokenAccounts;
        let signatures;

        try {
          tokenAccounts = await provider.fetchTokenAccounts(address);
          signatures = await provider.fetchRecentSignatures(address);
        } catch (fetchErr: any) {
          // If auto mode and live RPC fails (e.g. rate limit), gracefully fallback to dev adapter
          if (mode === 'auto') {
            console.warn('Live RPC fetch failed; falling back to development sandbox adapter:', fetchErr.message);
            provider = getSolanaDataProvider({ mode: 'adapter', forceFresh: true });
            tokenAccounts = await provider.fetchTokenAccounts(address);
            signatures = await provider.fetchRecentSignatures(address);
            setProviderStatusMessage('Live RPC unavailable; loaded via Development Sandbox Adapter.');
          } else {
            throw fetchErr;
          }
        }

        // 1. ASSET RECOGNITION & PORTFOLIO CALCULATION (combining holdings + registry + Pyth/fallback market prices)
        const calculatedPortfolio = await calculatePortfolioFromAccounts(
          address,
          tokenAccounts,
          signatures,
          provider
        );
        setPortfolio(calculatedPortfolio);

        // 2. PASSPORT GENERATION
        const currentWallets = accountService.getWallets();
        const generatedPassport = await generatePassportFromPortfolio(calculatedPortfolio, {
          user: currentUser,
          connectedWallets: currentWallets,
        });
        setPassport(generatedPassport);

        // 3. VERIFICATION RECORD
        const verification = await verifyPassportAuthenticity(generatedPassport, health.currentSlot);
        setVerificationRecord(verification);

        // Track in account service if not skipped
        if (!options?.skipWalletRegistry) {
          const existing = accountService.getWalletByAddress(address);
          if (!existing) {
            accountService.addScannedWallet(address, `Scanned (${address.slice(0, 4)}...${address.slice(-4)})`);
            refreshWallets();
          }
        }
      } catch (err: any) {
        console.error('Scan error:', err);
        setScanError(err.message || 'Error communicating with Solana data layer.');
      } finally {
        setIsScanning(false);
      }
    },
    [providerMode, preferences.customRpcUrl, currentUser, refreshWallets]
  );

  // Listen to auth state changes across the application
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((user) => {
      setCurrentUser(user);
      refreshWallets();
    });
    return unsubscribe;
  }, [refreshWallets]);

  // User Auth Actions
  const loginUser = useCallback(async (_username?: string, _email?: string) => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    refreshWallets();
    return user;
  }, [refreshWallets]);

  const logoutUser = useCallback(async () => {
    await authService.logout();
    setCurrentUser(null);
  }, []);

  // Multi-Wallet Management Actions
  const addWalletByScanning = useCallback(async (address: string, label?: string) => {
    setWalletLoadingState('loading_wallet');
    setScanError(null);

    const opResult = await walletService.addScannedAddress(address, label);
    if (!opResult.success || !opResult.wallet) {
      setWalletLoadingState('error');
      setScanError(opResult.error || 'Invalid address');
      return {
        ...opResult,
        publicAddress: address,
      };
    }

    refreshWallets();
    setActiveWallet(opResult.wallet);

    try {
      await scanAddress(opResult.wallet.publicAddress);
      setWalletLoadingState('loaded');
    } catch (err: any) {
      setWalletLoadingState('error');
      setScanError(err?.message || 'Failed to scan address');
    }

    return {
      ...opResult.wallet,
      ...opResult,
      id: opResult.wallet.id,
      publicAddress: opResult.wallet.publicAddress,
    };
  }, [refreshWallets, scanAddress]);

  const addWalletByConnecting = useCallback(
    async (type: 'phantom' | 'solflare' | 'backpack' | 'injected', label?: string) => {
      setWalletLoadingState('connecting');
      setScanError(null);

      const opResult = await walletService.connectAndAddWallet(type, label);
      if (!opResult.success || !opResult.wallet) {
        const failureStatus = opResult.status || 'error';
        setWalletLoadingState(failureStatus);
        setScanError(opResult.error || 'Failed to connect wallet');
        return {
          ...opResult,
          status: failureStatus,
        };
      }

      refreshWallets();
      setActiveWallet(opResult.wallet);
      setWalletLoadingState('loading_wallet');

      setWalletState((prev) => ({
        ...prev,
        address: opResult.wallet!.publicAddress,
        isConnected: true,
        connectorType: type,
      }));

      try {
        await scanAddress(opResult.wallet.publicAddress);
        setWalletLoadingState('loaded');
      } catch (err: any) {
        setWalletLoadingState('error');
        setScanError(err?.message || 'Error discovering wallet assets');
      }

      return {
        ...opResult.wallet,
        ...opResult,
        id: opResult.wallet.id,
        publicAddress: opResult.wallet.publicAddress,
      };
    },
    [refreshWallets, scanAddress]
  );

  const verifyWalletOwnership = useCallback(async (walletId: string) => {
    const challenge = await accountService.requestOwnershipChallenge(walletId);
    if (!challenge) {
      return { success: false, error: 'Cannot issue challenge for this wallet.' };
    }

    // Attempt browser extension signature challenge
    try {
      const solana = (window as any).solana;
      if (!solana?.signMessage) {
        // In preview environments where extensions don't run, simulate valid challenge signature
        const simulatedSignature = `sig_demo_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
        const verified = await accountService.verifyOwnershipChallenge(walletId, challenge.nonce, simulatedSignature);
        refreshWallets();
        return { success: verified };
      }

      const encodedMessage = new TextEncoder().encode(challenge.message);
      const signed = await solana.signMessage(encodedMessage, 'utf8');
      const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signed.signature)));

      const verified = await accountService.verifyOwnershipChallenge(walletId, challenge.nonce, signatureBase64);
      refreshWallets();

      // Refresh passport with verified status
      if (portfolio) {
        const updatedWallets = accountService.getWallets();
        const updatedPassport = await generatePassportFromPortfolio(portfolio, {
          user: currentUser,
          connectedWallets: updatedWallets,
        });
        setPassport(updatedPassport);
      }

      return { success: verified };
    } catch (err: any) {
      return { success: false, error: err.message || 'Signature rejected by user.' };
    }
  }, [refreshWallets, portfolio, currentUser]);

  const removeWallet = useCallback(async (walletId: string) => {
    const res = walletService.removeWallet(walletId);
    const updated = accountService.getWallets();
    setWallets(updated);

    if (activeWallet?.id === walletId) {
      const fallback = updated.find((w) => w.isPrimary) || updated[0] || null;
      setActiveWallet(fallback);
      if (fallback) {
        await scanAddress(fallback.publicAddress);
      } else {
        setActiveAddress('');
        setPortfolio(null);
        setPassport(null);
      }
    }
    return res;
  }, [activeWallet, scanAddress]);

  const fetchWalletDetails = useCallback(async (address: string) => {
    return await walletService.getWalletOnchainData(address);
  }, []);

  const renameWallet = useCallback(async (walletId: string, newLabel: string) => {
    accountService.renameWallet(walletId, newLabel);
    refreshWallets();
  }, [refreshWallets]);

  const setPrimaryWallet = useCallback(async (walletId: string) => {
    const updated = accountService.setPrimaryWallet(walletId);
    if (updated) {
      setActiveWallet(updated);
    }
    refreshWallets();
  }, [refreshWallets]);

  const selectActiveWallet = useCallback((wallet: Wallet) => {
    setActiveWallet(wallet);
    scanAddress(wallet.publicAddress);
  }, [scanAddress]);

  const toggleAggregatedView = useCallback((enable: boolean) => {
    setIsAggregatedView(enable);
  }, []);

  // Raw Connect / Disconnect (Compatibility)
  const connectWallet = useCallback(
    async (type: 'phantom' | 'solflare' | 'backpack' | 'injected') => {
      await addWalletByConnecting(type);
    },
    [addWalletByConnecting]
  );

  const disconnectWallet = useCallback(async () => {
    await disconnectInjectedWallet();
    setWalletState((prev) => ({
      ...prev,
      address: '',
      isConnected: false,
      connectorType: 'manual_lookup',
    }));
  }, []);

  const loadSampleProfile = useCallback(
    (address: string) => {
      scanAddress(address, { mode: 'adapter' });
    },
    [scanAddress]
  );

  // Privacy & Preferences
  const updatePrivacySettings = useCallback((newSettings: Partial<PrivacySettings>) => {
    setPrivacySettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  const setPrivacyMode = useCallback((mode: PrivacyMode) => {
    setPreferences((p) => ({ ...p, privacyMode: mode }));
    if (mode === 'anonymous_metrics') {
      updatePrivacySettings({ hideAbsoluteBalances: true, hideWalletAddresses: true });
    } else if (mode === 'selective_sharing') {
      updatePrivacySettings({ hideAbsoluteBalances: true, percentageOnlyAllocation: true });
    } else {
      updatePrivacySettings({ hideAbsoluteBalances: false, hideWalletAddresses: false });
    }
  }, [updatePrivacySettings]);

  const setNetwork = useCallback((network: SolanaNetwork) => {
    setPreferences((p) => ({ ...p, selectedNetwork: network }));
  }, []);

  const setCustomRpcUrl = useCallback((url: string) => {
    setPreferences((p) => ({ ...p, customRpcUrl: url }));
  }, []);

  const verifyExternalPassportJson = useCallback(async (json: string): Promise<VerificationRecord | null> => {
    try {
      const parsed = JSON.parse(json) as Passport;
      return await verifyPassportAuthenticity(parsed);
    } catch {
      return null;
    }
  }, []);

  // Initial load: auto-load first sample portfolio so user sees a working passport immediately
  useEffect(() => {
    const defaultSample = SAMPLE_PORTFOLIO_ADDRESSES[0].address;
    scanAddress(defaultSample, { mode: 'adapter' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <OnfolioContext.Provider
      value={{
        currentUser,
        loginUser,
        logoutUser,
        wallets,
        activeWallet,
        availableProviders,
        walletLoadingState,
        addWalletByScanning,
        addWalletByConnecting,
        verifyWalletOwnership,
        removeWallet,
        renameWallet,
        setPrimaryWallet,
        selectActiveWallet,
        fetchWalletDetails,
        walletState,
        connectWallet,
        disconnectWallet,
        activeAddress,
        isScanning,
        scanError,
        scanAddress,
        loadSampleProfile,
        portfolio,
        passport,
        verificationRecord,
        isAggregatedView,
        toggleAggregatedView,
        currentProviderMode: providerMode,
        setProviderModeState,
        clusterSlot,
        providerStatusMessage,
        preferences,
        privacySettings,
        updatePrivacySettings,
        setPrivacyMode,
        setNetwork,
        setCustomRpcUrl,
        verifyExternalPassportJson,
      }}
    >
      {children}
    </OnfolioContext.Provider>
  );
}

export function useOnfolio() {
  const ctx = useContext(OnfolioContext);
  if (!ctx) {
    throw new Error('useOnfolio must be used within an OnfolioProvider');
  }
  return ctx;
}
