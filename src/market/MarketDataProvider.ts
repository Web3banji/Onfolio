/**
 * Market Data Layer: Provider Interface
 * 
 * CORE PRINCIPLE:
 * Do not make the entire application dependent on Pyth.
 * Do not assume that every tokenized equity has a Pyth feed.
 * Do not guess Pyth feed IDs.
 * The asset registry must explicitly determine whether a supported asset has a valid Pyth feed.
 * If neither Pyth nor the approved fallback provider can provide a reliable current price:
 * show "Price unavailable". Do NOT fabricate a price.
 */

import { AssetRegistryEntry, MarketPrice } from '../types/index.ts';

export interface IMarketDataProvider {
  readonly providerId: string;
  readonly providerName: string;
  getPrice(assetEntry: AssetRegistryEntry): Promise<MarketPrice | null>;
  getPrices(assetEntries: AssetRegistryEntry[]): Promise<Map<string, MarketPrice>>;
}
