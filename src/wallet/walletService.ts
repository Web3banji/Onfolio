/**
 * Onfolio Solana Wallet Service
 * 
 * Centralized, non-custodial wallet management service.
 * Handles real wallet adapter discovery, connection lifecycle, duplicate protection,
 * multi-wallet account relationships, and public blockchain data retrieval.
 * 
 * SECURITY DIRECTIVE:
 * - Operates strictly as a read-only address & data retrieval service.
 * - Never requests or handles private keys, seed phrases, recovery phrases, or passwords.
 * - Never signs transactions or moves funds.
 * - Never fabricates fake wallet connections or simulated loading progress.
 */

import {
  Wallet,
  WalletConnectionMethod,
  WalletConnectionStatus,
  WalletLabel,
  WalletOnchainData,
  WalletOperationResult,
  WalletTokenBalance,
} from '../types/index.ts';
import { accountService } from '../account/accountService.ts';
import { authService } from '../auth/authService.ts';
import { getSolanaDataProvider, ProviderMode } from '../solana/solanaProviderFactory.ts';
import { ONFOLIO_ASSET_REGISTRY_ENTRIES } from '../registry/assetRegistry.ts';
import { TOKENIZED_EQUITIES_REGISTRY } from '../registry/tokenizedEquitiesRegistry.ts';
import { isValidSolanaAddress } from './walletManager.ts';

// Global window declarations for browser wallet discovery
declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
      isCoinbaseWallet?: boolean;
      isBraveWallet?: boolean;
      publicKey?: { toString(): string };
      connect(options?: { onlyIfTrusted?: boolean }): Promise<{ publicKey: { toString(): string } }>;
      disconnect(): Promise<void>;
      isConnected?: boolean;
    };
    phantom?: {
      solana?: Window['solana'];
    };
    solflare?: {
      isSolflare?: boolean;
      publicKey?: { toString(): string };
      connect(): Promise<void>;
      disconnect(): Promise<void>;
      isConnected?: boolean;
    };
    backpack?: {
      publicKey?: { toString(): string };
      connect(): Promise<void>;
      disconnect(): Promise<void>;
      isConnected?: boolean;
    };
    coinbaseSolana?: {
      publicKey?: { toString(): string };
      connect(): Promise<{ publicKey: { toString(): string } }>;
      disconnect(): Promise<void>;
      isConnected?: boolean;
    };
  }
}

export interface DetectedWalletProvider {
  id: WalletConnectionMethod;
  name: string;
  isAvailable: boolean;
  iconType: 'phantom' | 'solflare' | 'backpack' | 'injected';
}

export class WalletService {
  private static instance: WalletService;

  private constructor() {}

  public static getInstance(): WalletService {
    if (!WalletService.instance) {
      WalletService.instance = new WalletService();
    }
    return WalletService.instance;
  }

  // =========================================================================
  // 1. Detection of Real Browser Wallet Extensions
  // =========================================================================

  public getAvailableWallets(): DetectedWalletProvider[] {
    if (typeof window === 'undefined') {
      return [
        { id: 'phantom', name: 'Phantom', isAvailable: false, iconType: 'phantom' },
        { id: 'solflare', name: 'Solflare', isAvailable: false, iconType: 'solflare' },
        { id: 'backpack', name: 'Backpack', isAvailable: false, iconType: 'backpack' },
        { id: 'injected', name: 'Standard Solana', isAvailable: false, iconType: 'injected' },
      ];
    }

    const hasPhantom = Boolean(window.phantom?.solana?.isPhantom || (window.solana?.isPhantom && !window.solana?.isBraveWallet));
    const hasSolflare = Boolean(window.solflare?.isSolflare);
    const hasBackpack = Boolean(window.backpack);
    const hasStandard = Boolean(window.solana || window.coinbaseSolana);

    return [
      { id: 'phantom', name: 'Phantom', isAvailable: hasPhantom, iconType: 'phantom' },
      { id: 'solflare', name: 'Solflare', isAvailable: hasSolflare, iconType: 'solflare' },
      { id: 'backpack', name: 'Backpack', isAvailable: hasBackpack, iconType: 'backpack' },
      { id: 'injected', name: 'Browser Wallet', isAvailable: hasStandard, iconType: 'injected' },
    ];
  }

