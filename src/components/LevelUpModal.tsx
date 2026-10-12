import React, { useState, useEffect } from 'react';
import { UpgradeChoice } from '../game/weapons';
import { Sparkles, Dices, ArrowRight } from 'lucide-react';

interface LevelUpModalProps {
  choices: UpgradeChoice[];
  playerLevel: number;
  rerollsLeft: number;
  onSelect: (choice: UpgradeChoice) => void;
  onReroll: () => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({
  choices,
  playerLevel,
  rerollsLeft,
  onSelect,
  onReroll,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Keyboard navigation: 1, 2, 3, 4 or Up/Down/Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      if (key === '1' && choices[0]) onSelect(choices[0]);
      else if (key === '2' && choices[1]) onSelect(choices[1]);
      else if (key === '3' && choices[2]) onSelect(choices[2]);
      else if (key === '4' && choices[3]) onSelect(choices[3]);
      else if (key === 'ArrowUp' || key === 'w' || key === 'W') {
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : choices.length - 1));
      } else if (key === 'ArrowDown' || key === 's' || key === 'S') {
        setSelectedIndex((prev) => (prev < choices.length - 1 ? prev + 1 : 0));
      } else if (key === 'Enter' || key === ' ') {
        if (choices[selectedIndex]) {
          onSelect(choices[selectedIndex]);
        }
      } else if ((key === 'r' || key === 'R') && rerollsLeft > 0) {
        onReroll();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [choices, selectedIndex, rerollsLeft, onSelect, onReroll]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="flex flex-col items-center w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-36 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h2 className="text-2xl font-bold font-game tracking-wider text-amber-400">
            LEVEL UP!
          </h2>
          <Sparkles className="w-5 h-5 text-amber-400" />
        </div>
        <p className="text-xs text-slate-400 mb-6 font-mono">
          Valkyrie reached Level {playerLevel} · Choose your boon
        </p>

        {/* Upgrade Cards List */}
        <div className="flex flex-col gap-3 w-full mb-6">
          {choices.map((choice, index) => {
            const isSelected = selectedIndex === index;
            const isNew = choice.type.includes('new');

            return (
              <button
                key={`${choice.id}-${index}`}
                onClick={() => onSelect(choice)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`relative flex items-center gap-4 w-full p-4 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? 'border-amber-400 bg-slate-800/90 shadow-[0_0_15px_rgba(251,191,36,0.25)] scale-[1.01]'
                    : 'border-slate-700/70 bg-slate-800/40 hover:border-slate-500 hover:bg-slate-800/60'
                }`}
              >
                {/* Number Shortcut Badge */}
                <span className="w-6 h-6 rounded bg-slate-950 border border-slate-700 flex items-center justify-center text-xs font-mono font-bold text-slate-400 shrink-0">
                  {index + 1}
                </span>

                {/* Item Icon */}
                <div className="w-12 h-12 rounded-lg bg-slate-950 border border-slate-700 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                  {choice.icon}
                </div>

                {/* Title & Description */}
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-100 text-sm tracking-wide">
                      {choice.name}
                    </span>
                    {isNew ? (
                      <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-700/60 px-1.5 py-0.5 rounded">
                        New
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/80 border border-amber-700/60 px-1.5 py-0.5 rounded">
                        Lv. {choice.nextLevel}
                      </span>
                    )}

                    {choice.isEvolutionCandidate && (
                      <span className="text-[10px] font-bold text-purple-300 bg-purple-950/80 border border-purple-700/60 px-1.5 py-0.5 rounded">
                        Ready to Evolve
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                    {choice.description}
                  </p>
                </div>

                {/* Select Arrow Indicator */}
                <ArrowRight
                  className={`w-5 h-5 text-amber-400 shrink-0 transition-transform ${
                    isSelected ? 'translate-x-1 opacity-100' : 'opacity-0'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Footer Actions (Reroll) */}
        <div className="flex items-center justify-between w-full pt-2 border-t border-slate-800">
          <span className="text-[11px] text-slate-500 font-mono">
            Use [1-3] or [W/S] + [Enter] to choose
          </span>

          {rerollsLeft > 0 ? (
            <button
              onClick={onReroll}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-slate-600 rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer"
            >
              <Dices className="w-3.5 h-3.5 text-amber-400" />
              <span>Reroll ({rerollsLeft} left) [R]</span>
            </button>
          ) : (
            <span className="text-[11px] text-slate-600 font-mono">No rerolls remaining</span>
          )}
        </div>
      </div>
    </div>
  );
};
