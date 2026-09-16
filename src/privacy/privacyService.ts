/**
 * Privacy & Sharing Layer: Selective Disclosure Engine
 * 
 * CORE PRINCIPLE:
 * The passport must be shareable without forcing full transparency.
 * Supports:
 * - Selective disclosure
 * - Hidden balances ($••••••)
 * - Percentage-only allocation views
 * - Proof-of-position without revealing raw transaction history or wallet addresses
 */

import { Passport, PrivacySettings, PassportHolding } from '../types/index.ts';

export interface SanitizedPassport extends Omit<Passport, 'verifiedHoldings'> {
  privacyApplied: PrivacySettings;
  verifiedHoldings: Array<
    Omit<PassportHolding, 'amountFormatted' | 'valueUsd'> & {
      amountFormatted: number | null;
      valueUsd: number | null;
      isMasked: boolean;
    }
  >;
  isTotalValueMasked: boolean;
}

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  privacyMode: 'public_full',
  showWalletAddresses: true,
  allowPublicAudit: true,
  hideAbsoluteBalances: false,
  percentageOnlyAllocation: false,
  hideWalletAddresses: false,
  hideTransactionHistory: false,
};

export class PrivacyService {
  private static instance: PrivacyService;

  public static getInstance(): PrivacyService {
    if (!PrivacyService.instance) {
      PrivacyService.instance = new PrivacyService();
    }
    return PrivacyService.instance;
  }

  public sanitizePassport(
    passport: Passport,
    settings: PrivacySettings = DEFAULT_PRIVACY_SETTINGS
  ): SanitizedPassport {
    const isMasked = settings.hideAbsoluteBalances;

    const sanitizedHoldings = passport.verifiedHoldings.map((holding) => ({
      ...holding,
      amountFormatted: isMasked ? null : holding.amountFormatted,
      valueUsd: isMasked ? null : holding.valueUsd,
      isMasked,
      walletAddress: settings.hideWalletAddresses
        ? `${holding.walletAddress.slice(0, 3)}••••${holding.walletAddress.slice(-3)}`
        : holding.walletAddress,
      tokenAccountAddress: settings.hideWalletAddresses
        ? '••••••••••••••••'
        : holding.tokenAccountAddress,
    }));

    const sanitizedWallets = passport.connectedWallets.map((w) => ({
      ...w,
      publicAddress: settings.hideWalletAddresses
        ? `${w.publicAddress.slice(0, 3)}••••${w.publicAddress.slice(-3)}`
        : w.publicAddress,
    }));

    const displayWallet = settings.hideWalletAddresses
      ? `${passport.walletAddress.slice(0, 3)}••••${passport.walletAddress.slice(-3)}`
      : passport.walletAddress;

    return {
      ...passport,
      walletAddress: displayWallet,
      connectedWallets: sanitizedWallets,
      isTotalValueMasked: isMasked,
      verifiedHoldings: sanitizedHoldings,
      privacyApplied: settings,
    };
  }

  public exportShareableProof(
    passport: Passport,
    settings: PrivacySettings
  ): {
    passportId: string;
    fingerprint: string;
    tier: string;
    issuedAt: string;
    expiresAt: string;
    claimsSatisfied: string[];
    allocation: Array<{ assetClass: string; percentage: number }>;
    selectiveDisclosure: PrivacySettings;
  } {
    return {
      passportId: passport.passportId,
      fingerprint: passport.cryptographicFingerprint,
      tier: passport.tier,
      issuedAt: passport.issuedAt,
      expiresAt: passport.expiresAt,
      claimsSatisfied: passport.claims.filter((c) => c.isSatisfied).map((c) => c.code),
      allocation: passport.assetClassAllocation,
      selectiveDisclosure: settings,
    };
  }
}

export const privacyService = PrivacyService.getInstance();