  // =========================================================================
  // 2. Real Wallet Connection & Disconnection
  // =========================================================================

  /**
   * Connect to a supported browser extension wallet.
   * Strictly read-only: requests public address string only.
   * No signatures requested during connection.
   */
  public async connectBrowserWallet(
    providerType: 'phantom' | 'solflare' | 'backpack' | 'injected'
  ): Promise<{
    success: boolean;
    address?: string;
    status: WalletConnectionStatus;
    error?: string;
  }> {
    try {
      if (providerType === 'phantom') {
        const provider = window.phantom?.solana || window.solana;
        if (!provider || !provider.isPhantom) {
          return {
            success: false,
            status: 'unavailable',
            error: 'Phantom wallet extension not detected in this browser.',
          };
        }
        const resp = await provider.connect();
        const address = resp?.publicKey?.toString() || provider.publicKey?.toString();
        if (!address || !isValidSolanaAddress(address)) {
          return {
            success: false,
            status: 'error',
            error: 'Could not retrieve public address from Phantom.',
          };
        }
        return { success: true, address, status: 'connected' };
      }

      if (providerType === 'solflare') {
        const provider = window.solflare;
        if (!provider) {
          return {
            success: false,
            status: 'unavailable',
            error: 'Solflare wallet extension not detected in this browser.',
          };
        }
        await provider.connect();
        const address = provider.publicKey?.toString();
        if (!address || !isValidSolanaAddress(address)) {
          return {
            success: false,
            status: 'error',
            error: 'Could not retrieve public address from Solflare.',
          };
        }
        return { success: true, address, status: 'connected' };
      }

      if (providerType === 'backpack') {
        const provider = window.backpack;
        if (!provider) {
          return {
            success: false,
            status: 'unavailable',
            error: 'Backpack wallet extension not detected in this browser.',
          };
        }
        await provider.connect();
        const address = provider.publicKey?.toString();
        if (!address || !isValidSolanaAddress(address)) {
          return {
            success: false,
            status: 'error',
            error: 'Could not retrieve public address from Backpack.',
          };
        }
        return { success: true, address, status: 'connected' };
      }

      // Generic Injected (window.solana, Coinbase, Brave, etc.)
      const standardProvider = window.solana || window.coinbaseSolana;
      if (!standardProvider) {
        return {
          success: false,
          status: 'unavailable',
          error: 'No Solana wallet extension detected in this browser.',
        };
      }

      const resp = await standardProvider.connect();
      const address = resp?.publicKey?.toString() || standardProvider.publicKey?.toString();
      if (!address || !isValidSolanaAddress(address)) {
        return {
          success: false,
          status: 'error',
          error: 'Could not retrieve public address from browser wallet.',
        };
      }

      return { success: true, address, status: 'connected' };
    } catch (err: any) {
      const msg = (err?.message || '').toLowerCase();
      // Handle user rejection in popup
      if (
        msg.includes('user rejected') ||
        msg.includes('4001') ||
        msg.includes('cancelled') ||
        msg.includes('canceled')
      ) {
        return {
          success: false,
          status: 'rejected',
          error: 'Connection rejected by user in wallet.',
        };
      }

      return {
        success: false,
        status: 'error',
        error: err?.message || 'Failed to connect wallet.',
      };
    }
  }

  /**
   * Disconnect any active injected wallet provider session.
   */
  public async disconnectInjectedProvider(): Promise<void> {
    try {
      if (window.phantom?.solana) await window.phantom.solana.disconnect();
      else if (window.solana) await window.solana.disconnect();
      if (window.solflare) await window.solflare.disconnect();
      if (window.backpack) await window.backpack.disconnect();
    } catch {
      // Non-blocking
    }
  }

