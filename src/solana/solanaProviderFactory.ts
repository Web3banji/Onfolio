/**
 * Solana Provider Factory
 * 
 * Manages provider lifecycle, transparent failover, and explicit provenance tracking.
 */

import { ISolanaDataProvider } from './SolanaDataProvider.ts';
import { LiveSolanaRpcProvider } from './LiveSolanaRpcProvider.ts';
import { DevAdapterProvider } from './DevAdapterProvider.ts';

export type ProviderMode = 'auto' | 'live' | 'adapter';

let activeProvider: ISolanaDataProvider | null = null;
let currentMode: ProviderMode = (import.meta.env.VITE_DATA_PROVIDER_MODE as ProviderMode) || 'auto';

export function getSolanaDataProvider(options?: {
  mode?: ProviderMode;
  customRpcUrl?: string;
  forceFresh?: boolean;
}): ISolanaDataProvider {
  const targetMode = options?.mode || currentMode;

  if (activeProvider && !options?.forceFresh && !options?.customRpcUrl) {
    if (
      (targetMode === 'adapter' && activeProvider.providerType === 'dev_adapter') ||
      (targetMode === 'live' && activeProvider.providerType === 'live_solana_rpc') ||
      targetMode === 'auto'
    ) {
      return activeProvider;
    }
  }

  if (targetMode === 'adapter') {
    activeProvider = new DevAdapterProvider();
    return activeProvider;
  }

  // Live or Auto: instantiate LiveSolanaRpcProvider
  activeProvider = new LiveSolanaRpcProvider(options?.customRpcUrl);
  return activeProvider;
}

export function setProviderMode(mode: ProviderMode): void {
  currentMode = mode;
  activeProvider = null; // Re-initialize on next query
}

export function getCurrentProviderMode(): ProviderMode {
  return currentMode;
}
