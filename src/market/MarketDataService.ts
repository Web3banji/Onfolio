/**
 * Market Data Layer: Market Data Service
 * 
 * Orchestrator that coordinates Pyth Network and Fallback NAV providers.
 * 
 * CORE RULES:
 * - Pyth is the preferred market-data source when an appropriate Pyth feed exists.
 * - The fallback provider is independently configurable.
 * - Do not make the entire application dependent on Pyth.
 * - Do not assume that every tokenized equity has a Pyth feed.
 * - Do not guess Pyth feed IDs.
 * - If neither Pyth nor fallback can provide a reliable price:
 *   Mark availability as 'unavailable' and display 'Price unavailable'.
 *   NEVER fabricate a price.
 */

import { IMarketDataProvider } from './MarketDataProvider.ts';
import { PythMarketDataProvider } from './PythMarketDataProvider.ts';
import { FallbackMarketDataProvider } from './FallbackMarketDataProvider.ts';
import { AssetRegistryEntry, MarketPrice, PriceSource } from '../types/index.ts';

export class MarketDataService {
  private static instance: MarketDataService;
  private pythProvider: IMarketDataProvider;
  private fallbackProvider: IMarketDataProvider;

  // In-memory cache to reduce redundant calls within short intervals
  private cache: Map<string, { price: MarketPrice; fetchedAt: number }> = new Map();
  private cacheTtlMs = 15000; // 15 seconds

  private constructor() {
    this.pythProvider = new PythMarketDataProvider();
    this.fallbackProvider = new FallbackMarketDataProvider();
  }

  public static getInstance(): MarketDataService {
    if (!MarketDataService.instance) {
      MarketDataService.instance = new MarketDataService();
    }
    return MarketDataService.instance;
  }

  public async getPrice(assetEntry: AssetRegistryEntry): Promise<MarketPrice> {
    const cached = this.cache.get(assetEntry.mint);
    if (cached && Date.now() - cached.fetchedAt < this.cacheTtlMs) {
      return cached.price;
    }

    let resolvedPrice: MarketPrice | null = null;

    // 1. Attempt Pyth if asset explicitly defines a Pyth feed
    if (assetEntry.hasPythFeed && assetEntry.pythFeedId) {
      try {
        resolvedPrice = await this.pythProvider.getPrice(assetEntry);
      } catch (e) {
        console.warn(`Pyth fetch failed for ${assetEntry.ticker}:`, e);
      }
    }

    // 2. Fallback to audited NAV / benchmark provider if Pyth did not resolve
    if (!resolvedPrice) {
      try {
        resolvedPrice = await this.fallbackProvider.getPrice(assetEntry);
      } catch (e) {
        console.warn(`Fallback fetch failed for ${assetEntry.ticker}:`, e);
      }
    }

    // 3. If neither provider can provide a reliable price, return unavailable
    if (!resolvedPrice) {
      const unavailableSource: PriceSource = {
        id: 'custodian_oracle',
        name: 'Unlisted / Missing Feed',
        type: 'oracle',
        description: 'No verified price oracle or audited NAV currently reported',
      };

      resolvedPrice = {
        assetMint: assetEntry.mint,
        ticker: assetEntry.ticker,
        price: null, // Strictly null - do not fabricate!
        currency: 'USD',
        source: unavailableSource,
        timestamp: new Date().toISOString(),
        freshness: 'unavailable',
        availability: 'unavailable',
        statusText: 'Price unavailable',
      };
    }

    this.cache.set(assetEntry.mint, { price: resolvedPrice, fetchedAt: Date.now() });
    return resolvedPrice;
  }

  public async getPricesForEntries(assetEntries: AssetRegistryEntry[]): Promise<Map<string, MarketPrice>> {
    const results = new Map<string, MarketPrice>();
    const missingInCache: AssetRegistryEntry[] = [];

    for (const entry of assetEntries) {
      const cached = this.cache.get(entry.mint);
      if (cached && Date.now() - cached.fetchedAt < this.cacheTtlMs) {
        results.set(entry.mint, cached.price);
      } else {
        missingInCache.push(entry);
      }
    }

    if (missingInCache.length === 0) {
      return results;
    }

    // 1. Batch Pyth for eligible entries
    const pythCandidates = missingInCache.filter((e) => e.hasPythFeed && e.pythFeedId);
    let pythResults = new Map<string, MarketPrice>();
    if (pythCandidates.length > 0) {
      try {
        pythResults = await this.pythProvider.getPrices(pythCandidates);
      } catch (err) {
        console.warn('Batch Pyth failed:', err);
      }
    }

    // 2. Fallback for remaining
    const remainingForFallback = missingInCache.filter((e) => !pythResults.has(e.mint));
    let fallbackResults = new Map<string, MarketPrice>();
    if (remainingForFallback.length > 0) {
      try {
        fallbackResults = await this.fallbackProvider.getPrices(remainingForFallback);
      } catch (err) {
        console.warn('Batch Fallback failed:', err);
      }
    }

    // 3. Assemble results and populate cache
    for (const entry of missingInCache) {
      const resolved = pythResults.get(entry.mint) || fallbackResults.get(entry.mint) || {
        assetMint: entry.mint,
        ticker: entry.ticker,
        price: null,
        currency: 'USD' as const,
        source: {
          id: 'custodian_oracle' as const,
          name: 'Unlisted',
          type: 'oracle' as const,
        },
        timestamp: new Date().toISOString(),
        freshness: 'unavailable' as const,
        availability: 'unavailable' as const,
        statusText: 'Price unavailable',
      };

      this.cache.set(entry.mint, { price: resolved, fetchedAt: Date.now() });
      results.set(entry.mint, resolved);
    }

    return results;
  }
}

export const marketDataService = MarketDataService.getInstance();