  // =========================================================================
  // 3. User Wallet Association & Duplicate Protection
  // =========================================================================

  /**
   * Connect and associate a wallet with the authenticated Onfolio account.
   * Enforces DUPLICATE PROTECTION: if address already exists, recognizes it
   * and returns message "Wallet already added."
   */
  public async connectAndAddWallet(
    providerType: 'phantom' | 'solflare' | 'backpack' | 'injected',
    label?: string
  ): Promise<WalletOperationResult> {
    const connResult = await this.connectBrowserWallet(providerType);
    if (!connResult.success || !connResult.address) {
      return {
        success: false,
        status: connResult.status,
        error: connResult.error,
      };
    }

    const publicAddress = connResult.address;
    const currentUserId = authService.getCurrentUser()?.id || 'usr_anonymous';
    const existing = accountService.findWalletByAddress(publicAddress, currentUserId);

    if (existing) {
      // If already connected as a full wallet
      if (!existing.isScannedOnly) {
        return {
          success: true,
          wallet: existing,
          isDuplicate: true,
          message: 'Wallet already added.',
          status: 'connected',
        };
      }

      // If it was previously only scanned, upgrade it to an explicitly connected wallet
      const upgraded = accountService.addOrUpdateConnectedWallet({
        userId: currentUserId,
        publicAddress,
        network: 'mainnet-beta',
        walletType: providerType,
        label: label || existing.label || `${providerType.toUpperCase()} Wallet`,
      });

      return {
        success: true,
        wallet: upgraded,
        isDuplicate: false,
        message: 'Scanned address upgraded to Connected Wallet.',
        status: 'connected',
      };
    }

    // Newly added connected wallet
    const newWallet = accountService.addOrUpdateConnectedWallet({
      userId: currentUserId,
      publicAddress,
      network: 'mainnet-beta',
      walletType: providerType,
      label: label || `${providerType.toUpperCase()} Wallet`,
    });

    return {
      success: true,
      wallet: newWallet,
      isDuplicate: false,
      status: 'connected',
    };
  }

  /**
   * Add a public address by manual scanning / tracking.
   * Strictly marks the wallet as `isScannedOnly: true` (read-only, NO verification badge).
   * Enforces DUPLICATE PROTECTION.
   */
  public async addScannedAddress(
    address: string,
    label?: string
  ): Promise<WalletOperationResult> {
    const cleanAddress = address.trim();
    if (!cleanAddress) {
      return { success: false, error: 'Please enter a Solana public address.' };
    }

    if (!isValidSolanaAddress(cleanAddress)) {
      return {
        success: false,
        error: 'Invalid Solana address format. Must be 32–44 Base58 characters.',
      };
    }

    const currentUserId = authService.getCurrentUser()?.id || 'usr_anonymous';
    const existing = accountService.findWalletByAddress(cleanAddress, currentUserId);

    if (existing) {
      return {
        success: true,
        wallet: existing,
        isDuplicate: true,
        message: 'Wallet already added.',
      };
    }

    const wallet = await accountService.addScannedWallet(
      cleanAddress,
      label || `Scanned (${cleanAddress.slice(0, 4)}...${cleanAddress.slice(-4)})`,
      currentUserId
    );

    return {
      success: true,
      wallet,
      isDuplicate: false,
    };
  }

  // =========================================================================
  // 4. Wallet Management Operations (Rename, Primary, Remove)
  // =========================================================================

  public renameWallet(walletId: string, newLabel: string): Wallet | null {
    const trimmed = newLabel.trim();
    if (!trimmed) return null;
    return accountService.updateWalletLabel(walletId, trimmed);
  }

  public setPrimaryWallet(walletId: string): Wallet | null {
    return accountService.setPrimaryWallet(walletId);
  }

