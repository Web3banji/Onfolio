/**
 * Onfolio - Type Definitions
 * Strict domain modeling for Onchain Investment Passports on Solana
 * 
 * CORE ARCHITECTURAL LAYERS:
 * 1. Authentication & User Account Layer
 * 2. Wallet Connection Layer (Scanned vs Connected)
 * 3. Solana Data Layer
 * 4. Asset Registry Layer
 * 5. Market Data Layer (Pyth & Fallback)
 * 6. Portfolio Calculation Layer
 * 7. Passport Layer (Core Product)
 * 8. Verification Layer
 * 9. Privacy & Sharing Layer
 * 10. UI/Design System Layer
 */

// ==========================================
// 1. AUTHENTICATION & USER ACCOUNT LAYER
// ==========================================

export interface User {
  id: string; // Unique Onfolio User ID (e.g. "usr_98a7f1")
  username: string; // Display handle (e.g. "investor_dan")
  email?: string;
  displayName: string;
  avatarUrl?: string;
  authProvider?: 'google' | 'email';
  hasCompletedOnboarding?: boolean;
  isEmailVerified?: boolean;
  createdAt: string;
  updatedAt: string;
  tier: string;
  isAccountActive: boolean;
}

export type OnboardingStatus =
  | 'idle'
  | 'authenticating'
  | 'authenticated'
  | 'connecting_wallet'
  | 'scanning_address'
  | 'loading'
  | 'success'
  | 'invalid_address'
  | 'wallet_rejected'
  | 'network_error'
  | 'empty_wallet'
  | 'no_supported_assets';

export type OnboardingProgressStage =
  | 'idle'
  | 'Checking wallet'
  | 'Finding assets'
  | 'Organizing portfolio';

export interface UserSession {
  sessionId: string;
  userId: string;
  token: string;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
}

// ==========================================
// 2. WALLET & MULTI-WALLET ARCHITECTURE
// ==========================================

export type SolanaNetwork = 'mainnet-beta' | 'devnet' | 'testnet' | 'localnet';

export type WalletConnectionMethod = 'injected' | 'phantom' | 'solflare' | 'backpack' | 'manual_lookup';

export type WalletLabel = 'Main' | 'Trading' | 'Cold Storage' | 'Trust Wallet' | 'Other' | string;

export type WalletConnectionStatus = 
  | 'disconnected' 
  | 'connecting' 
  | 'connected' 
  | 'loading_wallet' 
  | 'loaded' 
  | 'rejected' 
  | 'unavailable' 
  | 'error';

export type WalletVerificationStatus = 
  | 'unverified'     // Connected or scanned, but ownership signature not performed
  | 'verifying'      // Challenge in progress
  | 'verified'       // Cryptographic ownership signature confirmed
  | 'failed';

export interface WalletTokenBalance {
  pubkey: string;
  mint: string;
  owner: string;
  amountRaw: string;
  decimals: number;
  uiAmount: number;
  name: string;
  symbol: string;
  logoUri?: string;
  isTokenizedEquity: boolean;
  underlyingSecurity?: string;
  issuer?: string;
  tokenProgram: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' | 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
}

export interface WalletOnchainData {
  address: string;
  solBalanceLamports: number;
  solBalanceFormatted: number;
  tokenAccountsCount: number;
  tokens: WalletTokenBalance[];
  signatures: Array<{
    signature: string;
    slot: number;
    err: any | null;
    memo: string | null;
    blockTime: number | null;
    confirmationStatus: 'confirmed' | 'finalized' | 'processed';
  }>;
  fetchedAt: string;
  clusterSlot: number;
}

export interface WalletOperationResult {
  success: boolean;
  wallet?: Wallet;
  isDuplicate?: boolean;
  message?: string;
  error?: string;
  status?: WalletConnectionStatus;
}

export interface Wallet {
  id: string; // Unique internal wallet ID (e.g. "wal_01...")
  userId?: string; // Associated Onfolio user if connected to an account
  publicAddress: string; // Canonical Base58 public key string
  network: SolanaNetwork;
  label: WalletLabel;
  walletType?: WalletConnectionMethod;
  connectionStatus: WalletConnectionStatus;
  verificationStatus: WalletVerificationStatus;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
  isScannedOnly: boolean; // TRUE for read-only scanned address; FALSE for connected user wallet
  isPrimary?: boolean;
}

export interface WalletRelationship {
  id: string;
  userId: string;
  walletAddress: string;
  relationshipType: 'owner' | 'custodian' | 'delegate' | 'scanned';
  status: 'active' | 'revoked';
  label: WalletLabel;
  addedAt: string;
}

export interface WalletState {
  address: string; // Current active Base58 public key string
  isConnected: boolean;
  connectorType: WalletConnectionMethod;
  network: SolanaNetwork;
  label?: string;
  detectedWallets: {
    phantom: boolean;
    solflare: boolean;
    backpack: boolean;
    standard: boolean;
  };
}

