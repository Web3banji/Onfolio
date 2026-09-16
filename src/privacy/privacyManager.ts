/**
 * Privacy & Sharing Layer
 * 
 * Manages user disclosure preferences, display masking, and selective credential sharing.
 */

import { PrivacyMode, Passport } from '../types/index.ts';

export function formatValueWithPrivacy(value: number, mode: PrivacyMode, currencySymbol = '$'): string {
  if (mode === 'public_full') {
    return `${currencySymbol}${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (mode === 'obfuscate_amounts') {
    return `${currencySymbol}••,•••`;
  }
  // anonymous_tier_only
  return `${currencySymbol}██████`;
}

export function formatAddressWithPrivacy(address: string, mode: PrivacyMode): string {
  if (!address) return '';
  if (mode === 'anonymous_tier_only') {
    return 'sol...[Obfuscated for Attestation]';
  }
  // standard truncated address
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function generateRedactedPassport(passport: Passport, mode: PrivacyMode): Partial<Passport> {
  if (mode === 'public_full') {
    return passport;
  }

  if (mode === 'obfuscate_amounts') {
    return {
      ...passport,
      totalEquityValueUsd: -1, // Redacted
      issuerConcentration: passport.issuerConcentration.map((c) => ({
        issuer: c.issuer,
        percentage: c.percentage,
      })),
      claims: passport.claims.map((c) => ({
        ...c,
        evidence: c.isSatisfied ? 'Verified Onchain Claim Satisfied [Amount Redacted]' : 'Unsatisfied',
      })),
    };
  }

  // anonymous_tier_only
  return {
    passportId: passport.passportId,
    tier: passport.tier,
    tierNumeric: passport.tierNumeric,
    issuedAt: passport.issuedAt,
    expiresAt: passport.expiresAt,
    passportStatus: passport.passportStatus,
    cryptographicFingerprint: passport.cryptographicFingerprint,
    dataProvenance: passport.dataProvenance,
    claims: passport.claims.map((c) => ({
      id: c.id,
      code: c.code,
      label: c.label,
      description: c.description,
      isSatisfied: c.isSatisfied,
      evidence: c.isSatisfied ? 'Satisfied Attestation' : 'Unsatisfied',
      cryptographicAssertion: c.cryptographicAssertion,
    })),
  };
}
