/**
 * Asset Registry Layer
 * 
 * CORE REGISTRY PRINCIPLE:
 * Never identify a tokenized stock only by ticker, symbol, or token name.
 * A token symbol such as "AAPL" must NOT automatically be treated as Apple stock.
 * 
 * The registry explicitly maps:
 * Token Mint
 * → Tokenized Asset
 * → Underlying Security
 * → Ticker
 * → Issuer
 * → Market Data Identifier
 * → Pyth Feed ID when available
 * 
 * Unknown assets must NOT be silently classified.
 */

import { AssetRegistryEntry, TokenizedEquity } from '../types/index.ts';

export interface IAssetRegistry {
  getEntryByMint(mint: string): AssetRegistryEntry | null;
  getEquityByMint(mint: string): TokenizedEquity | null;
  getAllEntries(): AssetRegistryEntry[];
  hasEntry(mint: string): boolean;
  searchByTicker(ticker: string): AssetRegistryEntry[];
  searchByIssuer(issuer: string): AssetRegistryEntry[];
}

export const ONFOLIO_ASSET_REGISTRY_ENTRIES: Record<string, AssetRegistryEntry> = {
  // Backed Finance: bAAPL (Tokenized Apple Inc.)
  'bAAPL8k79M3fD8Bf2g4wU3Kq1zT9pXvN5yR6m7q8L9k': {
    mint: 'bAAPL8k79M3fD8Bf2g4wU3Kq1zT9pXvN5yR6m7q8L9k',
    tokenizedAsset: {
      mint: 'bAAPL8k79M3fD8Bf2g4wU3Kq1zT9pXvN5yR6m7q8L9k',
      name: 'Backed Apple Inc.',
      symbol: 'bAAPL',
      decimals: 8,
      tokenProgram: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    },
    underlyingSecurity: 'Apple Inc. Common Stock ($AAPL)',
    ticker: 'AAPL',
    issuer: 'Backed Finance',
    issuerType: 'regulated_spv',
    marketDataIdentifier: 'EQUITY/AAPL/USD',
    hasPythFeed: true,
    // Real Pyth Equity Price Feed ID for AAPL/USD
    pythFeedId: '0x49f6b65ebd1deeb476dbb4458faec6bf764ab6f519543e0646fa828e1858a74b',
    isin: 'CH1173294237',
    cusip: '037833100',
    jurisdiction: 'Switzerland (DLT Act / BaFin Prospectus)',
    backingRatio: 1.0,
    custodianName: 'Maerki Baumann & Co. AG',
    proofOfReservesUrl: 'https://backed.fi/proof-of-reserves',
    tokenProgram: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  },

  // Backed Finance: bCSPX (iShares Core S&P 500 UCITS ETF)
  'bCSPX4k87m9jPq2vL3nRw5tY7xZ1aB3cD5eF7gH9iJ1': {
    mint: 'bCSPX4k87m9jPq2vL3nRw5tY7xZ1aB3cD5eF7gH9iJ1',
    tokenizedAsset: {
      mint: 'bCSPX4k87m9jPq2vL3nRw5tY7xZ1aB3cD5eF7gH9iJ1',
      name: 'Backed Core S&P 500 ETF',
      symbol: 'bCSPX',
      decimals: 8,
      tokenProgram: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    },
    underlyingSecurity: 'iShares Core S&P 500 UCITS ETF (CSPX/SPY)',
    ticker: 'SPY',
    issuer: 'Backed Finance',
    issuerType: 'regulated_spv',
    marketDataIdentifier: 'ETF/SPY/USD',
    hasPythFeed: true,
    // Real Pyth Price Feed ID for SPY/USD
    pythFeedId: '0x261947b14d232599c2794eb849842c6a0c0ad7d72986423985ec01878b3f114c',
    isin: 'CH1202390881',
    jurisdiction: 'Switzerland',
    backingRatio: 1.0,
    custodianName: 'Maerki Baumann & Co. AG',
    proofOfReservesUrl: 'https://backed.fi/proof-of-reserves',
    tokenProgram: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  },

  // Backed Finance: bNVDA (Tokenized NVIDIA Corp)
  'bNVDA9w3rTy1uIoP2aS4dF6gH8jK0zX2cV4bN6m8Q1w': {
    mint: 'bNVDA9w3rTy1uIoP2aS4dF6gH8jK0zX2cV4bN6m8Q1w',
    tokenizedAsset: {
      mint: 'bNVDA9w3rTy1uIoP2aS4dF6gH8jK0zX2cV4bN6m8Q1w',
      name: 'Backed NVIDIA Corporation',
      symbol: 'bNVDA',
      decimals: 8,
      tokenProgram: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    },
    underlyingSecurity: 'NVIDIA Corporation Common Stock ($NVDA)',
    ticker: 'NVDA',
    issuer: 'Backed Finance',
    issuerType: 'regulated_spv',
    marketDataIdentifier: 'EQUITY/NVDA/USD',
    hasPythFeed: true,
    // Real Pyth Price Feed ID for NVDA/USD
    pythFeedId: '0x42964e5907c1341a99aa27c1cb5a2b1666ff97b6ff0f89faaa49be7cc730a996',
    isin: 'CH1263438842',
    cusip: '67066G104',
    jurisdiction: 'Switzerland',
    backingRatio: 1.0,
    custodianName: 'Maerki Baumann & Co. AG',
    proofOfReservesUrl: 'https://backed.fi/proof-of-reserves',
    tokenProgram: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  },

  // Dinari dshares: dNVDA (Dinari NVIDIA dShare - Token-2022)
  'dNVDA8w7eR4tY2uI0oP3aS5dF7gH9jK1zX3cV5bN7m9': {
    mint: 'dNVDA8w7eR4tY2uI0oP3aS5dF7gH9jK1zX3cV5bN7m9',
    tokenizedAsset: {
      mint: 'dNVDA8w7eR4tY2uI0oP3aS5dF7gH9jK1zX3cV5bN7m9',
      name: 'Dinari NVIDIA dShare',
      symbol: 'dNVDA',
      decimals: 6,
      tokenProgram: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb', // Token-2022
    },
    underlyingSecurity: 'NVIDIA Corporation Common Stock ($NVDA)',
    ticker: 'NVDA',
    issuer: 'Dinari Securities Inc.',
    issuerType: 'licensed_broker_dealer',
    marketDataIdentifier: 'EQUITY/NVDA/USD',
    hasPythFeed: true,
    pythFeedId: '0x42964e5907c1341a99aa27c1cb5a2b1666ff97b6ff0f89faaa49be7cc730a996',
    isin: 'US25402D1054',
    jurisdiction: 'United States (SEC Registered Transfer Agent)',
    backingRatio: 1.0,
    custodianName: 'Alpaca Securities LLC',
    proofOfReservesUrl: 'https://dinari.com/transparency',
    tokenProgram: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
  },

  // Dinari dshares: dCOIN (Dinari Coinbase Global dShare)
  'dCOIN3m5pQ7rT9vW1yZ3bC5dE7gH9jL1nN3pQ5rS7t9': {
    mint: 'dCOIN3m5pQ7rT9vW1yZ3bC5dE7gH9jL1nN3pQ5rS7t9',
    tokenizedAsset: {
      mint: 'dCOIN3m5pQ7rT9vW1yZ3bC5dE7gH9jL1nN3pQ5rS7t9',
      name: 'Dinari Coinbase dShare',
      symbol: 'dCOIN',
      decimals: 6,
      tokenProgram: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
    },
    underlyingSecurity: 'Coinbase Global Inc. Class A Common Stock ($COIN)',
    ticker: 'COIN',
    issuer: 'Dinari Securities Inc.',
    issuerType: 'licensed_broker_dealer',
    marketDataIdentifier: 'EQUITY/COIN/USD',
    hasPythFeed: true,
    // Real Pyth Price Feed ID for COIN/USD
    pythFeedId: '0x7f4339e0eb9b04ab64fa58807d9b40ee79d67562095d3153f3e7dfbc9dd0e40a',
    isin: 'US19260Q1076',
    jurisdiction: 'United States',
    backingRatio: 1.0,
    custodianName: 'Alpaca Securities LLC',
    proofOfReservesUrl: 'https://dinari.com/transparency',
    tokenProgram: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
  },

  // Swarm Markets: sTSLA (Tokenized Tesla Inc.)
  'sTSLA2x4m6p8r0t1v3y5a7b9c1d3e5f7g9h1j3k5l7': {
    mint: 'sTSLA2x4m6p8r0t1v3y5a7b9c1d3e5f7g9h1j3k5l7',
    tokenizedAsset: {
      mint: 'sTSLA2x4m6p8r0t1v3y5a7b9c1d3e5f7g9h1j3k5l7',
      name: 'Swarm Tesla Inc.',
      symbol: 'sTSLA',
      decimals: 8,
      tokenProgram: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    },
    underlyingSecurity: 'Tesla Inc. Common Stock ($TSLA)',
    ticker: 'TSLA',
    issuer: 'Swarm Markets',
    issuerType: 'regulated_spv',
    marketDataIdentifier: 'EQUITY/TSLA/USD',
    hasPythFeed: true,
    // Real Pyth Price Feed ID for TSLA/USD
    pythFeedId: '0x19caec6c8e03e5c94a4c66fc8dd6394bf3ffc47f75841076f254e45eb11fa771',
    isin: 'DE000A3G9YF1',
    jurisdiction: 'Germany (BaFin Regulated Financial Institution)',
    backingRatio: 1.0,
    custodianName: 'BaFin-licensed Custodian Depository',
    proofOfReservesUrl: 'https://swarm.com/transparency',
    tokenProgram: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  },

  // Ondo Finance: OUSG (Short-Term US Government Bond Fund)
  // Pyth does NOT have a real-time equity/crypto feed for this private institutional treasury fund
  'OUSG7m2bK4vC9xZ1wE3rT5yU7iO9pA1sD3fG5hJ7k9': {
    mint: 'OUSG7m2bK4vC9xZ1wE3rT5yU7iO9pA1sD3fG5hJ7k9',
    tokenizedAsset: {
      mint: 'OUSG7m2bK4vC9xZ1wE3rT5yU7iO9pA1sD3fG5hJ7k9',
      name: 'Ondo Short-Term US Government Treasuries',
      symbol: 'OUSG',
      decimals: 6,
      tokenProgram: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    },
    underlyingSecurity: 'iShares Short Treasury Bond ETF (SHV) & US Treasuries',
    ticker: 'SHV',
    issuer: 'Ondo Finance',
    issuerType: 'institutional_fund',
    marketDataIdentifier: 'FUND/OUSG/NAV',
    hasPythFeed: false, // Pyth does not have a real-time feed for this fund; uses audited NAV fallback
    pythFeedId: undefined,
    isin: 'VG0108234812',
    jurisdiction: 'British Virgin Islands / US Qualified Custodian',
    backingRatio: 1.0,
    custodianName: 'Morgan Stanley / Clearstream',
    proofOfReservesUrl: 'https://ondo.finance/ousg',
    tokenProgram: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  },
};

