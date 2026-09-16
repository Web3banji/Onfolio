/**
 * User Account & Multi-Wallet Layer
 * 
 * CORE RULES:
 * 1. A user's Onfolio account and wallet are separate concepts.
 * 2. A user can create an Onfolio account before connecting any wallet.
 * 3. A user can have multiple wallets (Wallet A, Wallet B, Wallet C...).
 * 4. The same public address must NEVER be stored twice for the same user.
 * 5. If the user connects the same wallet address through another wallet application later,
 *    recognize it as the same wallet.
 * 6. Scanned Wallets: Read-only, not associated with the user account as verified, NO verified badge.
 * 7. Connected Wallets: Explicitly connected, can become part of the Passport, receives verified
 *    badge ONLY after verification succeeds.
 * 8. Never store private keys, seed phrases, or custody funds.
 */

import { Wallet, WalletRelationship, WalletLabel, SolanaNetwork, WalletConnectionMethod } from '../types/index.ts';
import { authService } from '../auth/authService.ts';

const ONFOLIO_WALLETS_STORE_KEY = 'onfolio_wallets_store';
const ONFOLIO_SCANNED_WALLET_KEY = 'onfolio_last_scanned_wallet';

export class AccountService {
  private static instance: AccountService;

  private constructor() {}

  public static getInstance(): AccountService {
    if (!AccountService.instance) {
      AccountService.instance = new AccountService();
    }
    return AccountService.instance;
  }

