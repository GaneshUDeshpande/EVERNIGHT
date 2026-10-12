import React, { useEffect, useRef } from 'react';
import { Player, Enemy, ShrineObject } from '../game/types';
import { WEAPON_REGISTRY, PASSIVE_REGISTRY } from '../game/weapons';
import {
  Skull,
  Coins,
  Pause,
  Gamepad2,
  Keyboard,
  Heart,
  ShieldAlert,
  Zap,
  Wind,
  Sparkles,
  Compass,
} from 'lucide-react';

export interface RadarData {
  playerPos: { x: number; y: number; facing: number };
  blips: { type: 'boss' | 'elite' | 'chest' | 'shrine'; x: number; y: number }[];
}

export interface WeaponSynergy {
  name: string;
  icon: string;
  desc: string;
}

interface HUDProps {
  player: Player;
  survivalTime: number;
  kills: number;
  lastInputType: 'keyboard' | 'gamepad' | 'touch';
  activeBoss?: Enemy | null;
  nearbyShrine?: ShrineObject | null;
  radarData?: RadarData | null;
  activeSynergies?: WeaponSynergy[];
  onDash?: () => void;
  onUltimate?: () => void;
  onPrayShrine?: () => void;
  onPause: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  player,
  survivalTime,
  kills,
  lastInputType,
  activeBoss,
  nearbyShrine,
  radarData,
  activeSynergies = [],
  onDash,
  onUltimate,
  onPrayShrine,
  onPause,
}) => {
  const radarCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const xpPercent = Math.min(100, Math.floor((player.xp / player.nextLevelXp) * 100));
  const dashCooldownRatio = Math.max(0, player.dashCooldown / (player.dashCooldownMax || 2.8));
  const ultimateRatio = Math.min(100, Math.floor((player.ultimateCharge / player.ultimateMax) * 100));
  const isUltimateReady = player.isUltimateReady || ultimateRatio >= 100;

  // Draw Minimap Radar
  useEffect(() => {
    const canvas = radarCanvasRef.current;
    if (!canvas || !radarData) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 110;
    const center = size / 2;
    const radarRange = 1500; // world units
    const radarRadius = 46;

    ctx.clearRect(0, 0, size, size);

    // Radar background circle
    ctx.fillStyle = 'rgba(10, 15, 29, 0.88)';
    ctx.beginPath();
    ctx.arc(center, center, radarRadius, 0, Math.PI * 2);
    ctx.fill();

    // Range rings
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(center, center, radarRadius * 0.5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(center, center, radarRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Crosshairs
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.beginPath();
    ctx.moveTo(center - radarRadius, center);
    ctx.lineTo(center + radarRadius, center);
    ctx.moveTo(center, center - radarRadius);
    ctx.lineTo(center, center + radarRadius);
    ctx.stroke();

    // Radar blips
    const pPos = radarData.playerPos;
    for (const blip of radarData.blips) {
      const dx = blip.x - pPos.x;
      const dy = blip.y - pPos.y;
      const dist = Math.hypot(dx, dy);

      if (dist <= radarRange) {
        const bx = center + (dx / radarRange) * radarRadius;
        const by = center + (dy / radarRange) * radarRadius;

        if (blip.type === 'boss') {
          // Boss: pulsating bright red ring & dot
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(bx, by, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else if (blip.type === 'elite') {
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.arc(bx, by, 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (blip.type === 'chest') {
          ctx.fillStyle = '#eab308';
          ctx.beginPath();
          ctx.arc(bx, by, 3, 0, Math.PI * 2);
          ctx.fill();
        } else if (blip.type === 'shrine') {
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(bx, by, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Player arrow in center
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    const face = pPos.facing >= 0 ? 1 : -1;
    ctx.moveTo(center + face * 5, center);
    ctx.lineTo(center - face * 4, center - 4);
    ctx.lineTo(center - face * 4, center + 4);
    ctx.closePath();
    ctx.fill();
  }, [radarData]);

  return (
    <div className="pointer-events-none fixed inset-0 flex flex-col justify-between p-3 sm:p-4 z-20 select-none">
      {/* Top Section: XP Bar, Status Bar, Boss Health, Radar */}
      <div className="flex flex-col gap-2 w-full">
        {/* Full-Width Vampire Survivors XP Bar */}
        <div className="w-full bg-slate-900/90 border border-slate-700/80 rounded-md p-1 shadow-lg backdrop-blur-xs">
          <div className="relative h-4 w-full bg-slate-950 rounded overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-150 ease-out shadow-[0_0_12px_rgba(52,211,153,0.6)]"
              style={{ width: `${xpPercent}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-sm font-mono tracking-wider">
              LV {player.level} · {xpPercent}%
            </div>
          </div>
        </div>

        {/* Top Info Bar with Minimap Radar */}
        <div className="flex items-start justify-between gap-2">
          {/* Active Weapon Slots (Up to 6) */}
          <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-900/85 border border-slate-700/70 rounded-xl p-1.5 backdrop-blur-xs shadow-md">
            {Array.from({ length: 6 }).map((_, i) => {
              const activeWeapon = player.weapons[i];
              if (!activeWeapon) {
                return (
                  <div
                    key={`weapon-empty-${i}`}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-slate-800 bg-slate-950/60 flex items-center justify-center text-[10px] text-slate-600"
                  >
                    -
                  </div>
                );
              }
              const def = WEAPON_REGISTRY[activeWeapon.id];
              return (
                <div
                  key={activeWeapon.id}
                  className={`relative w-7 h-7 sm:w-8 sm:h-8 rounded-lg border ${
                    def.isEvolved
                      ? 'border-amber-400 bg-amber-950/40 shadow-[0_0_10px_rgba(251,191,36,0.3)]'
                      : 'border-slate-600 bg-slate-800/80'
                  } flex flex-col items-center justify-center text-xs group`}
                  title={`${def.name} Lv.${activeWeapon.level}`}
                >
                  <span className="text-xs sm:text-sm">{def.icon}</span>
                  <div className="absolute -bottom-1 -right-1 bg-slate-950 text-[9px] font-mono font-bold px-1 rounded border border-slate-700 text-amber-300">
                    {activeWeapon.level}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Center Run Clock */}
          <div className="flex flex-col items-center bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 sm:px-5 py-1.5 shadow-md backdrop-blur-xs">
            <span className="font-mono text-lg sm:text-xl font-black text-amber-400 tracking-wider">
              {formatTime(survivalTime)}
            </span>
            <div className="flex items-center gap-3 sm:gap-4 text-xs font-medium text-slate-300 mt-0.5">
              <span className="flex items-center gap-1 text-rose-400">
                <Skull className="w-3.5 h-3.5" />
                <span className="font-mono tabular-nums">{kills}</span>
              </span>
              <span className="flex items-center gap-1 text-amber-300">
                <Coins className="w-3.5 h-3.5" />
                <span className="font-mono tabular-nums">{player.gold}</span>
              </span>
            </div>
          </div>

          {/* Active Passive Slots (Up to 6) */}
          <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-900/85 border border-slate-700/70 rounded-xl p-1.5 backdrop-blur-xs shadow-md">
            {Array.from({ length: 6 }).map((_, i) => {
              const activePassive = player.passives[i];
              if (!activePassive) {
                return (
                  <div
                    key={`passive-empty-${i}`}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-slate-800 bg-slate-950/60 flex items-center justify-center text-[10px] text-slate-600"
                  >
                    -
                  </div>
                );
              }
              const def = PASSIVE_REGISTRY[activePassive.id];
              return (
                <div
                  key={activePassive.id}
                  className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-teal-600/80 bg-teal-950/40 flex flex-col items-center justify-center text-xs"
                  title={`${def.name} Lv.${activePassive.level}`}
                >
                  <span className="text-xs sm:text-sm">{def.icon}</span>
                  <div className="absolute -bottom-1 -right-1 bg-slate-950 text-[9px] font-mono font-bold px-1 rounded border border-slate-700 text-emerald-400">
                    {activePassive.level}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Minimap Radar Widget */}
          <div className="hidden sm:flex flex-col items-center bg-slate-900/90 border border-cyan-500/40 rounded-xl p-1 shadow-md backdrop-blur-xs">
            <div className="relative w-[110px] h-[110px]">
              <canvas
                ref={radarCanvasRef}
                width={110}
                height={110}
                className="w-full h-full rounded-lg"
              />
              <div className="absolute bottom-1 right-1 flex items-center gap-1 text-[8px] font-bold text-cyan-400 bg-slate-950/80 px-1 rounded">
                <Compass className="w-2.5 h-2.5" />
                <span>RADAR</span>
              </div>
            </div>
          </div>
        </div>

        {/* Active Weapon Synergy Combos Indicator */}
        {activeSynergies.length > 0 && (
          <div className="flex items-center gap-2 self-start">
            {activeSynergies.map((syn) => (
              <div
                key={syn.name}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-950/70 border border-purple-500/60 rounded-lg text-[11px] font-bold text-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.3)] animate-pulse"
                title={syn.desc}
              >
                <span>{syn.icon}</span>
                <span>{syn.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Boss Encounter Health Bar */}
        {activeBoss && (
          <div className="w-full max-w-md mx-auto flex flex-col gap-1 bg-slate-900/90 border border-rose-600/80 rounded-xl p-2.5 shadow-[0_0_20px_rgba(225,29,72,0.35)] backdrop-blur-xs animate-in fade-in duration-300">
            <div className="flex items-center justify-between text-xs font-bold text-rose-400">
              <span className="flex items-center gap-1.5 font-game tracking-wider">
                <ShieldAlert className="w-4 h-4 text-rose-500 animate-pulse" />
                <span>BOSS: {activeBoss.type.toUpperCase()}</span>
              </span>
              <span className="font-mono text-slate-300">
                {Math.max(0, activeBoss.hp)} / {activeBoss.maxHp} HP
              </span>
            </div>
            <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-rose-900">
              <div
                className="h-full bg-gradient-to-r from-rose-600 via-red-500 to-amber-500 transition-all duration-150 ease-out"
                style={{
                  width: `${Math.max(0, Math.min(100, (activeBoss.hp / activeBoss.maxHp) * 100))}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Mystery Shrine Proximity Prompt */}
        {nearbyShrine && !nearbyShrine.used && (
          <div className="pointer-events-auto w-full max-w-md mx-auto flex items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-400/80 rounded-xl p-3 shadow-[0_0_20px_rgba(99,102,241,0.4)] backdrop-blur-md animate-bounce">
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300 font-game">
                <span>⛩️</span>
                <span>{nearbyShrine.title}</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">{nearbyShrine.description}</p>
            </div>
            <button
              onClick={onPrayShrine}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              [E] Pray
            </button>
          </div>
        )}
      </div>

      {/* Bottom Section: Health bar, Dash & Ultimate Actions, and Pause */}
      <div className="flex items-end justify-between w-full gap-2">
        {/* HP Bar and Revival Counter */}
        <div className="flex flex-col gap-1 bg-slate-900/90 border border-slate-700/80 rounded-xl p-3 shadow-lg backdrop-blur-xs min-w-[190px] sm:min-w-[220px]">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-rose-400">
              <Heart className="w-3.5 h-3.5 fill-rose-500" />
              <span>Health</span>
            </span>
            <span className="font-mono tabular-nums text-slate-200 text-xs">
              {Math.max(0, Math.round(player.stats.currentHp))} / {player.stats.maxHp}
            </span>
          </div>
          <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-100 ease-out"
              style={{
                width: `${Math.max(0, Math.min(100, (player.stats.currentHp / player.stats.maxHp) * 100))}%`,
              }}
            />
          </div>
          {player.stats.revivals > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-amber-400 font-semibold mt-0.5">
              <span>✨ Revivals Remaining:</span>
              <span className="font-mono font-bold">{player.stats.revivals}</span>
            </div>
          )}
        </div>

        {/* Action Buttons: Active Dash & Charged Ultimate */}
        <div className="flex items-center gap-3">
          {/* Dash Skill Button / Cooldown */}
          <button
            onClick={onDash}
            disabled={player.dashCooldown > 0}
            className={`pointer-events-auto relative flex flex-col items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border transition-all active:scale-90 cursor-pointer ${
              player.dashCooldown <= 0
                ? 'border-cyan-400 bg-cyan-950/60 shadow-[0_0_15px_rgba(6,182,212,0.4)] text-cyan-200'
                : 'border-slate-700 bg-slate-950/80 text-slate-500 cursor-not-allowed'
            }`}
            title="Dash / Dodge Roll (Space / Shift)"
          >
            <Wind className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-[9px] font-mono font-bold mt-0.5">
              {player.dashCooldown > 0 ? `${player.dashCooldown.toFixed(1)}s` : 'SPACE'}
            </span>

            {/* Cooldown sweep overlay */}
            {dashCooldownRatio > 0 && (
              <div
                className="absolute inset-0 bg-slate-950/70 rounded-2xl transition-all pointer-events-none"
                style={{ clipPath: `inset(${100 - dashCooldownRatio * 100}% 0 0 0)` }}
              />
            )}
          </button>

          {/* Charged Ultimate: Valkyrie Wrath */}
          <button
            onClick={onUltimate}
            disabled={!isUltimateReady}
            className={`pointer-events-auto relative flex flex-col items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border transition-all active:scale-90 cursor-pointer ${
              isUltimateReady
                ? 'border-amber-400 bg-gradient-to-t from-amber-950 via-yellow-900 to-amber-700 text-amber-100 shadow-[0_0_20px_rgba(245,158,11,0.6)] animate-pulse'
                : 'border-slate-700 bg-slate-950/80 text-slate-500 cursor-not-allowed'
            }`}
            title="Valkyrie Wrath (Q / F)"
          >
            <Zap className={`w-5 h-5 sm:w-6 sm:h-6 ${isUltimateReady ? 'text-amber-300' : ''}`} />
            <span className="text-[9px] font-mono font-bold mt-0.5">
              {isUltimateReady ? 'READY [Q]' : `${ultimateRatio}%`}
            </span>

            {/* Ultimate charge level bar */}
            {!isUltimateReady && (
              <div className="absolute bottom-1 left-2 right-2 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 transition-all duration-100"
                  style={{ width: `${ultimateRatio}%` }}
                />
              </div>
            )}
          </button>
        </div>

        {/* Input device indicator & Pause Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-900/80 border border-slate-700/60 rounded-lg px-2.5 py-1 text-slate-400 text-xs backdrop-blur-xs">
            {lastInputType === 'gamepad' ? (
              <>
                <Gamepad2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px]">Controller</span>
              </>
            ) : (
              <>
                <Keyboard className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[11px]">WASD / Space / Q</span>
              </>
            )}
          </div>

          <button
            onClick={onPause}
            className="pointer-events-auto flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 active:scale-95 text-slate-200 border border-slate-700/80 rounded-xl px-3 sm:px-3.5 py-2 text-xs font-medium transition-all shadow-md cursor-pointer"
          >
            <Pause className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Pause (Esc)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