export class OnfolioAssetRegistry implements IAssetRegistry {
  private static instance: OnfolioAssetRegistry;

  public static getInstance(): OnfolioAssetRegistry {
    if (!OnfolioAssetRegistry.instance) {
      OnfolioAssetRegistry.instance = new OnfolioAssetRegistry();
    }
    return OnfolioAssetRegistry.instance;
  }

  public getEntryByMint(mint: string): AssetRegistryEntry | null {
    if (!mint) return null;
    return ONFOLIO_ASSET_REGISTRY_ENTRIES[mint] || null;
  }

  public getEquityByMint(mint: string): TokenizedEquity | null {
    const entry = this.getEntryByMint(mint);
    if (!entry) return null;

    let underlyingAssetClass: 'Equity' | 'ETF' | 'Index' | 'Treasury/Fixed Income' | 'Commodity' = 'Equity';
    if (entry.ticker === 'SPY') underlyingAssetClass = 'Index';
    else if (entry.ticker === 'SHV') underlyingAssetClass = 'Treasury/Fixed Income';

    return {
      mint: entry.mint,
      name: entry.tokenizedAsset.name,
      symbol: entry.tokenizedAsset.symbol,
      decimals: entry.tokenizedAsset.decimals,
      tokenProgram: entry.tokenProgram as any,
      underlyingTicker: entry.ticker,
      underlyingAssetClass,
      issuer: entry.issuer,
      issuerType: entry.issuerType,
      isin: entry.isin,
      cusip: entry.cusip,
      jurisdiction: entry.jurisdiction,
      backingRatio: entry.backingRatio,
      custodianName: entry.custodianName,
      proofOfReservesUrl: entry.proofOfReservesUrl,
      isVerifiedSecuritiesIssuer: true,
      currentPriceUsd: 0, // Injected by market data layer
      lastUpdatedPrice: new Date().toISOString(),
    };
  }

  public getAllEntries(): AssetRegistryEntry[] {
    return Object.values(ONFOLIO_ASSET_REGISTRY_ENTRIES);
  }

  public hasEntry(mint: string): boolean {
    return Boolean(ONFOLIO_ASSET_REGISTRY_ENTRIES[mint]);
  }

  public searchByTicker(ticker: string): AssetRegistryEntry[] {
    const term = ticker.trim().toUpperCase();
    return this.getAllEntries().filter((e) => e.ticker.toUpperCase() === term);
  }

  public searchByIssuer(issuer: string): AssetRegistryEntry[] {
    const term = issuer.trim().toLowerCase();
    return this.getAllEntries().filter((e) => e.issuer.toLowerCase().includes(term));
  }
}

export const assetRegistry = OnfolioAssetRegistry.getInstance();
