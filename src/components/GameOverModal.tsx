import React from 'react';
import { Player, WeaponId } from '../game/types';
import { WEAPON_REGISTRY } from '../game/weapons';
import { storage } from '../game/storage';
import { Skull, Coins, Clock, RotateCcw, ShoppingBag, Trophy } from 'lucide-react';

interface GameOverModalProps {
  isVictory: boolean;
  player: Player;
  survivalTime: number;
  kills: number;
  newAchievements?: { id: string; name: string; description: string; icon: string }[];
  onPlayAgain: () => void;
  onOpenShop: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isVictory,
  player,
  survivalTime,
  kills,
  newAchievements = [],
  onPlayAgain,
  onOpenShop,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const lifetimeData = storage.getData();
  const unlockedCount = Object.keys(lifetimeData.achievements || {}).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="flex flex-col items-center w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-center max-h-[92vh] overflow-y-auto">
        {/* Title */}
        <div className="mb-2">
          {isVictory ? (
            <div className="flex items-center justify-center gap-2 text-amber-400">
              <Trophy className="w-7 h-7" />
              <h2 className="text-2xl font-black font-game tracking-wider">
                SURVIVED THE HORDE!
              </h2>
            </div>
          ) : (
            <h2 className="text-2xl font-black font-game tracking-wider text-rose-500">
              FALLEN IN BATTLE
            </h2>
          )}
          <p className="text-xs text-slate-400 mt-1">
            {isVictory
              ? 'The Valkyrie triumphed over the legion of darkness!'
              : 'Your valor will not be forgotten. Spend your gold to grow stronger.'}
          </p>
        </div>

        {/* Newly Unlocked Achievements Badge Banner */}
        {newAchievements.length > 0 && (
          <div className="w-full my-3 p-3 bg-gradient-to-r from-amber-950/50 via-yellow-900/40 to-amber-950/50 border border-amber-500/60 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse">
            <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center justify-center gap-1.5 mb-2">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>NEW ACHIEVEMENTS UNLOCKED!</span>
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {newAchievements.map((ach) => (
                <div
                  key={ach.id}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950/80 border border-amber-400/80 rounded-lg text-xs"
                >
                  <span className="text-base">{ach.icon}</span>
                  <span className="font-bold text-amber-200">{ach.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Primary Run Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full my-4">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col items-center">
            <span className="flex items-center gap-1 text-[11px] text-slate-400 mb-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Survived</span>
            </span>
            <span className="font-mono text-base font-bold text-slate-100">
              {formatTime(survivalTime)}
            </span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col items-center">
            <span className="flex items-center gap-1 text-[11px] text-slate-400 mb-1">
              <Skull className="w-3.5 h-3.5 text-rose-400" />
              <span>Enemies</span>
            </span>
            <span className="font-mono text-base font-bold text-slate-100">
              {kills.toLocaleString()}
            </span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col items-center">
            <span className="flex items-center gap-1 text-[11px] text-slate-400 mb-1">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>Gold Earned</span>
            </span>
            <span className="font-mono text-base font-bold text-amber-400">
              +{player.gold}
            </span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col items-center">
            <span className="text-[11px] text-slate-400 mb-1">Level Reached</span>
            <span className="font-mono text-base font-bold text-slate-100">
              Lv. {player.level}
            </span>
          </div>
        </div>

        {/* Dash and Shrine Stats */}
        <div className="flex items-center justify-between w-full px-3 py-1.5 bg-slate-950/50 rounded-lg text-xs text-slate-400 mb-3 border border-slate-800/80">
          <span>Dashes Executed: <strong className="text-cyan-300 font-mono">{player.dashesUsed || 0}</strong></span>
          <span>Shrines Prayed: <strong className="text-amber-300 font-mono">{player.shrinesPrayed || 0}</strong></span>
          <span>Badges: <strong className="text-emerald-400 font-mono">{unlockedCount} / 8</strong></span>
        </div>

        {/* Weapons Used & Damage */}
        <div className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3 mb-5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2 text-left">
            Arsenal Damage Dealt
          </span>
          <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto pr-1">
            {player.weapons.map((w) => {
              const def = WEAPON_REGISTRY[w.id];
              return (
                <div key={w.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-900 last:border-none">
                  <div className="flex items-center gap-1.5">
                    <span>{def.icon}</span>
                    <span className="text-slate-300 font-medium">
                      {def.name} <span className="text-slate-500 text-[10px]">Lv.{w.level}</span>
                    </span>
                  </div>
                  <span className="font-mono text-slate-400 text-[11px]">
                    {w.totalDamage.toLocaleString()} dmg
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3 w-full">
          <button
            onClick={onPlayAgain}
            className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-game tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>PLAY AGAIN</span>
          </button>

          <button
            onClick={onOpenShop}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-bold font-game tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            <span>POWER UP (Shop)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