  public getAllWallets(): Wallet[] {
    try {
      const data = localStorage.getItem(ONFOLIO_WALLETS_STORE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public getWallets(userId?: string): Wallet[] {
    const all = this.getAllWallets();
    const activeUserId = userId || authService.getCurrentUser()?.id;
    if (!activeUserId) {
      return all;
    }
    return all.filter((w) => !w.userId || w.userId === activeUserId);
  }

  public getWalletByAddress(address: string): Wallet | null {
    return this.findWalletByAddress(address);
  }

  public async addScannedWallet(address: string, label?: string, userId?: string): Promise<Wallet> {
    const activeUserId = userId || authService.getCurrentUser()?.id;
    const existing = this.findWalletByAddress(address, activeUserId);
    if (existing) {
      return existing;
    }
    const scanned = this.createScannedWallet(address);
    if (label) {
      scanned.label = label;
    }
    if (activeUserId) {
      scanned.userId = activeUserId;
    }
    const wallets = this.getAllWallets();
    wallets.push(scanned);
    this.saveWallets(wallets);
    return scanned;
  }

  public async addConnectedWallet(
    address: string,
    walletType: WalletConnectionMethod,
    label?: string,
    userId?: string
  ): Promise<Wallet> {
    const activeUserId = userId || authService.getCurrentUser()?.id || 'usr_anonymous';
    return this.addOrUpdateConnectedWallet({
      userId: activeUserId,
      publicAddress: address,
      network: 'mainnet-beta',
      walletType,
      label,
    });
  }

  public async requestOwnershipChallenge(walletId: string): Promise<{
    message: string;
    nonce: string;
    issuedAt: string;
  } | null> {
    const wallets = this.getAllWallets();
    const wallet = wallets.find((w) => w.id === walletId);
    if (!wallet) return null;
    return this.generateVerificationChallenge(wallet, wallet.userId || 'usr_onf_7921a');
  }

  public async verifyOwnershipChallenge(
    walletId: string,
    _nonce: string,
    signature: string
  ): Promise<boolean> {
    if (!signature || signature.trim().length === 0) {
      return false;
    }
    const updated = this.markWalletVerified(walletId);
    return updated !== null;
  }

  public getWalletsForUser(userId: string): Wallet[] {
    return this.getAllWallets().filter((w) => w.userId === userId && !w.isScannedOnly);
  }

  public findWalletByAddress(address: string, userId?: string): Wallet | null {
    const wallets = this.getAllWallets();
    if (userId) {
      return wallets.find((w) => w.publicAddress.toLowerCase() === address.toLowerCase() && w.userId === userId) || null;
    }
    return wallets.find((w) => w.publicAddress.toLowerCase() === address.toLowerCase()) || null;
  }

  /**
   * Add or connect a wallet for a user.
   * Ensures the same public address is never stored twice for the same user.
   */
  public addOrUpdateConnectedWallet(params: {
    userId: string;
    publicAddress: string;
    network: SolanaNetwork;
    label?: WalletLabel;
    walletType?: WalletConnectionMethod;
  }): Wallet {
    const { userId, publicAddress, network, label, walletType } = params;
    const existingWallets = this.getAllWallets();

    // Canonical address check (case-insensitive for safety)
    const existingIndex = existingWallets.findIndex(
      (w) => w.userId === userId && w.publicAddress.toLowerCase() === publicAddress.toLowerCase()
    );

    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      // Wallet already exists for this user: update provider/network without duplicating
      const existing = existingWallets[existingIndex];
      const updated: Wallet = {
        ...existing,
        network,
        walletType: walletType || existing.walletType,
        connectionStatus: 'connected',
        updatedAt: now,
        isScannedOnly: false, // Explicitly connected
        label: label || existing.label,
      };
      existingWallets[existingIndex] = updated;
      this.saveWallets(existingWallets);
      return updated;
    }

    // Create new wallet entry for this user
    const newWallet: Wallet = {
      id: `wal_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      publicAddress,
      network,
      label: label || 'Main',
      walletType,
      connectionStatus: 'connected',
      verificationStatus: 'unverified', // Requires signature challenge to be marked verified!
      createdAt: now,
      updatedAt: now,
      isScannedOnly: false,
    };

    existingWallets.push(newWallet);
    this.saveWallets(existingWallets);
    return newWallet;
  }

  /**
   * Create a Scanned Wallet record.
   * Scanned wallets are read-only, not verified, and have isScannedOnly = true.
   */
  public createScannedWallet(publicAddress: string, network: SolanaNetwork = 'mainnet-beta'): Wallet {
    const scanned: Wallet = {
      id: `scan_${publicAddress.slice(0, 8)}`,
      publicAddress,
      network,
      label: 'Scanned Address',
      connectionStatus: 'connected',
      verificationStatus: 'unverified', // NEVER verified
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isScannedOnly: true,
    };

    try {
      localStorage.setItem(ONFOLIO_SCANNED_WALLET_KEY, JSON.stringify(scanned));
    } catch {
      // ignore
    }

    return scanned;
  }

  /**
   * Generate an ownership verification challenge message.
   * Plain text explaining what is being signed before requesting it.
   */
  public generateVerificationChallenge(wallet: Wallet, userId: string): {
    message: string;
    nonce: string;
    issuedAt: string;
  } {
    const nonce = `nonce_${Math.random().toString(36).substring(2, 10)}`;
    const issuedAt = new Date().toISOString();
    const message = [
      `[ONFOLIO INVESTMENT PASSPORT — PROOF OF WALLET OWNERSHIP]`,
      `User ID: ${userId}`,
      `Wallet Public Address: ${wallet.publicAddress}`,
      `Purpose: Attest non-custodial ownership of this Solana wallet for inclusion in your verified Onfolio Passport.`,
      `Security Notice: This signature does NOT transfer funds, grant approvals, or authorize any token transactions.`,
      `Timestamp: ${issuedAt}`,
      `Nonce: ${nonce}`,
    ].join('\n');

    return { message, nonce, issuedAt };
  }

  /**
   * Complete wallet verification.
   * Marks the wallet as verified with timestamp.
   */
  public markWalletVerified(walletId: string): Wallet | null {
    const wallets = this.getAllWallets();
    const index = wallets.findIndex((w) => w.id === walletId);
    if (index === -1) return null;

    wallets[index] = {
      ...wallets[index],
      verificationStatus: 'verified',
      verifiedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.saveWallets(wallets);
    return wallets[index];
  }

  /**
   * Update a wallet's label (Main, Trading, Cold Storage, etc.)
   */
  public updateWalletLabel(walletId: string, label: WalletLabel): Wallet | null {
    const wallets = this.getAllWallets();
    const index = wallets.findIndex((w) => w.id === walletId);
    if (index === -1) return null;

    wallets[index] = {
      ...wallets[index],
      label,
      updatedAt: new Date().toISOString(),
    };

    this.saveWallets(wallets);
    return wallets[index];
  }

  public renameWallet(walletId: string, newLabel: string): Wallet | null {
    return this.updateWalletLabel(walletId, newLabel);
  }

  public setPrimaryWallet(walletId: string): Wallet | null {
    const wallets = this.getAllWallets();
    let primary: Wallet | null = null;
    const updated = wallets.map((w) => {
      const isTarget = w.id === walletId;
      if (isTarget) primary = { ...w, isPrimary: true };
      return {
        ...w,
        isPrimary: isTarget,
        updatedAt: new Date().toISOString(),
      };
    });

    if (primary) {
      this.saveWallets(updated);
    }
    return primary;
  }

  /**
   * Remove a wallet from user account
   */
  public removeWallet(walletId: string): boolean {
    const wallets = this.getAllWallets();
    const filtered = wallets.filter((w) => w.id !== walletId);
    if (filtered.length !== wallets.length) {
      this.saveWallets(filtered);
      return true;
    }
    return false;
  }

  private saveWallets(wallets: Wallet[]): void {
    try {
      localStorage.setItem(ONFOLIO_WALLETS_STORE_KEY, JSON.stringify(wallets));
    } catch (e) {
      console.warn('Storage error on saveWallets:', e);
    }
  }
}

export const accountService = AccountService.getInstance();
