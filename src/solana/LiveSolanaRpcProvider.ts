/**
 * Live Solana JSON-RPC 2.0 Provider
 * 
 * Performs actual onchain queries against Solana RPC nodes without bundling heavy dependencies.
 * Queries SPL Token and Token-2022 token accounts by owner.
 */

import { ISolanaDataProvider, RawSolanaTokenAccount, RawSolanaSignature, SolanaProviderStatus } from './SolanaDataProvider.ts';

const SPL_TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const TOKEN_2022_PROGRAM_ID = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';

export class LiveSolanaRpcProvider implements ISolanaDataProvider {
  readonly providerType = 'live_solana_rpc' as const;
  readonly endpointUrl: string;

  constructor(rpcUrl?: string) {
    this.endpointUrl =
      rpcUrl ||
      import.meta.env.VITE_SOLANA_RPC_URL ||
      'https://api.mainnet-beta.solana.com';
  }

  private async rpcCall<T>(method: string, params: any[]): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const res = await fetch(this.endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: `onfolio-${Date.now()}`,
          method,
          params,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error('Solana RPC rate-limited (HTTP 429). Consider supplying a custom dedicated RPC endpoint.');
        }
        throw new Error(`Solana RPC HTTP error ${res.status}: ${res.statusText}`);
      }

      const json = await res.json();
      if (json.error) {
        throw new Error(`Solana RPC error [${json.error.code}]: ${json.error.message}`);
      }

      return json.result as T;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async fetchTokenAccounts(ownerAddress: string): Promise<RawSolanaTokenAccount[]> {
    const results: RawSolanaTokenAccount[] = [];

    // Query standard SPL Token accounts
    try {
      const splAccounts = await this.rpcCall<{ value: any[] }>('getTokenAccountsByOwner', [
        ownerAddress,
        { programId: SPL_TOKEN_PROGRAM_ID },
        { encoding: 'jsonParsed', commitment: 'confirmed' },
      ]);

      if (splAccounts?.value) {
        for (const item of splAccounts.value) {
          const parsed = item.account?.data?.parsed?.info;
          if (parsed) {
            results.push({
              pubkey: item.pubkey,
              mint: parsed.mint,
              owner: parsed.owner,
              amountRaw: parsed.tokenAmount?.amount || '0',
              decimals: parsed.tokenAmount?.decimals || 0,
              uiAmount: parsed.tokenAmount?.uiAmount || 0,
              tokenProgram: SPL_TOKEN_PROGRAM_ID,
            });
          }
        }
      }
    } catch (err: any) {
      console.warn('SPL token account query failed:', err.message);
    }

    // Query Token-2022 accounts
    try {
      const t22Accounts = await this.rpcCall<{ value: any[] }>('getTokenAccountsByOwner', [
        ownerAddress,
        { programId: TOKEN_2022_PROGRAM_ID },
        { encoding: 'jsonParsed', commitment: 'confirmed' },
      ]);

      if (t22Accounts?.value) {
        for (const item of t22Accounts.value) {
          const parsed = item.account?.data?.parsed?.info;
          if (parsed) {
            results.push({
              pubkey: item.pubkey,
              mint: parsed.mint,
              owner: parsed.owner,
              amountRaw: parsed.tokenAmount?.amount || '0',
              decimals: parsed.tokenAmount?.decimals || 0,
              uiAmount: parsed.tokenAmount?.uiAmount || 0,
              tokenProgram: TOKEN_2022_PROGRAM_ID,
            });
          }
        }
      }
    } catch (err: any) {
      console.warn('Token-2022 account query failed:', err.message);
    }

    return results;
  }

  async fetchTokenBalances(ownerAddress: string): Promise<RawSolanaTokenAccount[]> {
    return this.fetchTokenAccounts(ownerAddress);
  }

  async getAccountInfo(address: string) {
    try {
      const info = await this.rpcCall<{ value: any }>('getAccountInfo', [
        address,
        { encoding: 'jsonParsed', commitment: 'confirmed' },
      ]);
      if (!info?.value) return null;
      return {
        lamports: info.value.lamports || 0,
        owner: info.value.owner || '',
        executable: Boolean(info.value.executable),
      };
    } catch {
      return null;
    }
  }

  async getBalance(address: string): Promise<number> {
    try {
      const res = await this.rpcCall<{ value: number }>('getBalance', [
        address,
        { commitment: 'confirmed' },
      ]);
      return typeof res === 'number' ? res : res?.value || 0;
    } catch {
      return 0;
    }
  }

  async fetchMintInfo(mint: string) {
    try {
      const info = await this.rpcCall<{ value: any }>('getAccountInfo', [
        mint,
        { encoding: 'jsonParsed', commitment: 'confirmed' },
      ]);
      const parsed = info?.value?.data?.parsed?.info;
      if (!parsed) return null;
      return {
        mint,
        decimals: parsed.decimals || 0,
        supply: parsed.supply || '0',
      };
    } catch {
      return null;
    }
  }

  async fetchTokenMetadata(mint: string) {
    // Solana token metadata can be read from Token-2022 metadata pointer or fallback
    return {
      name: undefined,
      symbol: undefined,
      uri: undefined,
    };
  }

  async discoverTokenizedEquities(ownerAddress: string): Promise<RawSolanaTokenAccount[]> {
    const allAccounts = await this.fetchTokenAccounts(ownerAddress);
    return allAccounts.filter((acct) => acct.uiAmount > 0);
  }

  async fetchRecentSignatures(ownerAddress: string, limit = 15): Promise<RawSolanaSignature[]> {
    try {
      const signatures = await this.rpcCall<any[]>('getSignaturesForAddress', [
        ownerAddress,
        { limit },
      ]);

      return (signatures || []).map((sig) => ({
        signature: sig.signature,
        slot: sig.slot,
        err: sig.err,
        memo: sig.memo,
        blockTime: sig.blockTime,
        confirmationStatus: sig.confirmationStatus || 'finalized',
      }));
    } catch (err: any) {
      console.warn('Failed to fetch signatures from RPC:', err.message);
      return [];
    }
  }

  async getCurrentSlot(): Promise<number> {
    return await this.rpcCall<number>('getSlot', [{ commitment: 'confirmed' }]);
  }

  async checkHealth(): Promise<SolanaProviderStatus> {
    const start = performance.now();
    try {
      const slot = await this.getCurrentSlot();
      const latencyMs = Math.round(performance.now() - start);

      return {
        providerType: 'live_solana_rpc',
        endpoint: this.endpointUrl,
        isOnline: true,
        currentSlot: slot,
        latencyMs,
        isSyntheticData: false,
        message: `Connected to live Solana network at slot #${slot.toLocaleString()}`,
      };
    } catch (err: any) {
      return {
        providerType: 'live_solana_rpc',
        endpoint: this.endpointUrl,
        isOnline: false,
        currentSlot: 0,
        latencyMs: 0,
        isSyntheticData: false,
        message: err.message || 'Unable to connect to Solana RPC node.',
      };
    }
  }
}
