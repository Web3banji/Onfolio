/**
 * Presentation Layer: Verification Modal
 * 
 * CORE RULES:
 * Verification understandable without technical knowledge.
 * Possible states:
 * - Verified
 * - Pending
 * - Unable to verify
 * - Data unavailable
 * - Stale
 * - Unsupported
 * Do not use technical blockchain terminology unless user opens detailed evidence.
 */

import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Clock,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Copy,
  Check,
} from 'lucide-react';
import { useOnfolio } from '../state/OnfolioContext.tsx';
import { VerificationRecord } from '../types/index.ts';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export type VerificationState =
  | 'Verified'
  | 'Pending'
  | 'Unable to verify'
  | 'Data unavailable'
  | 'Stale'
  | 'Unsupported';

export const VerificationModal: React.FC<VerificationModalProps> = ({ isOpen, onClose }) => {
  const { passport, verificationRecord, activeWallet, verifyExternalPassportJson } = useOnfolio();
  const [activeTab, setActiveTab] = useState<'status' | 'audit_json'>('status');
  const [showEvidence, setShowEvidence] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [externalRecord, setExternalRecord] = useState<VerificationRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  if (!isOpen) return null;

  // Determine current human-friendly state
  let currentState: VerificationState = 'Unable to verify';
  if (!activeWallet) {
    currentState = 'Data unavailable';
  } else if (activeWallet.isScannedOnly) {
    currentState = 'Pending';
  } else if (activeWallet.verificationStatus === 'verified') {
    currentState = 'Verified';
  } else if (activeWallet.verificationStatus === 'unverified') {
    currentState = 'Pending';
  }

  const getStateDetails = (state: VerificationState) => {
    switch (state) {
      case 'Verified':
        return {
          icon: <ShieldCheck className="w-6 h-6 text-[#1B7A4F]" />,
          bg: 'bg-[#EAF6EE]',
          border: 'border-[#1B7A4F]/20',
          textColor: 'text-[#1B7A4F]',
          title: 'Verified Position',
          description: 'This passport and its holdings have been confirmed on the Solana network.',
        };
      case 'Pending':
        return {
          icon: <Clock className="w-6 h-6 text-[#9E6700]" />,
          bg: 'bg-[#FEF8E7]',
          border: 'border-[#9E6700]/20',
          textColor: 'text-[#9E6700]',
          title: 'Verification Pending',
          description: activeWallet?.isScannedOnly
            ? 'This wallet is in read-only mode. Connect your wallet to complete verification.'
            : 'A zero-cost signature challenge is required to prove wallet ownership.',
        };
      case 'Stale':
        return {
          icon: <AlertCircle className="w-6 h-6 text-[#D4683B]" />,
          bg: 'bg-[#FAF0EA]',
          border: 'border-[#D4683B]/20',
          textColor: 'text-[#D4683B]',
          title: 'Stale Data',
          description: 'This verification record has expired and requires a fresh check.',
        };
      case 'Data unavailable':
        return {
          icon: <HelpCircle className="w-6 h-6 text-[#5E6978]" />,
          bg: 'bg-[#F5F2EC]',
          border: 'border-[#E8E4DD]',
          textColor: 'text-[#5E6978]',
          title: 'Data Unavailable',
          description: 'Market data or network records are currently inaccessible. Please retry.',
        };
      case 'Unsupported':
        return {
          icon: <AlertCircle className="w-6 h-6 text-[#5E6978]" />,
          bg: 'bg-[#F5F2EC]',
          border: 'border-[#E8E4DD]',
          textColor: 'text-[#5E6978]',
          title: 'Unsupported',
          description: 'The asset or token account is not recognized by the official registry.',
        };
      default:
        return {
          icon: <AlertCircle className="w-6 h-6 text-[#A82A2A]" />,
          bg: 'bg-[#FDF2F2]',
          border: 'border-[#A82A2A]/20',
          textColor: 'text-[#A82A2A]',
          title: 'Unable to Verify',
          description: 'Could not verify the authenticity of this wallet or credential.',
        };
    }
  };

  const currentDetails = getStateDetails(currentState);

  const handleAuditJson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jsonInput.trim()) return;
    setError(null);
    setExternalRecord(null);
    try {
      const rec = await verifyExternalPassportJson(jsonInput.trim());
      if (rec) {
        setExternalRecord(rec);
      } else {
        setError('Invalid passport payload.');
      }
    } catch {
      setError('Could not verify passport JSON.');
    }
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-2xl border border-[#E8E4DD] max-w-lg w-full p-6 space-y-5 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 bg-[#F5F2EC] p-1 rounded-xl text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('status')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'status' ? 'bg-white text-[#161C24] shadow-2xs font-semibold' : 'text-[#5E6978]'
              }`}
            >
              Verification
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('audit_json')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'audit_json' ? 'bg-white text-[#161C24] shadow-2xs font-semibold' : 'text-[#5E6978]'
              }`}
            >
              Audit External Proof
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-[#8C97A5] hover:text-[#161C24] p-1 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab 1: Current Verification Status */}
        {activeTab === 'status' && (
          <div className="space-y-4">
            {/* Status Card */}
            <div className={`p-5 rounded-xl border ${currentDetails.border} ${currentDetails.bg} flex items-start gap-4`}>
              <div className="shrink-0 mt-0.5">{currentDetails.icon}</div>
              <div className="space-y-1">
                <h3 className={`text-sm font-bold ${currentDetails.textColor}`}>
                  {currentDetails.title}
                </h3>
                <p className="text-xs text-[#5E6978] leading-relaxed">
                  {currentDetails.description}
                </p>
              </div>
            </div>

            {/* Quick Claims Checklist */}
            {passport && (
              <div className="space-y-2 border border-[#E8E4DD] rounded-xl p-4 text-xs">
                <div className="text-[11px] font-semibold text-[#8C97A5] uppercase tracking-wider mb-2">
                  Attested Checks
                </div>
                {passport.claims.map((claim) => (
                  <div key={claim.id} className="flex items-center justify-between py-1">
                    <span className="text-[#161C24]">{claim.title}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        claim.isSatisfied ? 'bg-[#EAF6EE] text-[#1B7A4F]' : 'bg-[#F5F2EC] text-[#8C97A5]'
                      }`}
                    >
                      {claim.isSatisfied ? 'Confirmed' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Progressive Disclosure: Technical Evidence */}
            {passport && (
              <div className="border-t border-[#E8E4DD]/60 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEvidence(!showEvidence)}
                  className="w-full flex items-center justify-between text-xs text-[#5E6978] hover:text-[#161C24] cursor-pointer"
                >
                  <span>Detailed evidence</span>
                  {showEvidence ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showEvidence && (
                  <div className="mt-3 p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E4DD] space-y-2 text-[11px] font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-[#8C97A5]">Fingerprint (SHA-256):</span>
                      <button
                        type="button"
                        onClick={() => handleCopyHash(passport.cryptographicFingerprint)}
                        className="text-[#D4683B] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {copiedHash ? <Check className="w-3 h-3 text-[#1B7A4F]" /> : <Copy className="w-3 h-3" />}
                        <span>{passport.cryptographicFingerprint.slice(0, 10)}...</span>
                      </button>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8C97A5]">Cluster Slot:</span>
                      <span className="text-[#161C24]">{passport.dataProvenance.solanaSlot}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8C97A5]">Issued At:</span>
                      <span className="text-[#161C24]">{new Date(passport.issuedAt).toISOString()}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Audit External Proof */}
        {activeTab === 'audit_json' && (
          <form onSubmit={handleAuditJson} className="space-y-4">
            <p className="text-xs text-[#5E6978]">
              Paste an exported Onfolio proof JSON to independently verify its cryptographic integrity.
            </p>

            {error && (
              <div className="text-xs text-[#A82A2A] bg-[#FDF2F2] border border-[#F5C2C2] p-2.5 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='{"passportId": "ONF-...", ...}'
                rows={4}
                className="w-full p-3 bg-[#FAF8F5] border border-[#E8E4DD] rounded-xl text-xs font-mono text-[#161C24] focus:outline-none focus:border-[#D4683B]"
              />
            </div>

            <button
              type="submit"
              className="w-full h-10 bg-[#161C24] hover:bg-[#2B333E] text-white rounded-xl text-xs font-medium cursor-pointer"
            >
              Verify Proof
            </button>

            {externalRecord && (
              <div className="p-3 bg-[#EAF6EE] rounded-xl border border-[#1B7A4F]/30 text-xs text-[#1B7A4F] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Valid credential: {externalRecord.isAuthentic ? 'Cryptographically confirmed' : 'Invalid'}</span>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
