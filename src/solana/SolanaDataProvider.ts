/**
 * Solana Data Layer: Provider Abstraction
 * 
 * Clean interface isolating blockchain communication so indexing providers
 * (e.g. Standard RPC, Helius DAS, Triton, QuickNode) can be swapped seamlessly
 * without touching UI or business logic.
 */

export interface RawSolanaTokenAccount {
  pubkey: string;
  mint: string;
  owner: string;
  amountRaw: string;
  decimals: number;
  uiAmount: number;
  tokenProgram: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' | 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
}

export interface RawSolanaSignature {
  signature: string;
  slot: number;
  err: any | null;
  memo: string | null;
  blockTime: number | null;
  confirmationStatus: 'confirmed' | 'finalized' | 'processed';
}

export interface SolanaAccountInfo {
  lamports: number;
  owner: string;
  executable: boolean;
}

export interface SolanaMintInfo {
  mint: string;
  decimals: number;
  supply: string;
}

export interface SolanaTokenMetadata {
  name?: string;
  symbol?: string;
  uri?: string;
}

export interface SolanaProviderStatus {
  providerType: 'live_solana_rpc' | 'dev_adapter';
  endpoint: string;
  isOnline: boolean;
  currentSlot: number;
  latencyMs: number;
  isSyntheticData: boolean;
  message: string;
}

export interface ISolanaDataProvider {
  readonly providerType: 'live_solana_rpc' | 'dev_adapter';
  readonly endpointUrl: string;

  /**
   * Wallet account lookup
   */
  getAccountInfo(address: string): Promise<SolanaAccountInfo | null>;

  /**
   * Fetch native SOL balance in lamports
   */
  getBalance?(address: string): Promise<number>;

  /**
   * Fetch all SPL and Token-2022 accounts owned by the given public address
   */
  fetchTokenAccounts(ownerAddress: string): Promise<RawSolanaTokenAccount[]>;

  /**
   * Fetch token balances for an owner
   */
  fetchTokenBalances(ownerAddress: string): Promise<RawSolanaTokenAccount[]>;

  /**
   * Fetch token mint info
   */
  fetchMintInfo(mint: string): Promise<SolanaMintInfo | null>;

  /**
   * Fetch token metadata
   */
  fetchTokenMetadata(mint: string): Promise<SolanaTokenMetadata | null>;

  /**
   * Fetch recent transaction signatures / activity history
   */
  fetchRecentSignatures(ownerAddress: string, limit?: number): Promise<RawSolanaSignature[]>;

  /**
   * Discover relevant tokenized-equity accounts specifically
   */
  discoverTokenizedEquities(ownerAddress: string): Promise<RawSolanaTokenAccount[]>;

  /**
   * Get current cluster block slot
   */
  getCurrentSlot(): Promise<number>;

  /**
   * Health check and connectivity status
   */
  checkHealth(): Promise<SolanaProviderStatus>;
}
