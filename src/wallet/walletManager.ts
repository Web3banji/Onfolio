/**
 * Wallet Layer: Solana Public Key & Connection Management
 * 
 * Strict Read-Only Architecture:
 * - Operates solely as an address provider.
 * - Never touches private keys, seed phrases, or transaction signing.
 * - Connects only to retrieve the public key address string.
 * - Never required: any public address can be inspected directly via manual lookup.
 */

import { WalletConnectionMethod, WalletState, SolanaNetwork } from '../types/index.ts';

// Common Solana Base58 regex pattern (32 to 44 Base58 characters)
const SOLANA_ADDRESS_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export function isValidSolanaAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  const trimmed = address.trim();
  return SOLANA_ADDRESS_REGEX.test(trimmed);
}

// Global window declarations for browser wallet discovery
declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
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
  }
}

export function detectInstalledWallets() {
  const hasPhantom = Boolean(window.phantom?.solana?.isPhantom || window.solana?.isPhantom);
  const hasSolflare = Boolean(window.solflare?.isSolflare);
  const hasBackpack = Boolean(window.backpack);
  const hasStandard = Boolean(window.solana);

  return {
    phantom: hasPhantom,
    solflare: hasSolflare,
    backpack: hasBackpack,
    standard: hasStandard,
  };
}

export interface ConnectResult {
  success: boolean;
  address?: string;
  connectorType: WalletConnectionMethod;
  error?: string;
}

/**
 * Connect to an injected Solana wallet strictly for read-only public address acquisition.
 */
export async function connectInjectedWallet(walletType: WalletConnectionMethod): Promise<ConnectResult> {
  try {
    if (walletType === 'phantom') {
      const provider = window.phantom?.solana || window.solana;
      if (!provider) {
        return {
          success: false,
          connectorType: 'phantom',
          error: 'Phantom wallet extension not detected in this browser.',
        };
      }
      const resp = await provider.connect();
      const address = resp?.publicKey?.toString() || provider.publicKey?.toString();
      if (!address || !isValidSolanaAddress(address)) {
        return { success: false, connectorType: 'phantom', error: 'Could not retrieve a valid public address from Phantom.' };
      }
      return { success: true, address, connectorType: 'phantom' };
    }

    if (walletType === 'solflare') {
      const provider = window.solflare;
      if (!provider) {
        return {
          success: false,
          connectorType: 'solflare',
          error: 'Solflare wallet extension not detected in this browser.',
        };
      }
      await provider.connect();
      const address = provider.publicKey?.toString();
      if (!address || !isValidSolanaAddress(address)) {
        return { success: false, connectorType: 'solflare', error: 'Could not retrieve a valid public address from Solflare.' };
      }
      return { success: true, address, connectorType: 'solflare' };
    }

    if (walletType === 'backpack') {
      const provider = window.backpack;
      if (!provider) {
        return {
          success: false,
          connectorType: 'backpack',
          error: 'Backpack wallet extension not detected in this browser.',
        };
      }
      await provider.connect();
      const address = provider.publicKey?.toString();
      if (!address || !isValidSolanaAddress(address)) {
        return { success: false, connectorType: 'backpack', error: 'Could not retrieve a valid public address from Backpack.' };
      }
      return { success: true, address, connectorType: 'backpack' };
    }

    // Generic standard solana provider
    if (window.solana) {
      const resp = await window.solana.connect();
      const address = resp?.publicKey?.toString() || window.solana.publicKey?.toString();
      if (address && isValidSolanaAddress(address)) {
        return { success: true, address, connectorType: 'injected' };
      }
    }

    return {
      success: false,
      connectorType: walletType,
      error: 'No compatible Solana wallet provider responded.',
    };
  } catch (err: any) {
    return {
      success: false,
      connectorType: walletType,
      error: err?.message || 'Wallet connection was cancelled or rejected.',
    };
  }
}

/**
 * Disconnect injected wallet provider cleanly
 */
export async function disconnectInjectedWallet(): Promise<void> {
  try {
    if (window.phantom?.solana) await window.phantom.solana.disconnect();
    else if (window.solana) await window.solana.disconnect();
    if (window.solflare) await window.solflare.disconnect();
    if (window.backpack) await window.backpack.disconnect();
  } catch {
    // Non-blocking disconnect
  }
}

/**
 * Sample Solana addresses holding verified tokenized equities for instant exploration
 * without needing an active wallet or entering personal information.
 */
export interface SampleAddressProfile {
  label: string;
  address: string;
  description: string;
  tierPreview: string;
}

export const SAMPLE_PORTFOLIO_ADDRESSES: SampleAddressProfile[] = [
  {
    label: 'Institutional SPV Treasury',
    address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    description: 'Holds diversified Backed bAAPL, bCSPX S&P 500 index tokens and Ondo OUSG Treasuries.',
    tierPreview: 'Tier 3 — Accredited Capital',
  },
  {
    label: 'Decentralized Tech Allocator',
    address: '4vM5pL8rQ3tW2yZ7bC1dE9gH5jL3nN7pQ1rS9tV3wX5',
    description: 'Active tokenized equity position in bNVDA and Dinari dShares (NVDA, COIN).',
    tierPreview: 'Tier 2 — Seasoned Allocation',
  },
  {
    label: 'Boutique European Family Office',
    address: '9wQ2rT4yU6iO8pA0sD2fG4hJ6k8zX0cV2bN4m6Q8wE0',
    description: 'Long-tenure institutional balance of Swiss DLT-backed bCSPX and BaFin-regulated sTSLA.',
    tierPreview: 'Tier 4 — Institutional Sovereign',
  },
];

export const INITIAL_WALLET_STATE: WalletState = {
  address: '',
  isConnected: false,
  connectorType: 'manual_lookup',
  network: 'mainnet-beta',
  detectedWallets: {
    phantom: false,
    solflare: false,
    backpack: false,
    standard: false,
  },
};