  /**
   * Remove a wallet from the user's Onfolio account.
   * Explicitly ensures the user understands blockchain history remains onchain.
   */
  public removeWallet(walletId: string): { success: boolean; message: string } {
    const success = accountService.removeWallet(walletId);
    return {
      success,
      message: success
        ? 'Wallet removed from Onfolio. Onchain transaction history remains permanently recorded on the Solana blockchain.'
        : 'Wallet not found.',
    };
  }

  // =========================================================================
  // 5. Clean Blockchain Data Retrieval Service
  // =========================================================================

  /**
   * Retrieves complete onchain wallet data:
   * - Public address verification
   * - Native SOL balance
   * - SPL and Token-2022 token accounts
   * - Token balances & mint addresses
   * - Metadata from Onfolio registry
   * - Recent onchain activity / transactions
   */
  public async getWalletOnchainData(
    publicAddress: string,
    options?: { mode?: ProviderMode; customRpcUrl?: string }
  ): Promise<WalletOnchainData> {
    const address = publicAddress.trim();
    if (!isValidSolanaAddress(address)) {
      throw new Error(`Invalid Solana address format: ${address}`);
    }

    const provider = getSolanaDataProvider({
      mode: options?.mode,
      customRpcUrl: options?.customRpcUrl,
    });

    // 1. Health check & cluster slot
    const health = await provider.checkHealth();
    const clusterSlot = health.currentSlot;

    // 2. Fetch native SOL balance
    let solBalanceLamports = 0;
    try {
      if (provider.getBalance) {
        solBalanceLamports = await provider.getBalance(address);
      } else {
        const acct = await provider.getAccountInfo(address);
        solBalanceLamports = acct?.lamports || 0;
      }
    } catch (e) {
      console.warn('Could not fetch native SOL balance:', e);
    }
    const solBalanceFormatted = solBalanceLamports / 1_000_000_000;

    // 3. Fetch token accounts (SPL & Token-2022)
    const rawTokenAccounts = await provider.fetchTokenAccounts(address);

    // 4. Map accounts to enriched token balances with metadata
    const tokens: WalletTokenBalance[] = rawTokenAccounts.map((acct) => {
      // Check in canonical Onfolio Asset Registry
      const registryEntry = ONFOLIO_ASSET_REGISTRY_ENTRIES[acct.mint];
      const equityEntry = TOKENIZED_EQUITIES_REGISTRY[acct.mint];

      let name = equityEntry?.name || registryEntry?.tokenizedAsset.name;
      let symbol = equityEntry?.symbol || registryEntry?.ticker;
      let isTokenizedEquity = Boolean(registryEntry || equityEntry);
      let underlyingSecurity = registryEntry?.underlyingSecurity;
      let issuer = registryEntry?.issuer;

      // If not in equity registry, format clean identifier without fake data
      if (!name) {
        name = `Token (${acct.mint.slice(0, 4)}...${acct.mint.slice(-4)})`;
        symbol = `${acct.mint.slice(0, 4).toUpperCase()}`;
        isTokenizedEquity = false;
      }

      return {
        pubkey: acct.pubkey,
        mint: acct.mint,
        owner: acct.owner,
        amountRaw: acct.amountRaw,
        decimals: acct.decimals,
        uiAmount: acct.uiAmount,
        name,
        symbol: symbol || 'TOKEN',
        isTokenizedEquity,
        underlyingSecurity,
        issuer,
        tokenProgram: acct.tokenProgram,
      };
    });

    // 5. Fetch recent transactions/signatures
    const signatures = await provider.fetchRecentSignatures(address, 15);

    return {
      address,
      solBalanceLamports,
      solBalanceFormatted,
      tokenAccountsCount: tokens.length,
      tokens,
      signatures,
      fetchedAt: new Date().toISOString(),
      clusterSlot,
    };
  }
}

export const walletService = WalletService.getInstance();
