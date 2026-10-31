import React, { useEffect, useRef, useState } from 'react';
import { sprites } from '../game/sprites';
import { sound } from '../game/sound';
import { storage } from '../game/storage';
import { Shield, Sparkles, Zap, Wind, Heart, Swords, Footprints, Image as ImageIcon, Play } from 'lucide-react';
import valkyriePortrait from '../assets/images/valkyrie_hero_portrait_1793427447819.jpg';

export function HeroPreview() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [animState, setAnimState] = useState<'walk' | 'attack'>('walk');
  const [frameIndex, setFrameIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'portrait' | 'sprite'>('portrait');

  const baseStats = storage.calculatePlayerBaseStats();

  useEffect(() => {
    sprites.init();
    let frame = 0;
    const interval = setInterval(() => {
      frame = (frame + 1) % 4;
      setFrameIndex(frame);
    }, 160);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (viewMode !== 'sprite') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2 + 10;

    // 1. Draw glowing Valkyrie ground rune circle
    const time = Date.now() * 0.003;
    const pulse = Math.sin(time) * 4;
    ctx.save();
    ctx.translate(cx, cy + 28);
    ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 36 + pulse, 12 + pulse * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 32, 10, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 2. Determine sprite
    let spriteKey = `player_${frameIndex}_normal`;
    if (animState === 'attack') {
      spriteKey = 'player_attack_normal';
    }

    const spr = sprites.get(spriteKey);
    if (spr) {
      const scale = 2.4;
      ctx.drawImage(
        spr.canvas,
        cx - spr.originX * scale,
        cy - spr.originY * scale + 24,
        spr.width * scale,
        spr.height * scale
      );
    }

    // 3. Draw slash effect if attacking
    if (animState === 'attack') {
      const slash = sprites.get('slash_gold');
      if (slash) {
        ctx.save();
        ctx.translate(cx + 25, cy - 5);
        ctx.drawImage(slash.canvas, -slash.originX, -slash.originY);
        ctx.restore();
      }
    }
  }, [frameIndex, animState, viewMode]);

  const handleTriggerAttack = () => {
    if (viewMode !== 'sprite') {
      setViewMode('sprite');
    }
    if (animState === 'attack') return;
    setAnimState('attack');
    sound.playSlash();
    setTimeout(() => {
      setAnimState('walk');
    }, 450);
  };

  return (
    <div className="flex flex-col bg-slate-950/80 backdrop-blur-md border border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-2xl relative overflow-hidden group">
      {/* Background ambient rune glow */}
      <div className="absolute -top-16 -left-16 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Hero Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase font-semibold">
            LEAD CHAMPION · REALM DEFENDER
          </span>
          <h3 className="text-base sm:text-lg font-bold font-game text-slate-100 flex items-center gap-2">
            <span>VALKYRIE MAIDEN</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              MELEE / HOLY
            </span>
          </h3>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('portrait')}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              viewMode === 'portrait'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Portrait
          </button>
          <button
            onClick={() => {
              setViewMode('sprite');
              sound.playCoinPickup();
            }}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              viewMode === 'sprite'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Live Sprite
          </button>
        </div>
      </div>

      {/* Center Character Visual & Combat Loadout */}
      <div className="flex flex-col sm:flex-row items-center gap-4 my-3">
        {/* Character Display: High-Res Pixel Portrait OR Animated Sprite */}
        {viewMode === 'portrait' ? (
          <div className="relative group/portrait cursor-pointer shrink-0" onClick={handleTriggerAttack}>
            <div className="w-36 h-36 rounded-xl overflow-hidden border-2 border-amber-500/50 shadow-xl bg-slate-900 relative">
              <img
                src={valkyriePortrait}
                alt="Valkyrie Hero Maiden"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover pixelated hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-1.5 inset-x-0 text-center text-[10px] font-mono text-amber-300 font-semibold drop-shadow">
                Sword Maiden
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleTriggerAttack();
              }}
              className="mt-1.5 w-full flex items-center justify-center gap-1 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-semibold cursor-pointer active:scale-95 transition-all"
            >
              <Swords className="w-3 h-3" />
              <span>Test Slash</span>
            </button>
          </div>
        ) : (
          <div
            onClick={handleTriggerAttack}
            className="relative cursor-pointer shrink-0 flex flex-col items-center justify-center bg-slate-950/90 border border-amber-500/30 rounded-xl p-2 group-hover:border-amber-400/50 transition-all shadow-inner w-36 h-36"
          >
            <canvas
              ref={canvasRef}
              width={140}
              height={140}
              className="pixelated block drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
            />
            <div className="absolute bottom-1.5 text-[9px] font-mono text-slate-400 bg-slate-900/90 px-1.5 py-0.5 rounded border border-slate-700">
              Click to Slash
            </div>
          </div>
        )}

        {/* Hero Combat Loadout */}
        <div className="flex flex-col gap-2 w-full text-xs">
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-start gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 mt-0.5">
              <Swords className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-slate-200 text-xs">Celestial Greatsword</div>
              <div className="text-[11px] text-slate-400">Sweeping arc cleave with continuous area damage</div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-start gap-2.5">
            <div className="p-1.5 rounded-lg bg-sky-500/20 border border-sky-500/30 text-sky-400 mt-0.5">
              <Wind className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-slate-200 text-xs flex items-center gap-2">
                <span>Valkyrie Dash</span>
                <span className="font-mono text-[10px] px-1 rounded bg-sky-950 text-sky-300 border border-sky-800">
                  SPACE / SHIFT
                </span>
              </div>
              <div className="text-[11px] text-slate-400">Invulnerable roll with complete I-Frames</div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-start gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-400/20 border border-amber-400/30 text-amber-300 mt-0.5">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-slate-200 text-xs flex items-center gap-2">
                <span>Valkyrie Wrath (Ult)</span>
                <span className="font-mono text-[10px] px-1 rounded bg-amber-950 text-amber-300 border border-amber-800">
                  Q / F
                </span>
              </div>
              <div className="text-[11px] text-slate-400">Screen-clearing holy sword bombardment</div>
            </div>
          </div>
        </div>
      </div>

      {/* Base Attributes Bar */}
      <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-800 text-center">
        <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <Heart className="w-3 h-3 text-rose-400" /> HP
          </span>
          <span className="font-mono font-bold text-slate-200 text-xs">{baseStats.maxHp}</span>
        </div>

        <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <Swords className="w-3 h-3 text-amber-400" /> Might
          </span>
          <span className="font-mono font-bold text-amber-300 text-xs">
            {Math.round(baseStats.might * 100)}%
          </span>
        </div>

        <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <Shield className="w-3 h-3 text-blue-400" /> Armor
          </span>
          <span className="font-mono font-bold text-blue-300 text-xs">+{baseStats.armor}</span>
        </div>

        <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <Footprints className="w-3 h-3 text-emerald-400" /> Speed
          </span>
          <span className="font-mono font-bold text-emerald-300 text-xs">{baseStats.moveSpeed}</span>
        </div>
      </div>
    </div>
  );
}
