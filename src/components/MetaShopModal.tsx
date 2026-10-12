import React, { useState } from 'react';
import { PERMANENT_UPGRADES, storage } from '../game/storage';
import { Coins, RotateCcw, ArrowLeft, Check, Sparkles } from 'lucide-react';

interface MetaShopModalProps {
  onClose: () => void;
}

export const MetaShopModal: React.FC<MetaShopModalProps> = ({ onClose }) => {
  const [data, setData] = useState(storage.getData());

  const refresh = () => {
    setData(storage.getData());
  };

  const handleBuy = (id: string) => {
    const success = storage.buyUpgrade(id);
    if (success) {
      refresh();
    }
  };

  const handleRefund = () => {
    storage.refundAllUpgrades();
    refresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="flex flex-col w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h2 className="text-xl font-bold font-game tracking-wider text-slate-100">
                  PERMANENT POWER-UPS
                </h2>
              </div>
              <p className="text-xs text-slate-400">
                Enhance your Valkyrie across all future runs. Refund anytime for 100% gold back.
              </p>
            </div>
          </div>

          {/* Current Gold & Refund Button */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-950 border border-amber-500/40 px-3.5 py-1.5 rounded-xl">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="font-mono text-base font-bold text-amber-400">
                {data.gold.toLocaleString()}
              </span>
            </div>

            <button
              onClick={handleRefund}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer"
              title="Refund all upgrades and recover 100% of gold spent"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
              <span>Refund (100%)</span>
            </button>
          </div>
        </div>

        {/* Upgrades Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-4 overflow-y-auto pr-1 flex-1">
          {PERMANENT_UPGRADES.map((upgrade) => {
            const currentRank = storage.getUpgradeRank(upgrade.id);
            const isMaxed = currentRank >= upgrade.maxRank;
            const cost = storage.getUpgradeCost(upgrade);
            const canAfford = data.gold >= cost;

            return (
              <div
                key={upgrade.id}
                className="flex flex-col justify-between p-3.5 bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-xl transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{upgrade.icon}</span>
                    <div>
                      <h3 className="font-semibold text-slate-100 text-sm">
                        {upgrade.name}
                      </h3>
                      <span className="text-[11px] text-amber-400 font-mono font-medium">
                        {upgrade.bonusPerRank}
                      </span>
                    </div>
                  </div>

                  {/* Rank Pips */}
                  <div className="flex items-center gap-1 mt-1">
                    {Array.from({ length: upgrade.maxRank }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-2.5 h-2.5 rounded-full border ${
                          i < currentRank
                            ? 'bg-amber-400 border-amber-500 shadow-[0_0_6px_rgba(251,191,36,0.6)]'
                            : 'bg-slate-900 border-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  {upgrade.description}
                </p>

                {/* Purchase Button */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-900">
                  <span className="text-[11px] text-slate-500 font-mono">
                    Rank {currentRank}/{upgrade.maxRank}
                  </span>

                  {isMaxed ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1 rounded-lg">
                      <Check className="w-3.5 h-3.5" />
                      <span>MAXED</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleBuy(upgrade.id)}
                      disabled={!canAfford}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                        canAfford
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md active:scale-95'
                          : 'bg-slate-800/80 text-slate-500 border border-slate-700/60 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>{cost.toLocaleString()} G</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="py-2.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-game tracking-wider transition-all active:scale-95 shadow-md cursor-pointer"
          >
            CONFIRM & RETURN
          </button>
        </div>
      </div>
    </div>
  );
};
