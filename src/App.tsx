import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/engine';
import { GameState, BiomeId, Player } from './game/types';
import { BIOMES } from './game/map';
import { storage, ACHIEVEMENTS_CATALOG } from './game/storage';
import { sound } from './game/sound';
import { generateUpgradeChoices, UpgradeChoice, checkAvailableEvolution } from './game/weapons';
import { HUD } from './components/HUD';
import { LevelUpModal } from './components/LevelUpModal';
import { ChestModal } from './components/ChestModal';
import { PauseMenu } from './components/PauseMenu';
import { GameOverModal } from './components/GameOverModal';
import { MetaShopModal } from './components/MetaShopModal';
import { BestiaryModal } from './components/BestiaryModal';
import { AchievementsModal } from './components/AchievementsModal';
import { TouchJoystick } from './components/TouchJoystick';
import { HeroPreview } from './components/HeroPreview';
import {
  Play,
  ShoppingBag,
  Shield,
  Clock,
  Skull,
  Coins,
  Gamepad2,
  Keyboard,
  Info,
  BookOpen,
  Trophy,
  Wind,
  Zap,
  Trees,
  Flame,
  Ghost,
  Volume2,
  VolumeX,
  Sparkles,
  Swords,
  Star,
  Crown,
  ChevronRight,
} from 'lucide-react';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [selectedBiome, setSelectedBiome] = useState<BiomeId>('verdant');
  const [playerState, setPlayerState] = useState<Player | null>(null);
  const [survivalTime, setSurvivalTime] = useState<number>(0);
  const [kills, setKills] = useState<number>(0);
  const [lastInputType, setLastInputType] = useState<'keyboard' | 'gamepad' | 'touch'>('keyboard');

  // Modal States
  const [upgradeChoices, setUpgradeChoices] = useState<UpgradeChoice[]>([]);
  const [chestEvolution, setChestEvolution] = useState<{
    baseWeaponId: any;
    evolvedWeaponId: any;
  } | null>(null);
  const [chestGold, setChestGold] = useState<number>(100);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [showShop, setShowShop] = useState<boolean>(false);
  const [showHowToPlay, setShowHowToPlay] = useState<boolean>(false);
  const [showBestiary, setShowBestiary] = useState<boolean>(false);
  const [showAchievements, setShowAchievements] = useState<boolean>(false);
  const [hyperMode, setHyperMode] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Touch device detection
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  const handleToggleSound = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    sound.setMuted(nextMuted);
    if (!nextMuted) {
      sound.playCoinPickup();
    }
  };

  // Initialize Game Engine
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine(canvasRef.current, selectedBiome);
    engineRef.current = engine;

    engine.onLevelUp = () => {
      engine.setPaused(true);
      const choices = generateUpgradeChoices(engine.player);
      setUpgradeChoices(choices);
      setGameState('LEVEL_UP');
    };

    engine.onChestOpen = () => {
      engine.setPaused(true);
      const evo = checkAvailableEvolution(engine.player);
      if (evo) {
        engine.applyEvolution(evo.baseWeaponId, evo.evolvedWeaponId);
        setChestEvolution(evo);
      } else {
        setChestEvolution(null);
      }
      setChestGold(150 + Math.floor(Math.random() * 150));
      setGameState('CHEST_OPEN');
    };

    engine.onGameOver = (won: boolean) => {
      setIsVictory(won);
      setGameState(won ? 'VICTORY' : 'GAME_OVER');
    };

    // State sync loop for UI
    const syncInterval = setInterval(() => {
      if (engine.isRunning) {
        setPlayerState({ ...engine.player });
        setSurvivalTime(engine.survivalTime);
        setKills(engine.kills);
        setLastInputType(engine.lastInputType);
      }
    }, 100);

    return () => {
      clearInterval(syncInterval);
      engine.stop();
    };
  }, [selectedBiome]);

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (gameState === 'PLAYING') {
          engineRef.current?.setPaused(true);
          setGameState('PAUSED');
        } else if (gameState === 'PAUSED') {
          engineRef.current?.setPaused(false);
          setGameState('PLAYING');
        }
      } else if (gameState === 'TITLE_MENU') {
        if (
          (e.code === 'Enter' || e.code === 'Space') &&
          !showShop &&
          !showBestiary &&
          !showAchievements &&
          !showHowToPlay
        ) {
          e.preventDefault();
          handleStartGame(selectedBiome, hyperMode);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [gameState, selectedBiome, hyperMode, showShop, showBestiary, showAchievements, showHowToPlay]);

  // Launch new run
  const handleStartGame = (biome: BiomeId, isHyper: boolean = hyperMode) => {
    setSelectedBiome(biome);
    const engine = engineRef.current;
    if (engine) {
      engine.reset(biome);
      if (isHyper) {
        engine.player.stats.moveSpeed = Math.round(engine.player.stats.moveSpeed * 1.25);
        engine.player.stats.greed *= 1.5;
      }
      sound.playLevelUp();
      engine.start();
      setPlayerState({ ...engine.player });
      setGameState('PLAYING');
    }
  };

  const handleSelectUpgrade = (choice: UpgradeChoice) => {
    const engine = engineRef.current;
    if (!engine) return;

    if (choice.type === 'weapon_new' || choice.type === 'weapon_upgrade') {
      engine.applyUpgrade('weapon', choice.id);
    } else if (choice.type === 'passive_new' || choice.type === 'passive_upgrade') {
      engine.applyUpgrade('passive', choice.id);
    } else if (choice.type === 'gold_bag') {
      engine.player.gold += 100;
      sound.playCoinPickup();
    }

    engine.setPaused(false);
    setGameState('PLAYING');
  };

  const handleReroll = () => {
    const engine = engineRef.current;
    if (!engine || engine.player.stats.rerolls <= 0) return;

    engine.player.stats.rerolls -= 1;
    sound.playCoinPickup();
    const newChoices = generateUpgradeChoices(engine.player);
    setUpgradeChoices(newChoices);
  };

  const handleClaimChest = () => {
    const engine = engineRef.current;
    if (engine) {
      engine.setPaused(false);
      setGameState('PLAYING');
    }
  };

  const handleResume = () => {
    engineRef.current?.setPaused(false);
    setGameState('PLAYING');
  };

  const handleRestart = () => {
    handleStartGame(selectedBiome);
  };

  const handleQuitToMenu = () => {
    engineRef.current?.stop();
    setGameState('TITLE_MENU');
  };

  const handleDash = () => {
    engineRef.current?.triggerDash();
  };

  const handleUltimate = () => {
    engineRef.current?.triggerUltimate();
  };

  const handlePrayShrine = () => {
    engineRef.current?.prayAtNearbyShrine();
  };

  const handleJoystickMove = useCallback((vec: { x: number; y: number }) => {
    if (engineRef.current) {
      engineRef.current.joystickVector = vec;
    }
  }, []);

  const saveInfo = storage.getData();

  const formatClock = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 2D Pixel Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block pixelated"
      />

      {/* ACTIVE GAMEPLAY HUD */}
      {gameState === 'PLAYING' && playerState && (
        <>
          <HUD
            player={playerState}
            survivalTime={survivalTime}
            kills={kills}
            lastInputType={lastInputType}
            activeBoss={engineRef.current?.activeBoss}
            nearbyShrine={engineRef.current?.nearbyShrine}
            radarData={engineRef.current?.getRadarData()}
            activeSynergies={engineRef.current?.getActiveSynergies()}
            onDash={handleDash}
            onUltimate={handleUltimate}
            onPrayShrine={handlePrayShrine}
            onPause={() => {
              engineRef.current?.setPaused(true);
              setGameState('PAUSED');
            }}
          />

          {isTouchDevice && <TouchJoystick onMove={handleJoystickMove} />}
        </>
      )}

      {/* LEVEL UP MODAL */}
      {gameState === 'LEVEL_UP' && playerState && (
        <LevelUpModal
          choices={upgradeChoices}
          playerLevel={playerState.level}
          rerollsLeft={playerState.stats.rerolls}
          onSelect={handleSelectUpgrade}
          onReroll={handleReroll}
        />
      )}

      {/* CHEST MODAL */}
      {gameState === 'CHEST_OPEN' && (
        <ChestModal
          evolution={chestEvolution}
          goldAwarded={chestGold}
          onClaim={handleClaimChest}
        />
      )}

      {/* PAUSE MENU */}
      {gameState === 'PAUSED' && playerState && (
        <PauseMenu
          player={playerState}
          survivalTime={survivalTime}
          kills={kills}
          onResume={handleResume}
          onRestart={handleRestart}
          onQuitToMenu={handleQuitToMenu}
        />
      )}

      {/* GAME OVER / VICTORY MODAL */}
      {(gameState === 'GAME_OVER' || gameState === 'VICTORY') && playerState && (
        <GameOverModal
          isVictory={isVictory}
          player={playerState}
          survivalTime={survivalTime}
          kills={kills}
          newAchievements={engineRef.current?.newAchievementsThisRun}
          onPlayAgain={() => handleStartGame(selectedBiome)}
          onOpenShop={() => setShowShop(true)}
        />
      )}

      {/* PERMANENT POWER-UP META SHOP */}
      {showShop && <MetaShopModal onClose={() => setShowShop(false)} />}

      {/* HALL OF VALKYRIES (ACHIEVEMENTS MODAL) */}
      {showAchievements && <AchievementsModal onClose={() => setShowAchievements(false)} />}

      {/* BESTIARY & SPRITE SHOWCASE */}
      {showBestiary && <BestiaryModal onClose={() => setShowBestiary(false)} />}

      {/* HOW TO PLAY MODAL */}
      {showHowToPlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="flex flex-col w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-xl font-bold font-game text-amber-400 mb-3">
              HOW TO SURVIVE
            </h3>
            <div className="flex flex-col gap-3 text-xs text-slate-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              <p>
                ⚔️ <strong>Auto-Combat:</strong> Move using WASD, Arrow keys, or your Gamepad stick. Your weapons attack automatically on timer intervals.
              </p>
              <p>
                💨 <strong>Active Dash & I-Frames:</strong> Press <code>Space</code> or <code>Shift</code> (<code>B</code> / <code>RB</code> on Gamepad) to dodge roll with complete invulnerability through hordes and projectiles!
              </p>
              <p>
                ⚡ <strong>Charged Ultimate (Valkyrie Wrath):</strong> Collect gems and slay foes to charge your Holy Meter. Press <code>Q</code> or <code>F</code> (<code>Y</code> / <code>LB</code> on Gamepad) to rain down a screen-clearing sword nova!
              </p>
              <p>
                ⛩️ <strong>Mystery Shrines:</strong> Discover ancient risk-reward altars across the biomes. Press <code>E</code> to pray for immense stat buffs, gold, or treasure!
              </p>
              <p>
                🧭 <strong>Minimap Radar:</strong> Track incoming Boss Titans (red skull), Elites, Chests, and Shrines in the top-right radar.
              </p>
              <p>
                👑 <strong>Weapon Evolutions & Synergies:</strong> Max out any weapon to Level 8, pair it with its passive, and crack open a Boss Chest to evolve it. Discover special visual combos like Plasma Overload and Shield Shockwave!
              </p>
              <p>
                💰 <strong>Permanent Power:</strong> Gold coins persist forever. Spend them in the Power-Up Shop to permanently raise your Might, Health, Armor, and Recovery.
              </p>
            </div>
            <button
              onClick={() => setShowHowToPlay(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-game transition-all cursor-pointer"
            >
              GOT IT
            </button>
          </div>
        </div>
      )}

      {/* TITLE MENU */}
      {gameState === 'TITLE_MENU' && (
        <div className="fixed inset-0 z-40 flex flex-col justify-between p-4 sm:p-7 md:p-8 overflow-y-auto bg-slate-950/95 backdrop-blur-md">
          {/* Dynamic Biome Ambient Glow Backdrop */}
          <div
            className={`absolute inset-0 pointer-events-none transition-all duration-700 opacity-40 ${
              selectedBiome === 'verdant'
                ? 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-600/30 via-slate-950/40 to-slate-950'
                : selectedBiome === 'scorched'
                ? 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-600/30 via-slate-950/40 to-slate-950'
                : 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-600/30 via-slate-950/40 to-slate-950'
            }`}
          />

          {/* Atmospheric Floating Embers / Sparks */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(18)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full"
                style={{
                  left: `${(i * 19) % 100}%`,
                  bottom: `${(i * 13) % 40}%`,
                  backgroundColor:
                    selectedBiome === 'verdant'
                      ? i % 2 === 0
                        ? '#4ade80'
                        : '#facc15'
                      : selectedBiome === 'scorched'
                      ? i % 2 === 0
                        ? '#ea580c'
                        : '#facc15'
                      : i % 2 === 0
                      ? '#c084fc'
                      : '#38bdf8',
                  boxShadow: '0 0 8px currentColor',
                  animation: `emberRise ${2.5 + (i % 4) * 0.8}s ease-in-out infinite`,
                  animationDelay: `${(i * 0.35) % 3}s`,
                }}
              />
            ))}
          </div>

          {/* Top Brand & Navigation Header */}
          <header className="relative z-10 flex flex-wrap items-center justify-between gap-4 w-full max-w-6xl mx-auto pb-3 border-b border-slate-800/80">
            {/* Title / Brand */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)]">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-game font-black text-xl sm:text-2xl text-slate-100 tracking-wider text-gold-gleam">
                    VALKYRIE SURVIVORS
                  </h1>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold hidden sm:inline-block">
                    v1.2 PIXEL EDITION
                  </span>
                </div>
                <p className="text-[11px] font-mono text-slate-400">
                  Top-Down Procedural Horde Roguelike · 9 Beasts · Evolutions
                </p>
              </div>
            </div>

            {/* Top Controls & Meta Shop Links */}
            <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
              {/* Gold Bank & Meta-Shop Shortcut */}
              <button
                onClick={() => setShowShop(true)}
                title="Open Power-Up Shop"
                className="flex items-center gap-2 bg-slate-900/90 hover:bg-slate-800 border border-amber-500/40 hover:border-amber-400 px-3 py-1.5 rounded-xl text-xs transition-all shadow-md active:scale-95 cursor-pointer group"
              >
                <Coins className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="font-mono font-bold text-amber-300">
                  {saveInfo.gold.toLocaleString()} G
                </span>
                <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">
                  +Power-Ups
                </span>
              </button>

              {/* Achievements Modal */}
              <button
                onClick={() => setShowAchievements(true)}
                className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-slate-600 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Achievements</span>
                <span className="text-[10px] font-mono px-1.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                  {Object.keys(saveInfo.achievements || {}).length}/{ACHIEVEMENTS_CATALOG.length}
                </span>
              </button>

              {/* Bestiary Modal */}
              <button
                onClick={() => setShowBestiary(true)}
                className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-slate-600 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                <span>Bestiary</span>
                <span className="text-[10px] font-mono px-1.5 rounded bg-slate-800 text-emerald-300 border border-slate-700">
                  9
                </span>
              </button>

              {/* Sound SFX / Music Toggle */}
              <button
                onClick={handleToggleSound}
                title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all active:scale-95 cursor-pointer ${
                  isMuted
                    ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                    : 'bg-slate-900/90 border-slate-700/80 text-slate-200 hover:border-slate-600'
                }`}
              >
                {isMuted ? (
                  <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span className="font-mono text-[11px]">{isMuted ? 'Muted' : 'SFX ON'}</span>
              </button>

              {/* Guide / Controls */}
              <button
                onClick={() => setShowHowToPlay(true)}
                title="How to play guide"
                className="flex items-center gap-1 p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-amber-400 border border-slate-700/80 transition-all cursor-pointer"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Main Stage: Hero Showcase & Biome Battlegrounds */}
          <main className="relative z-10 w-full max-w-6xl mx-auto my-auto py-4 sm:py-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              {/* Left Column: Interactive Hero Showcase (5 cols) */}
              <div className="lg:col-span-5 flex flex-col justify-center">
                <HeroPreview />
              </div>

              {/* Right Column: Biome Expedition Theater & Launch (7 cols) */}
              <div className="lg:col-span-7 flex flex-col justify-between gap-4 bg-slate-900/60 backdrop-blur-md border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-2xl">
                <div>
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                    <div>
                      <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase font-semibold">
                        STEP 1 · SELECT REALM
                      </span>
                      <h2 className="text-base sm:text-lg font-bold font-game text-slate-100 flex items-center gap-2">
                        <span>EXPEDITION BATTLEGROUND</span>
                      </h2>
                    </div>

                    <div className="text-[11px] font-mono text-slate-400">
                      Pick your hunting ground
                    </div>
                  </div>

                  {/* Biome Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Verdant Meadows */}
                    <button
                      onClick={() => {
                        setSelectedBiome('verdant');
                        sound.playCoinPickup();
                      }}
                      className={`flex flex-col p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                        selectedBiome === 'verdant'
                          ? 'border-emerald-400 bg-gradient-to-b from-emerald-950/60 to-slate-900 shadow-[0_0_20px_rgba(52,211,153,0.25)] scale-[1.02]'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          <Trees className="w-4 h-4" />
                        </div>
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                          ★☆☆☆☆ Normal
                        </span>
                      </div>
                      <span className="text-xs font-bold text-slate-100 font-game mb-1">
                        Verdant Meadows
                      </span>
                      <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                        Ancient ruins overgrown with wildflowers and mossy altars.
                      </p>
                      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-emerald-400">
                        <span>Boss: Treant</span>
                        <span>1.0x EXP</span>
                      </div>
                    </button>

                    {/* Scorched Crypts */}
                    <button
                      onClick={() => {
                        setSelectedBiome('scorched');
                        sound.playCoinPickup();
                      }}
                      className={`flex flex-col p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                        selectedBiome === 'scorched'
                          ? 'border-orange-400 bg-gradient-to-b from-orange-950/60 to-slate-900 shadow-[0_0_20px_rgba(251,146,60,0.25)] scale-[1.02]'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-1.5 rounded-lg bg-orange-500/20 text-orange-300 border border-orange-500/40">
                          <Flame className="w-4 h-4" />
                        </div>
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-orange-950 text-orange-300 border border-orange-800">
                          ★★★☆☆ Hard
                        </span>
                      </div>
                      <span className="text-xs font-bold text-slate-100 font-game mb-1">
                        Scorched Crypts
                      </span>
                      <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                        Volcanic basalt slabs etched with embers and magma fissures.
                      </p>
                      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-orange-400">
                        <span>Boss: Magma Wyrm</span>
                        <span>+20% Gold</span>
                      </div>
                    </button>

                    {/* Haunted Mire */}
                    <button
                      onClick={() => {
                        setSelectedBiome('haunted');
                        sound.playCoinPickup();
                      }}
                      className={`flex flex-col p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                        selectedBiome === 'haunted'
                          ? 'border-purple-400 bg-gradient-to-b from-purple-950/60 to-slate-900 shadow-[0_0_20px_rgba(192,132,252,0.25)] scale-[1.02]'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40">
                          <Ghost className="w-4 h-4" />
                        </div>
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                          ★★★★★ Nightmare
                        </span>
                      </div>
                      <span className="text-xs font-bold text-slate-100 font-game mb-1">
                        Haunted Mire
                      </span>
                      <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                        Murky swamp surrounded by glowing fungi and cursed barrows.
                      </p>
                      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-purple-400">
                        <span>Boss: Lich Shade</span>
                        <span>+40% EXP/G</span>
                      </div>
                    </button>
                  </div>

                  {/* Run Modifier / Hyper Mode Switch */}
                  <div className="mt-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg border transition-colors ${
                          hyperMode
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                            : 'bg-slate-800/60 border-slate-700 text-slate-400'
                        }`}
                      >
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                          <span>Hyper Mode</span>
                          {hyperMode && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          +25% Movement Speed, +50% Gold drops, faster horde waves
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setHyperMode(!hyperMode);
                        sound.playCoinPickup();
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                        hyperMode ? 'bg-amber-500' : 'bg-slate-800'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          hyperMode ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Big Launch CTA Button */}
                <div className="pt-2">
                  <button
                    onClick={() => handleStartGame(selectedBiome, hyperMode)}
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black font-game text-lg sm:text-xl tracking-widest shadow-[0_0_35px_rgba(251,191,36,0.6)] active:scale-98 transition-all flex items-center justify-center gap-3 cursor-pointer animate-pulse-gold group"
                  >
                    <Play className="w-6 h-6 fill-current group-hover:scale-110 transition-transform" />
                    <span>COMMENCE EXPEDITION</span>
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <div className="flex items-center justify-center gap-2 mt-2 text-[11px] font-mono text-slate-400">
                    <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-400">
                      SPACE
                    </span>
                    <span>or</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-400">
                      ENTER
                    </span>
                    <span>to Deploy instantly</span>
                  </div>
                </div>
              </div>
            </div>
          </main>

          {/* Footer Metrics & Controls Info */}
          <footer className="relative z-10 flex flex-col sm:flex-row items-center justify-between w-full max-w-6xl mx-auto gap-3 text-xs text-slate-400 pt-3 border-t border-slate-800/80">
            {/* Lifetime stats */}
            <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
              <span className="flex items-center gap-1.5 font-mono">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Best Record: {formatClock(saveInfo.highestSurvivalTime)}</span>
              </span>
              <span className="flex items-center gap-1.5 font-mono">
                <Skull className="w-3.5 h-3.5 text-rose-400" />
                <span>Slain Fiends: {saveInfo.lifetimeKills.toLocaleString()}</span>
              </span>
              <span className="flex items-center gap-1.5 font-mono">
                <Shield className="w-3.5 h-3.5 text-sky-400" />
                <span>Expeditions: {saveInfo.runsPlayed}</span>
              </span>
            </div>

            {/* Controls hints */}
            <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono">
              <div className="flex items-center gap-2">
                <Keyboard className="w-3.5 h-3.5 text-amber-400" />
                <span>WASD / Arrows to Move</span>
                <span>·</span>
                <span>Space to Dash</span>
                <span>·</span>
                <span>Q/F for Ult</span>
              </div>
              <div className="hidden md:flex items-center gap-1 text-slate-500">
                <span>·</span>
                <Gamepad2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Gamepad Supported</span>
              </div>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
}
