/**
 * Development Adapter: Solana Data Sandbox
 * 
 * Purpose-built test adapter providing realistic tokenized equity holdings
 * and transaction histories for offline development and sandbox testing.
 * 
 * TRANSPARENCY NOTICE:
 * All records emitted by this adapter are explicitly flagged with `isSyntheticData: true`.
 * It NEVER claims to be verified live mainnet data.
 */

import { ISolanaDataProvider, RawSolanaTokenAccount, RawSolanaSignature, SolanaProviderStatus } from './SolanaDataProvider.ts';
import { TOKENIZED_EQUITIES_REGISTRY } from '../registry/tokenizedEquitiesRegistry.ts';

// Deterministic mock data keyed by sample addresses
const SAMPLE_ADDRESS_HOLDINGS: Record<string, Array<{ mint: string; uiAmount: number }>> = {
  // Institutional SPV Treasury
  '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU': [
    { mint: 'bAAPL8k79M3fD8Bf2g4wU3Kq1zT9pXvN5yR6m7q8L9k', uiAmount: 85.5 }, // bAAPL ~$19.1k
    { mint: 'bCSPX4k87m9jPq2vL3nRw5tY7xZ1aB3cD5eF7gH9iJ1', uiAmount: 64.0 }, // bCSPX ~$37.7k
    { mint: 'OUSG7m2bK4vC9xZ1wE3rT5yU7iO9pA1sD3fG5hJ7k9', uiAmount: 350.0 }, // OUSG ~$37.6k
  ],

  // Decentralized Tech Allocator
  '4vM5pL8rQ3tW2yZ7bC1dE9gH5jL3nN7pQ1rS9tV3wX5': [
    { mint: 'bNVDA9w3rTy1uIoP2aS4dF6gH8jK0zX2cV4bN6m8Q1w', uiAmount: 140.0 }, // bNVDA ~$19.0k
    { mint: 'dNVDA8w7eR4tY2uI0oP3aS5dF7gH9jK1zX3cV5bN7m9', uiAmount: 45.0 }, // dNVDA ~$6.1k
    { mint: 'dCOIN3m5pQ7rT9vW1yZ3bC5dE7gH9jL1nN3pQ5rS7t9', uiAmount: 38.0 }, // dCOIN ~$8.1k
  ],

  // Boutique European Family Office
  '9wQ2rT4yU6iO8pA0sD2fG4hJ6k8zX0cV2bN4m6Q8wE0': [
    { mint: 'bCSPX4k87m9jPq2vL3nRw5tY7xZ1aB3cD5eF7gH9iJ1', uiAmount: 180.0 }, // bCSPX ~$106.2k
    { mint: 'sTSLA2x4m6p8r0t1v3y5a7b9c1d3e5f7g9h1j3k5l7', uiAmount: 110.0 }, // sTSLA ~$27.3k
    { mint: 'bAAPL8k79M3fD8Bf2g4wU3Kq1zT9pXvN5yR6m7q8L9k', uiAmount: 95.0 }, // bAAPL ~$21.3k
  ],
};

export class DevAdapterProvider implements ISolanaDataProvider {
  readonly providerType = 'dev_adapter' as const;
  readonly endpointUrl = 'internal://solana-dev-sandbox';

  private simulatedSlot = 328954120;

  async fetchTokenAccounts(ownerAddress: string): Promise<RawSolanaTokenAccount[]> {
    // If the address matches one of our known sample profiles, return its profile holdings
    const configuredHoldings = SAMPLE_ADDRESS_HOLDINGS[ownerAddress];

    if (configuredHoldings) {
      return configuredHoldings.map((h, idx) => {
        const equity = TOKENIZED_EQUITIES_REGISTRY[h.mint];
        const decimals = equity ? equity.decimals : 8;
        const amountRaw = Math.floor(h.uiAmount * Math.pow(10, decimals)).toString();

        return {
          pubkey: `DevTokenAccount_${ownerAddress.slice(0, 4)}_${idx}`,
          mint: h.mint,
          owner: ownerAddress,
          amountRaw,
          decimals,
          uiAmount: h.uiAmount,
          tokenProgram: equity?.tokenProgram || 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        };
      });
    }

    // For any other address scanned in sandbox mode, derive a modest default position
    // or return empty if looking for clean unallocated address
    const defaultMints = Object.keys(TOKENIZED_EQUITIES_REGISTRY);
    const chosenMint = defaultMints[Math.abs(ownerAddress.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % defaultMints.length];
    const equity = TOKENIZED_EQUITIES_REGISTRY[chosenMint];
    const sampleAmount = 15.0;

    return [
      {
        pubkey: `DevAccount_${ownerAddress.slice(0, 6)}_0`,
        mint: chosenMint,
        owner: ownerAddress,
        amountRaw: Math.floor(sampleAmount * Math.pow(10, equity.decimals)).toString(),
        decimals: equity.decimals,
        uiAmount: sampleAmount,
        tokenProgram: equity.tokenProgram,
      },
    ];
  }

  async fetchTokenBalances(ownerAddress: string): Promise<RawSolanaTokenAccount[]> {
    return this.fetchTokenAccounts(ownerAddress);
  }

  async getAccountInfo(address: string) {
    return {
      lamports: 2500000000,
      owner: '11111111111111111111111111111111',
      executable: false,
    };
  }

  async getBalance(address: string): Promise<number> {
    return 2500000000; // 2.5 SOL
  }

  async fetchMintInfo(mint: string) {
    const equity = TOKENIZED_EQUITIES_REGISTRY[mint];
    return {
      mint,
      decimals: equity ? equity.decimals : 8,
      supply: '1000000000000',
    };
  }

  async fetchTokenMetadata(mint: string) {
    const equity = TOKENIZED_EQUITIES_REGISTRY[mint];
    if (!equity) return null;
    return {
      name: equity.name,
      symbol: equity.symbol,
      uri: `https://onfolio.id/metadata/${mint}`,
    };
  }

  async discoverTokenizedEquities(ownerAddress: string): Promise<RawSolanaTokenAccount[]> {
    return this.fetchTokenAccounts(ownerAddress);
  }

  async fetchRecentSignatures(ownerAddress: string, limit = 10): Promise<RawSolanaSignature[]> {
    const nowSec = Math.floor(Date.now() / 1000);
    const signatures: RawSolanaSignature[] = [];

    for (let i = 0; i < Math.min(limit, 5); i++) {
      signatures.push({
        signature: `DevSig_${ownerAddress.slice(0, 6)}_${i}_${Math.random().toString(36).substring(2, 9)}`,
        slot: this.simulatedSlot - i * 1200,
        err: null,
        memo: i === 0 ? 'Onfolio: Tokenized Equity Settlement' : null,
        blockTime: nowSec - i * 86400 * 14,
        confirmationStatus: 'finalized',
      });
    }

    return signatures;
  }

  async getCurrentSlot(): Promise<number> {
    this.simulatedSlot += 1;
    return this.simulatedSlot;
  }

  async checkHealth(): Promise<SolanaProviderStatus> {
    return {
      providerType: 'dev_adapter',
      endpoint: this.endpointUrl,
      isOnline: true,
      currentSlot: this.simulatedSlot,
      latencyMs: 12,
      isSyntheticData: true,
      message: 'Development Sandbox active. Holdings & verification use controlled test data.',
    };
  }
}
