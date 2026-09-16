/**
 * Presentation Layer: Portfolio Explainer
 * 
 * PRODUCT ROLE:
 * The dashboard exists to help the user understand the passport.
 * Unpacks the underlying tokenized equity holdings, market data provenance,
 * and onchain transaction history that support the passport's claims.
 * 
 * CORE RULES:
 * - Pyth oracle source vs Fallback NAV benchmark clearly indicated.
 * - Price unavailable clearly marked when feed is not present.
 * - Never invent cost basis or fabricate gain/loss.
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  ExternalLink,
  History,
  Layers,
  FileCheck,
  Info,
  Radio,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { useOnfolio } from '../state/OnfolioContext.tsx';
import { Tabs, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge, AssetRow, EmptyState } from './ui/index.ts';

export const PortfolioExplainer: React.FC = () => {
  const { portfolio, privacySettings } = useOnfolio();
  const [activeTab, setActiveTab] = useState('holdings');

  if (!portfolio) return null;

  const tabItems = [
    { id: 'holdings', label: 'Recognized Equities', count: portfolio.holdings.length },
    { id: 'market_data', label: 'Market Data & Oracles', count: portfolio.holdings.length },
    { id: 'transactions', label: 'Ledger Provenance History', count: portfolio.transactions.length },
  ];

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs" id="portfolio-explainer-section">
      {/* Explainer Header & Tab Switcher */}
      <div className="p-4 sm:p-5 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-50/50">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-neutral-900 tracking-tight">
              Passport Evidence & Ledger Breakdown
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-200 text-neutral-800 font-medium">
              Supporting Proof
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Cryptographic token accounts and verified price feeds supporting the Onfolio Passport.
          </p>
        </div>

        {/* Tab Controls */}
        <Tabs
          items={tabItems}
          activeId={activeTab}
          onChange={(id) => setActiveTab(id)}
        />
      </div>

      {/* Content Body */}
      <div className="p-4 sm:p-5">
        {/* TAB 1: Recognized Equities */}
        {activeTab === 'holdings' && (
          <div className="space-y-4">
            {portfolio.holdings.length === 0 ? (
              <EmptyState
                title="No recognized tokenized equities"
                description="This Solana address does not hold recognized tokenized equities from registered SPVs or broker-dealers."
              />
            ) : (
              <div className="space-y-2.5">
                {portfolio.holdings.map((h) => (
                  <AssetRow key={h.id} holding={h} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Market Data & Oracles */}
        {activeTab === 'market_data' && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-200 text-neutral-600 leading-relaxed text-[11px]">
              <strong className="text-neutral-900">Oracle Transparency Policy:</strong> Onfolio prioritizes live Pyth Network Hermes oracles for equities that have verified Pyth feeds. For private institutional treasury funds or where no oracle feed exists, Onfolio references audited custodian NAV filings. If neither is available, it displays <span className="font-semibold text-neutral-800">"Price unavailable"</span> and never fabricates prices.
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset & Ticker</TableHead>
                  <TableHead>Price Source</TableHead>
                  <TableHead>Feed / Attestation ID</TableHead>
                  <TableHead>Freshness</TableHead>
                  <TableHead className="text-right">Unit Price (USD)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {portfolio.holdings.map((h) => {
                  const mp = h.marketPrice;
                  return (
                    <TableRow key={h.id}>
                      <TableCell className="font-semibold text-neutral-900">
                        {h.asset.symbol} ({h.asset.underlyingTicker})
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Radio className="w-3 h-3 text-neutral-500" />
                          <span className="font-medium text-neutral-800">{mp.source.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-[11px] text-neutral-500">
                        {h.asset.mint.slice(0, 10)}...
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                            mp.freshness === 'live'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : mp.freshness === 'recent'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-neutral-100 text-neutral-600'
                          }`}
                        >
                          {mp.freshness.toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-neutral-900">
                        {privacySettings.hideAbsoluteBalances ? (
                          '••••••'
                        ) : mp.price !== null ? (
                          `$${mp.price.toFixed(2)}`
                        ) : (
                          <span className="text-neutral-400 font-normal">Price unavailable</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* TAB 3: Provenance History */}
        {activeTab === 'transactions' && (
          <div className="space-y-3">
            {privacySettings.hideTransactionHistory ? (
              <div className="p-6 text-center text-neutral-500 bg-neutral-50 rounded-lg border border-neutral-200 text-xs">
                Transaction history is hidden under current Selective Disclosure privacy settings.
              </div>
            ) : portfolio.transactions.length === 0 ? (
              <EmptyState
                title="No transaction history identified"
                description="No recent finalized transactions were found for this address on Solana."
              />
            ) : (
              <div className="divide-y divide-neutral-100">
                {portfolio.transactions.map((tx) => (
                  <div key={tx.signature} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-800">
                        {tx.type}
                      </span>
                      <div>
                        <div className="font-medium text-neutral-900 flex items-center gap-1.5">
                          <span>{tx.amount} {tx.assetSymbol}</span>
                          <span className="text-[11px] text-neutral-500">({tx.underlyingTicker})</span>
                        </div>
                        <div className="font-mono text-[10px] text-neutral-400 truncate max-w-[240px]">
                          Sig: {tx.signature.slice(0, 16)}...
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-neutral-800 font-medium font-mono">
                        Slot #{tx.slot.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-neutral-400">
                        {new Date(tx.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Registry Transparency Footer */}
      <div className="px-4 sm:px-5 py-2.5 bg-neutral-50 border-t border-neutral-200 text-[11px] text-neutral-500 flex items-center justify-between">
        <span>Asset Registry: Validates against Backed Finance, Ondo, Dinari, and Swarm smart contract mints.</span>
        <span className="font-mono text-[10px]">Onfolio Architecture v1.1.0</span>
      </div>
    </div>
  );
};
