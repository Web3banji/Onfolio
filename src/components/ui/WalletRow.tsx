import React from 'react';
import { Wallet } from '../../types/index.ts';
import { Badge } from './Badge.tsx';
import { Button } from './Button.tsx';
import { ShieldCheck, Eye, Wallet as WalletIcon, CheckCircle2, ShieldAlert } from 'lucide-react';

export interface WalletRowProps {
  wallet: Wallet;
  isActive?: boolean;
  onSelect?: (wallet: Wallet) => void;
  onVerify?: (wallet: Wallet) => void;
  onRemove?: (wallet: Wallet) => void;
}

export const WalletRow: React.FC<WalletRowProps> = ({
  wallet,
  isActive = false,
  onSelect,
  onVerify,
  onRemove,
}) => {
  const shortAddress = `${wallet.publicAddress.slice(0, 4)}...${wallet.publicAddress.slice(-4)}`;

  return (
    <div
      className={`p-3 rounded-lg border transition-all flex items-center justify-between gap-3 text-xs ${
        isActive
          ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
          : 'bg-white text-neutral-900 border-neutral-200 hover:border-neutral-300'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
            isActive ? 'bg-neutral-800 text-white' : 'bg-neutral-100 text-neutral-700'
          }`}
        >
          {wallet.isScannedOnly ? (
            <Eye className="w-4 h-4" />
          ) : (
            <WalletIcon className="w-4 h-4" />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold truncate">{wallet.label}</span>
            <span className="font-mono text-[11px] opacity-75">{shortAddress}</span>
            
            {/* Status Badges - Strict separation */}
            {wallet.isScannedOnly ? (
              <Badge variant="scanned" size="sm" showIcon>
                Scanned
              </Badge>
            ) : wallet.verificationStatus === 'verified' ? (
              <Badge variant="verified" size="sm" showIcon>
                Verified
              </Badge>
            ) : (
              <Badge variant="unverified" size="sm">
                Unverified
              </Badge>
            )}
          </div>

          <p className={`text-[10px] mt-0.5 truncate ${isActive ? 'text-neutral-300' : 'text-neutral-500'}`}>
            {wallet.isScannedOnly
              ? 'Read-only public address lookup (not in Passport)'
              : wallet.verificationStatus === 'verified'
              ? 'Included in verified Onfolio Passport'
              : 'Connected. Signature challenge required to verify ownership.'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {!wallet.isScannedOnly && wallet.verificationStatus !== 'verified' && onVerify && (
          <Button
            size="sm"
            variant={isActive ? 'secondary' : 'outline'}
            onClick={(e) => {
              e.stopPropagation();
              onVerify(wallet);
            }}
          >
            Verify
          </Button>
        )}

        {onSelect && !isActive && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onSelect(wallet)}
          >
            View
          </Button>
        )}

        {onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(wallet);
            }}
            className={`p-1 text-xs rounded hover:bg-neutral-200/50 ${
              isActive ? 'text-neutral-400 hover:text-white' : 'text-neutral-400 hover:text-red-600'
            }`}
            title="Remove wallet"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};
