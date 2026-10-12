import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/engine';
import { GameState, BiomeId, Player } from './game/types';
import { BIOMES } from './game/map';
import { storage } from './game/storage';
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

  // Touch device detection
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

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
      }
    };

    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [gameState]);

  // Launch new run
  const handleStartGame = (biome: BiomeId) => {
    setSelectedBiome(biome);
    const engine = engineRef.current;
    if (engine) {
      engine.reset(biome);
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
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-between p-6 sm:p-10 bg-gradient-to-b from-slate-950/95 via-slate-900/90 to-slate-950/95 backdrop-blur-xs">
          {/* Top Brand Bar */}
          <div className="flex items-center justify-between w-full max-w-5xl">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-amber-400" />
              <span className="font-game font-bold text-lg text-slate-100 tracking-wider">
                VALKYRIE SURVIVORS
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-900/90 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs">
                <Coins className="w-4 h-4 text-amber-400" />
                <span className="font-mono font-bold text-amber-300">
                  {saveInfo.gold.toLocaleString()} G
                </span>
              </div>

              <button
                onClick={() => setShowAchievements(true)}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer"
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Achievements</span>
              </button>

              <button
                onClick={() => setShowBestiary(true)}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>Bestiary</span>
              </button>

              <button
                onClick={() => setShowShop(true)}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-amber-400" />
                <span>Power-Ups</span>
              </button>
            </div>
          </div>

          {/* Center Title & Biome Selection */}
          <div className="flex flex-col items-center text-center max-w-2xl my-auto">
            <span className="text-xs font-bold font-mono tracking-widest text-amber-400 uppercase mb-2">
              ROGUE-LITE HORDE SURVIVAL
            </span>
            <h1 className="text-4xl sm:text-6xl font-black font-game text-slate-100 tracking-wider drop-shadow-[0_0_25px_rgba(251,191,36,0.25)]">
              VALKYRIE SURVIVORS
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-3 max-w-lg leading-relaxed">
              Command the Sword Maiden against thousands of relentless fiends. Forge unstoppable weapon evolutions and carve your legend.
            </p>

            {/* Biome Selection Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mt-8 mb-6">
              {(Object.keys(BIOMES) as BiomeId[]).map((bId) => {
                const b = BIOMES[bId];
                const isSelected = selectedBiome === bId;

                return (
                  <button
                    key={bId}
                    onClick={() => setSelectedBiome(bId)}
                    className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-amber-400 bg-slate-800/90 shadow-[0_0_20px_rgba(251,191,36,0.2)] scale-[1.02]'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-100 font-game mb-1">
                      {b.name}
                    </span>
                    <p className="text-[11px] text-slate-400 leading-normal line-clamp-2">
                      {b.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Launch Run Button */}
            <button
              onClick={() => handleStartGame(selectedBiome)}
              className="py-4 px-10 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black font-game text-lg tracking-widest shadow-[0_0_30px_rgba(251,191,36,0.5)] active:scale-95 transition-all flex items-center gap-3 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>COMMENCE BATTLE</span>
            </button>
          </div>

          {/* Footer Metrics & Controls Info */}
          <div className="flex flex-col sm:flex-row items-center justify-between w-full max-w-5xl gap-4 text-xs text-slate-400 pt-4 border-t border-slate-900">
            {/* Lifetime stats */}
            <div className="flex items-center gap-5">
              <span className="flex items-center gap-1.5 font-mono">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Best: {formatClock(saveInfo.highestSurvivalTime)}</span>
              </span>
              <span className="flex items-center gap-1.5 font-mono">
                <Skull className="w-3.5 h-3.5 text-rose-400" />
                <span>Kills: {saveInfo.lifetimeKills.toLocaleString()}</span>
              </span>
              <span className="flex items-center gap-1.5 font-mono">
                <span>Runs: {saveInfo.runsPlayed}</span>
              </span>
            </div>

            {/* Controls hints */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowHowToPlay(true)}
                className="flex items-center gap-1 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
              >
                <Info className="w-3.5 h-3.5" />
                <span>How to Play</span>
              </button>

              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                <span className="flex items-center gap-1">
                  <Keyboard className="w-3 h-3" /> WASD / Arrows
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Gamepad2 className="w-3 h-3" /> Gamepad Ready
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
