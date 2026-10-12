import React, { useEffect, useRef } from 'react';
import { sprites } from '../game/sprites';
import { EnemyType } from '../game/types';
import { BookOpen, X, Shield, Swords, Sparkles } from 'lucide-react';

interface BestiaryModalProps {
  onClose: () => void;
}

interface BestiaryEntry {
  type: EnemyType | 'player';
  name: string;
  role: string;
  threat: 'Low' | 'Medium' | 'High' | 'Boss' | 'Protagonist';
  lore: string;
}

const BESTIARY_DATA: BestiaryEntry[] = [
  {
    type: 'player',
    name: 'Valkyrie Maiden',
    role: 'Sword & Shield Heroine',
    threat: 'Protagonist',
    lore: 'A golden-haired warrior wielding an enchanted arming sword and kite shield. She harnesses elemental relics to withstand legions of encroaching horrors.',
  },
  {
    type: 'slime',
    name: 'Azure Slime',
    role: 'Swarm / Fodder',
    threat: 'Low',
    lore: 'Squishy gelatinous droplets that emerge in vast numbers. Low health, easily slain for early experience crystals.',
  },
  {
    type: 'snake',
    name: 'Viper Serpent',
    role: 'Zig-zag Skirmisher',
    threat: 'Low',
    lore: 'A venomous green snake slithering in rapid lateral sine-waves with a flickering red forked tongue.',
  },
  {
    type: 'plant',
    name: 'Carnivorous Chomper',
    role: 'Ranged Spitter',
    threat: 'Medium',
    lore: 'Predatory flora with snapping pink jaws and razor fangs. Lobs poisonous thorn darts from a distance.',
  },
  {
    type: 'boar',
    name: 'Wild Tusker',
    role: 'Charging Berserker',
    threat: 'Medium',
    lore: 'A brutish brown beast that pauses to telegraph its fury before charging at lethal velocity.',
  },
  {
    type: 'frog',
    name: 'Marsh Toad',
    role: 'Leaping Ambusher',
    threat: 'Medium',
    lore: 'A bulbous green amphibian that sits deceptively quiet before bounding across obstacles directly toward the player.',
  },
  {
    type: 'mushroom',
    name: 'Spore Shroom',
    role: 'Toxic Area Denial',
    threat: 'Medium',
    lore: 'A deceptively smiling red-capped fungus that drifts steadily while scattering noxious spore puffs.',
  },
  {
    type: 'snail',
    name: 'Armored Snail',
    role: 'Juggernaut Tank',
    threat: 'High',
    lore: 'A heavily shelled snail whose dense shell deflects incoming damage, absorbing hits for the horde.',
  },
  {
    type: 'fire_imp',
    name: 'Infernal Flame Imp',
    role: 'Fireball Caster',
    threat: 'High',
    lore: 'A blazing elemental of pure fire that casts exploding fireballs and dashes with erratic fury.',
  },
  {
    type: 'ghost',
    name: 'Grim Wraith',
    role: 'Phasing Reaper',
    threat: 'Boss',
    lore: 'A hooded specter with a hollow bone mask that glides through obstacles, inflicting heavy contact damage.',
  },
];

export const BestiaryModal: React.FC<BestiaryModalProps> = ({ onClose }) => {
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);

  useEffect(() => {
    // Render animated sprite previews into canvas cells
    let animId: number;
    let tick = 0;

    const renderPreviews = () => {
      tick++;
      const frame = Math.floor(tick / 18) % 2;
      const playerFrame = Math.floor(tick / 12) % 4;

      BESTIARY_DATA.forEach((entry, idx) => {
        const c = canvasRefs.current[idx];
        if (!c) return;
        const ctx = c.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, c.width, c.height);

        let sprite;
        if (entry.type === 'player') {
          sprite = sprites.get(`player_${playerFrame}_normal`);
        } else {
          sprite = sprites.get(`enemy_${entry.type}_${frame}_normal`);
        }

        if (sprite) {
          ctx.imageSmoothingEnabled = false;
          const cx = c.width / 2;
          const cy = c.height / 2;
          ctx.drawImage(
            sprite.canvas,
            cx - sprite.originX,
            cy - sprite.originY
          );
        }
      });

      animId = requestAnimationFrame(renderPreviews);
    };

    animId = requestAnimationFrame(renderPreviews);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="flex flex-col w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-game tracking-wider text-slate-100">
                BESTIARY & HERITAGE
              </h2>
              <p className="text-xs text-slate-400">
                Examine the Valkyrie Maiden and the 9 fiends of the realm.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bestiary Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 my-4 overflow-y-auto pr-1 flex-1">
          {BESTIARY_DATA.map((entry, idx) => {
            const isHero = entry.type === 'player';
            const isBoss = entry.threat === 'Boss';

            return (
              <div
                key={entry.type}
                className={`flex gap-3.5 p-3.5 rounded-xl border transition-all ${
                  isHero
                    ? 'bg-amber-950/20 border-amber-500/50 shadow-[0_0_15px_rgba(251,191,36,0.15)]'
                    : isBoss
                      ? 'bg-rose-950/20 border-rose-600/50'
                      : 'bg-slate-950/70 border-slate-800'
                }`}
              >
                {/* Animated Sprite Canvas Display */}
                <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                  <canvas
                    ref={(el) => {
                      canvasRefs.current[idx] = el;
                    }}
                    width={56}
                    height={56}
                    className="pixelated"
                  />
                </div>

                {/* Details */}
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-100 text-sm font-game">
                      {entry.name}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                        isHero
                          ? 'text-amber-300 border-amber-600 bg-amber-950/60'
                          : isBoss
                            ? 'text-rose-300 border-rose-600 bg-rose-950/60'
                            : 'text-slate-400 border-slate-700 bg-slate-900'
                      }`}
                    >
                      {entry.threat}
                    </span>
                  </div>

                  <span className="text-[11px] text-amber-400 font-medium mt-0.5">
                    {entry.role}
                  </span>

                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {entry.lore}
                  </p>
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
            RETURN TO TITLE
          </button>
        </div>
      </div>
    </div>
  );
};
