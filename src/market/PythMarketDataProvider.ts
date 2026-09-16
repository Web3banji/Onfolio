/**
 * Market Data Layer: Pyth Network Hermes Provider
 * 
 * Queries official Pyth Network Hermes service for real-time benchmark prices.
 * Only invoked if the Asset Registry explicitly defines hasPythFeed = true and a valid pythFeedId.
 */

import { IMarketDataProvider } from './MarketDataProvider.ts';
import { AssetRegistryEntry, MarketPrice, PriceSource } from '../types/index.ts';

const PYTH_HERMES_BASE_URL = 'https://hermes.pyth.network/v2/updates/price/latest';

export class PythMarketDataProvider implements IMarketDataProvider {
  readonly providerId = 'pyth_hermes';
  readonly providerName = 'Pyth Network (Hermes Oracle)';

  private priceSource: PriceSource = {
    id: 'pyth_hermes',
    name: 'Pyth Network Oracle',
    type: 'oracle',
    description: 'Real-time financial market data from Pyth Hermes network',
  };

  public async getPrice(assetEntry: AssetRegistryEntry): Promise<MarketPrice | null> {
    if (!assetEntry.hasPythFeed || !assetEntry.pythFeedId) {
      // Asset explicitly does not have a Pyth feed
      return null;
    }

    const batch = await this.getPrices([assetEntry]);
    return batch.get(assetEntry.mint) || null;
  }

  public async getPrices(assetEntries: AssetRegistryEntry[]): Promise<Map<string, MarketPrice>> {
    const results = new Map<string, MarketPrice>();
    const eligibleEntries = assetEntries.filter((e) => e.hasPythFeed && e.pythFeedId);

    if (eligibleEntries.length === 0) {
      return results;
    }

    try {
      const feedIds = eligibleEntries.map((e) => e.pythFeedId!);
      const queryParams = feedIds.map((id) => `ids[]=${encodeURIComponent(id)}`).join('&');
      const url = `${PYTH_HERMES_BASE_URL}?${queryParams}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 second timeout

      const response = await fetch(url, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`Pyth Hermes returned status ${response.status}`);
        return results;
      }

      const data = await response.json();
      const parsedList = data?.parsed || [];

      const parsedMap = new Map<string, any>();
      for (const item of parsedList) {
        const normalizedId = (item.id || '').toLowerCase().replace(/^0x/, '');
        parsedMap.set(normalizedId, item);
      }

      const now = new Date().toISOString();

      for (const entry of eligibleEntries) {
        const cleanFeedId = (entry.pythFeedId || '').toLowerCase().replace(/^0x/, '');
        const pythData = parsedMap.get(cleanFeedId);

        if (pythData?.price) {
          const rawPrice = Number(pythData.price.price);
          const expo = Number(pythData.price.expo);
          const rawConf = Number(pythData.price.conf || 0);
          const publishTime = pythData.price.publish_time ? pythData.price.publish_time * 1000 : Date.now();

          const calcPrice = Number((rawPrice * Math.pow(10, expo)).toFixed(2));
          const confidence = Number((rawConf * Math.pow(10, expo)).toFixed(2));

          const ageSeconds = Math.max(0, Math.floor((Date.now() - publishTime) / 1000));
          const freshness = ageSeconds < 120 ? 'live' : ageSeconds < 3600 ? 'recent' : 'stale';

          results.set(entry.mint, {
            assetMint: entry.mint,
            ticker: entry.ticker,
            price: calcPrice,
            currency: 'USD',
            source: this.priceSource,
            timestamp: new Date(publishTime).toISOString(),
            freshness,
            availability: 'available',
            confidence,
            statusText: `Live Pyth Oracle (±$${confidence.toFixed(2)})`,
          });
        }
      }
    } catch (err: any) {
      // Graceful failure: network issue, timeout, or blocked endpoint
      console.warn('Pyth Hermes fetch error (will fall back gracefully):', err.message || err);
    }

    return results;
  }
}
