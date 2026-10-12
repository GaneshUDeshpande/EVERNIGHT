import React from 'react';
import { ACHIEVEMENTS_CATALOG, storage } from '../game/storage';
import { Trophy, CheckCircle, Lock, X } from 'lucide-react';

interface AchievementsModalProps {
  onClose: () => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({ onClose }) => {
  const data = storage.getData();
  const unlockedMap = data.achievements || {};
  const totalAchievements = ACHIEVEMENTS_CATALOG.length;
  const unlockedCount = ACHIEVEMENTS_CATALOG.filter((a) => !!unlockedMap[a.id]).length;
  const progressPercent = Math.round((unlockedCount / totalAchievements) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/40 rounded-2xl shadow-2xl p-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-100 tracking-wide font-game">
                HALL OF VALKYRIES
              </h2>
              <p className="text-xs text-slate-400">
                Unlock legendary badges across all your survival runs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Tracker Bar */}
        <div className="my-4 bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-slate-300">Completion Status</span>
            <span className="font-mono text-amber-400 font-bold">
              {unlockedCount} / {totalAchievements} Unlocked ({progressPercent}%)
            </span>
          </div>
          <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 transition-all duration-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Achievements Grid */}
        <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 md:grid-cols-2 gap-3 custom-scrollbar">
          {ACHIEVEMENTS_CATALOG.map((ach) => {
            const isUnlocked = !!unlockedMap[ach.id];
            return (
              <div
                key={ach.id}
                className={`relative flex items-center gap-3.5 p-3 rounded-xl border transition-all ${
                  isUnlocked
                    ? 'bg-amber-950/20 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                    : 'bg-slate-900/50 border-slate-800 opacity-60'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 border ${
                    isUnlocked
                      ? 'bg-amber-500/20 border-amber-400/60 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                      : 'bg-slate-950 border-slate-800 grayscale'
                  }`}
                >
                  {ach.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3
                      className={`text-sm font-bold truncate ${
                        isUnlocked ? 'text-amber-200' : 'text-slate-400'
                      }`}
                    >
                      {ach.name}
                    </h3>
                    {isUnlocked ? (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <Lock className="w-3 h-3 text-slate-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{ach.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
