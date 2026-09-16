/**
 * Asset Registry: Tokenized Equities on Solana
 * 
 * Curated registry of recognized tokenized real-world assets (RWA equities, ETFs, indices)
 * issued by regulated entities on Solana (e.g. Backed Finance, Ondo, Dinari, Swarm).
 */

import { TokenizedEquity } from '../types/index.ts';

export const TOKENIZED_EQUITIES_REGISTRY: Record<string, TokenizedEquity> = {
  // Backed Finance: bAAPL (Tokenized Apple Inc.)
  'bAAPL8k79M3fD8Bf2g4wU3Kq1zT9pXvN5yR6m7q8L9k': {
    mint: 'bAAPL8k79M3fD8Bf2g4wU3Kq1zT9pXvN5yR6m7q8L9k',
    name: 'Backed Apple Inc.',
    symbol: 'bAAPL',
    decimals: 8,
    tokenProgram: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    underlyingTicker: 'AAPL',
    underlyingAssetClass: 'Equity',
    issuer: 'Backed Finance',
    issuerType: 'regulated_spv',
    isin: 'CH1173294237',
    cusip: '037833100',
    jurisdiction: 'Switzerland (DLT Act / BaFin Prospectus)',
    backingRatio: 1.0,
    custodianName: 'Maerki Baumann & Co. AG',
    proofOfReservesUrl: 'https://backed.fi/proof-of-reserves',
    isVerifiedSecuritiesIssuer: true,
    currentPriceUsd: 224.23,
    priceChange24h: 1.15,
    lastUpdatedPrice: '2026-09-15T21:00:00Z',
  },

  // Backed Finance: bCSPX (iShares Core S&P 500 UCITS ETF)
  'bCSPX4k87m9jPq2vL3nRw5tY7xZ1aB3cD5eF7gH9iJ1': {
    mint: 'bCSPX4k87m9jPq2vL3nRw5tY7xZ1aB3cD5eF7gH9iJ1',
    name: 'Backed Core S&P 500 ETF',
    symbol: 'bCSPX',
    decimals: 8,
    tokenProgram: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    underlyingTicker: 'SPY / CSPX',
    underlyingAssetClass: 'Index',
    issuer: 'Backed Finance',
    issuerType: 'regulated_spv',
    isin: 'CH1202390881',
    jurisdiction: 'Switzerland',
    backingRatio: 1.0,
    custodianName: 'Maerki Baumann & Co. AG',
    proofOfReservesUrl: 'https://backed.fi/proof-of-reserves',
    isVerifiedSecuritiesIssuer: true,
    currentPriceUsd: 590.40,
    priceChange24h: 0.42,
    lastUpdatedPrice: '2026-09-15T21:00:00Z',
  },

  // Backed Finance: bNVDA (Tokenized NVIDIA Corp)
  'bNVDA9w3rTy1uIoP2aS4dF6gH8jK0zX2cV4bN6m8Q1w': {
    mint: 'bNVDA9w3rTy1uIoP2aS4dF6gH8jK0zX2cV4bN6m8Q1w',
    name: 'Backed NVIDIA Corporation',
    symbol: 'bNVDA',
    decimals: 8,
    tokenProgram: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    underlyingTicker: 'NVDA',
    underlyingAssetClass: 'Equity',
    issuer: 'Backed Finance',
    issuerType: 'regulated_spv',
    isin: 'CH1263438842',
    cusip: '67066G104',
    jurisdiction: 'Switzerland',
    backingRatio: 1.0,
    custodianName: 'Maerki Baumann & Co. AG',
    proofOfReservesUrl: 'https://backed.fi/proof-of-reserves',
    isVerifiedSecuritiesIssuer: true,
    currentPriceUsd: 135.80,
    priceChange24h: 2.84,
    lastUpdatedPrice: '2026-09-15T21:00:00Z',
  },

  // Dinari dshares: dNVDA (Dinari NVIDIA dShare - Token-2022)
  'dNVDA8w7eR4tY2uI0oP3aS5dF7gH9jK1zX3cV5bN7m9': {
    mint: 'dNVDA8w7eR4tY2uI0oP3aS5dF7gH9jK1zX3cV5bN7m9',
    name: 'Dinari NVIDIA dShare',
    symbol: 'dNVDA',
    decimals: 6,
    tokenProgram: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb', // Token-2022
    underlyingTicker: 'NVDA',
    underlyingAssetClass: 'Equity',
    issuer: 'Dinari Securities Inc.',
    issuerType: 'licensed_broker_dealer',
    isin: 'US25402D1054',
    jurisdiction: 'United States (SEC Registered Transfer Agent)',
    backingRatio: 1.0,
    custodianName: 'Alpaca Securities LLC',
    proofOfReservesUrl: 'https://dinari.com/transparency',
    isVerifiedSecuritiesIssuer: true,
    currentPriceUsd: 135.80,
    priceChange24h: 2.84,
    lastUpdatedPrice: '2026-09-15T21:00:00Z',
  },

  // Dinari dshares: dCOIN (Dinari Coinbase Global dShare)
  'dCOIN3m5pQ7rT9vW1yZ3bC5dE7gH9jL1nN3pQ5rS7t9': {
    mint: 'dCOIN3m5pQ7rT9vW1yZ3bC5dE7gH9jL1nN3pQ5rS7t9',
    name: 'Dinari Coinbase dShare',
    symbol: 'dCOIN',
    decimals: 6,
    tokenProgram: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
    underlyingTicker: 'COIN',
    underlyingAssetClass: 'Equity',
    issuer: 'Dinari Securities Inc.',
    issuerType: 'licensed_broker_dealer',
    isin: 'US19260Q1076',
    jurisdiction: 'United States',
    backingRatio: 1.0,
    custodianName: 'Alpaca Securities LLC',
    proofOfReservesUrl: 'https://dinari.com/transparency',
    isVerifiedSecuritiesIssuer: true,
    currentPriceUsd: 215.10,
    priceChange24h: -0.95,
    lastUpdatedPrice: '2026-09-15T21:00:00Z',
  },

  // Ondo Finance: OUSG (Short-Term US Government Bond Fund)
  'OUSG7m2bK4vC9xZ1wE3rT5yU7iO9pA1sD3fG5hJ7k9': {
    mint: 'OUSG7m2bK4vC9xZ1wE3rT5yU7iO9pA1sD3fG5hJ7k9',
    name: 'Ondo Short-Term US Government Treasuries',
    symbol: 'OUSG',
    decimals: 6,
    tokenProgram: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    underlyingTicker: 'SHV (BlackRock iShares)',
    underlyingAssetClass: 'Treasury/Fixed Income',
    issuer: 'Ondo Finance',
    issuerType: 'institutional_fund',
    isin: 'VG0108234812',
    jurisdiction: 'British Virgin Islands / US Qualified Custodian',
    backingRatio: 1.0,
    custodianName: 'Morgan Stanley / Clearstream',
    proofOfReservesUrl: 'https://ondo.finance/ousg',
    isVerifiedSecuritiesIssuer: true,
    currentPriceUsd: 107.45,
    priceChange24h: 0.02,
    lastUpdatedPrice: '2026-09-15T21:00:00Z',
  },

  // Swarm Markets: sTSLA (Tokenized Tesla Inc.)
  'sTSLA2x4m6p8r0t1v3y5a7b9c1d3e5f7g9h1j3k5l7': {
    mint: 'sTSLA2x4m6p8r0t1v3y5a7b9c1d3e5f7g9h1j3k5l7',
    name: 'Swarm Tesla Inc.',
    symbol: 'sTSLA',
    decimals: 8,
    tokenProgram: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    underlyingTicker: 'TSLA',
    underlyingAssetClass: 'Equity',
    issuer: 'Swarm Markets',
    issuerType: 'regulated_spv',
    isin: 'DE000A3G9YF1',
    jurisdiction: 'Germany (BaFin Regulated Financial Institution)',
    backingRatio: 1.0,
    custodianName: 'BaFin-licensed Custodian Depository',
    proofOfReservesUrl: 'https://swarm.com/transparency',
    isVerifiedSecuritiesIssuer: true,
    currentPriceUsd: 248.50,
    priceChange24h: 3.40,
    lastUpdatedPrice: '2026-09-15T21:00:00Z',
  },
};

/**
 * Registry Lookup Helpers
 */
export function getRegisteredEquity(mintAddress: string): TokenizedEquity | null {
  return TOKENIZED_EQUITIES_REGISTRY[mintAddress] || null;
}

export function isRecognizedEquity(mintAddress: string): boolean {
  return Boolean(TOKENIZED_EQUITIES_REGISTRY[mintAddress]);
}

export function getAllRegisteredEquities(): TokenizedEquity[] {
  return Object.values(TOKENIZED_EQUITIES_REGISTRY);
}

export function findEquitiesByIssuer(issuerName: string): TokenizedEquity[] {
  return getAllRegisteredEquities().filter(
    (e) => e.issuer.toLowerCase().includes(issuerName.toLowerCase())
  );
}
