import React from 'react';
import { WeaponId } from '../game/types';
import { WEAPON_REGISTRY } from '../game/weapons';
import { Sparkles, Coins, Crown } from 'lucide-react';

interface ChestModalProps {
  evolution: {
    baseWeaponId: WeaponId;
    evolvedWeaponId: WeaponId;
  } | null;
  goldAwarded: number;
  onClaim: () => void;
}

export const ChestModal: React.FC<ChestModalProps> = ({
  evolution,
  goldAwarded,
  onClaim,
}) => {
  const evolvedDef = evolution ? WEAPON_REGISTRY[evolution.evolvedWeaponId] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="flex flex-col items-center w-full max-w-md bg-slate-900 border border-amber-500/80 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.3)] p-6 relative overflow-hidden text-center">
        {/* Golden Sunburst Background */}
        <div className="absolute inset-0 bg-radial from-amber-500/15 via-transparent to-transparent pointer-events-none" />

        {/* Chest Title */}
        <div className="flex items-center gap-2 mb-2">
          {evolution ? (
            <>
              <Crown className="w-6 h-6 text-amber-400 animate-bounce" />
              <h2 className="text-2xl font-black font-game tracking-wider text-amber-400">
                WEAPON EVOLUTION!
              </h2>
              <Crown className="w-6 h-6 text-amber-400 animate-bounce" />
            </>
          ) : (
            <>
              <Sparkles className="w-6 h-6 text-amber-400" />
              <h2 className="text-2xl font-black font-game tracking-wider text-amber-400">
                TREASURE CHEST!
              </h2>
              <Sparkles className="w-6 h-6 text-amber-400" />
            </>
          )}
        </div>

        {/* Chest Graphic */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-amber-900/60 to-slate-950 border-2 border-amber-400/80 flex items-center justify-center text-5xl shadow-[0_0_30px_rgba(251,191,36,0.4)]">
            {evolution ? evolvedDef?.icon : '🎁'}
          </div>
        </div>

        {/* Content Details */}
        {evolution && evolvedDef ? (
          <div className="flex flex-col items-center gap-1 mb-6">
            <span className="text-lg font-bold text-amber-300 font-game">
              {evolvedDef.name}
            </span>
            <p className="text-xs text-slate-300 max-w-xs leading-relaxed">
              {evolvedDef.description}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 mb-6">
            <div className="flex items-center gap-2 text-amber-300 font-mono font-bold text-lg">
              <Coins className="w-5 h-5 text-amber-400" />
              <span>+{goldAwarded} Gold Coins</span>
            </div>
            <p className="text-xs text-slate-400">
              The ancient chest yielded gleaming bounties!
            </p>
          </div>
        )}

        {/* Claim Button */}
        <button
          onClick={onClaim}
          className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold font-game tracking-wider shadow-lg hover:shadow-[0_0_20px_rgba(251,191,36,0.6)] active:scale-95 transition-all cursor-pointer"
        >
          CLAIM BOUNTY (Space / Enter)
        </button>
      </div>
    </div>
  );
};