// ==========================================
// 3. ASSET & REGISTRY LAYER
// ==========================================

export type IssuerRegulatoryType =
  | 'regulated_spv' // e.g. Backed Finance (Switzerland DLT Act, EU Prospectus)
  | 'institutional_fund' // e.g. Ondo OUSG (US Reg D / Sec-registered custodians)
  | 'licensed_broker_dealer' // e.g. Dinari, Swarm Markets (BaFin regulated)
  | 'decentralized_depository';

export interface Asset {
  mint: string; // Solana SPL or Token-2022 Mint Address
  name: string;
  symbol: string;
  decimals: number;
  tokenProgram: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' | 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
  logoUri?: string;
}

export interface TokenizedEquity extends Asset {
  underlyingTicker: string; // e.g., "AAPL", "NVDA", "SPY", "TSLA", "COIN", "SHV"
  underlyingAssetClass: 'Equity' | 'ETF' | 'Index' | 'Treasury/Fixed Income' | 'Commodity';
  issuer: string; // e.g. "Backed Finance", "Ondo Finance", "Dinari", "Swarm Markets"
  issuerType: IssuerRegulatoryType;
  isin?: string; // International Securities Identification Number
  cusip?: string;
  jurisdiction: string; // e.g., "Switzerland", "United States", "Germany"
  backingRatio: number; // 1.0 = 100% physically/custodially backed 1:1
  custodianName: string; // e.g. "Maerki Baumann & Co.", "Clearstream", "Securitize"
  proofOfReservesUrl?: string;
  isVerifiedSecuritiesIssuer: boolean;
  currentPriceUsd: number;
  priceChange24h?: number;
  lastUpdatedPrice: string;
}

export interface AssetRegistryEntry {
  mint: string; // Canonical SPL Mint Address
  tokenizedAsset: Asset;
  underlyingSecurity: string; // e.g., "Apple Inc. Common Stock"
  ticker: string; // e.g., "AAPL"
  issuer: string; // e.g., "Backed Finance"
  issuerType: IssuerRegulatoryType;
  marketDataIdentifier: string; // Internal standard e.g. "EQUITY/AAPL/USD"
  hasPythFeed: boolean;
  pythFeedId?: string; // Explicit 64-character Pyth Price Feed ID
  isin?: string;
  cusip?: string;
  jurisdiction: string;
  backingRatio: number;
  custodianName: string;
  proofOfReservesUrl?: string;
  tokenProgram: string;
}

// ==========================================
// 4. MARKET DATA LAYER
// ==========================================

export interface PriceSource {
  id: 'pyth_hermes' | 'fallback_nav' | 'custodian_oracle';
  name: string;
  type: 'oracle' | 'nav_benchmark' | 'custodian_proof';
  description?: string;
}

export interface MarketPrice {
  assetMint: string;
  ticker: string;
  price: number | null; // NULL if price is unavailable (never fabricate!)
  currency: 'USD' | 'EUR' | 'SOL';
  source: PriceSource;
  timestamp: string;
  freshness: 'live' | 'recent' | 'stale' | 'unavailable';
  availability: 'available' | 'unavailable';
  confidence?: number; // e.g. Pyth price confidence interval (±$0.02)
  statusText: string; // "Live (Pyth Hermes)" or "Price unavailable"
}

// ==========================================
// 5. HOLDING & TRANSACTION DATA MODEL
// ==========================================

export interface Holding {
  id: string; // Unique holding ID (often walletAddress + mint)
  tokenAccountAddress: string;
  walletAddress: string;
  asset: TokenizedEquity;
  amountRaw: string;
  amountFormatted: number;
  marketPrice: MarketPrice;
  marketData?: {
    provider: string;
    lastUpdated?: string;
  };
  valueUsd: number | null; // Null if price unavailable
  portfolioSharePercentage: number;
  costBasis?: number | null; // Never fabricate if unavailable
  firstAcquiredDate: string;
  holdingPeriodDays: number;
  isCompliantToken2022: boolean;
}

export type PortfolioHolding = Holding;

export interface Transaction {
  signature: string;
  slot: number;
  timestamp: string;
  type: 'BUY' | 'SELL' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'MINT' | 'REDEEM';
  assetMint: string;
  assetSymbol: string;
  underlyingTicker: string;
  amount: number;
  valueUsdEstimated: number | null;
  feeSol: number;
  status: 'confirmed' | 'finalized' | 'failed';
  explorerUrl: string;
}

// ==========================================
// 6. PORTFOLIO DATA MODEL
// ==========================================

export type MaturityRating = 'Explorer' | 'Accumulator' | 'Allocated' | 'Institutional Sovereign';

export interface Portfolio {
  walletAddress: string; // Or aggregated identifier for multi-wallet portfolios
  walletsIncluded: string[]; // List of wallet addresses aggregated in this portfolio
  totalValueUsd: number;
  hasUnavailablePrices: boolean;
  holdings: Holding[];
  equitiesCount: number;
  uniqueIssuersCount: number;
  transactions: Transaction[];
  firstOnchainDate: string | null;
  tenureDays: number;
  diversificationScore: number; // 0 to 100
  maturityRating: MaturityRating;
  dataSource: 'live_solana_rpc' | 'dev_adapter';
  queriedAt: string;
  rpcEndpointUsed: string;
}

export interface PortfolioSnapshot {
  snapshotId: string;
  timestamp: string;
  totalValueUsd: number;
  activePositionsCount: number;
  topHoldings: { symbol: string; ticker: string; percentage: number; valueUsd: number | null }[];
  issuerDistribution: { issuer: string; percentage: number }[];
  assetClassDistribution: { assetClass: string; percentage: number }[];
}

// ==========================================
// 7. PASSPORT DATA MODEL (MAIN PRODUCT)
// ==========================================

export type PassportTier =
  | 'Tier 1 — Pioneer Holder'
  | 'Tier 2 — Seasoned Allocation'
  | 'Tier 3 — Accredited Capital'
  | 'Tier 4 — Institutional Sovereign';

export interface PassportClaim {
  id: string;
  code: string;
  label: string;
  description: string;
  isSatisfied: boolean;
  evidence: string;
  cryptographicAssertion: string;
}

export interface PassportHolding {
  mint: string;
  symbol: string;
  underlyingTicker: string;
  underlyingSecurity: string;
  issuer: string;
  jurisdiction: string;
  custodianName: string;
  backingRatio: number;
  amountFormatted: number;
  valueUsd: number | null;
  isVerifiedOnchain: boolean;
  tokenAccountAddress: string;
  walletAddress: string;
}

export interface PassportMilestone {
  id: string;
  title: string;
  description: string;
  achievedAt: string;
  proofEvidence: string;
}

export interface Passport {
  passportId: string; // e.g., ONF-SOL-89F1-2026
  userId?: string;
  userDisplayName?: string;
  walletAddress: string; // Primary or aggregated root address
  connectedWallets: Wallet[]; // Full list of associated wallets (with verified status)
  issuedAt: string;
  expiresAt: string;
  tier: PassportTier;
  tierNumeric: number;
  totalEquityValueUsd: number;
  activeEquitiesCount: number;
  verifiedHoldings: PassportHolding[];
  jurisdictionsCount: number;
  jurisdictionsList: string[];
  issuersList: string[];
  issuerConcentration: { issuer: string; percentage: number }[];
  assetClassAllocation: { assetClass: string; percentage: number }[];
  tenureMonths: number;
  milestones: PassportMilestone[];
  claims: PassportClaim[];
  cryptographicFingerprint: string; // SHA-256 hash over verifiable passport state
  signatureAlgorithm: 'SHA-256-DIGEST' | 'ED25519-ONCHAIN';
  passportStatus: 'active' | 'provisional' | 'revoked';
  dataProvenance: {
    source: 'live_solana_rpc' | 'dev_adapter';
    blockSlot: number;
    verifiedTimestamp: string;
    isSyntheticData: boolean;
  };
}

// ==========================================
// 8. VERIFICATION DATA MODEL
// ==========================================

export interface VerificationRecord {
  recordId: string;
  passportId: string;
  targetAddress: string;
  digestHash: string;
  verifiedAt: string;
  status: 'valid' | 'mismatch' | 'invalid_format';
  verificationMethod: 'client_side_hash_attestation' | 'onchain_slot_verification';
  slotVerified: number;
  claimsSummary: {
    tier: string;
    valueBucket: string;
    claimsCount: number;
    allClaimsPassed: boolean;
  };
  provenance: {
    rpcEndpoint: string;
    verifiedAgainst: 'live_blockchain' | 'dev_sandbox';
  };
}

// ==========================================
// 9. PRIVACY & SETTINGS LAYER
// ==========================================

export type PrivacyMode = 'public_full' | 'obfuscate_amounts' | 'anonymous_tier_only' | 'anonymous_metrics' | 'selective_sharing';

export interface PrivacySettings {
  privacyMode: PrivacyMode;
  showWalletAddresses: boolean;
  allowPublicAudit: boolean;
  shareablePassportId?: string;
  hideAbsoluteBalances: boolean;
  percentageOnlyAllocation: boolean;
  hideWalletAddresses: boolean;
  hideTransactionHistory: boolean;
}

export interface UserPreferences {
  currency: 'USD' | 'EUR' | 'SOL';
  privacySettings: PrivacySettings;
  selectedNetwork: SolanaNetwork;
  customRpcUrl?: string;
  preferredWallet?: string;
  autoRefreshIntervalSeconds: number;
}
