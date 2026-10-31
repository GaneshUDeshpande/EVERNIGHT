import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/engine';
import { GameState, BiomeId, Player, GameMode } from './game/types';
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
import titleKingdomPanorama from './assets/images/title_kingdom_panorama_1793427447576.jpg';
import slideshowCombatVerdant from './assets/images/slideshow_combat_verdant_1793428248788.jpg';
import slideshowScorchedCrypts from './assets/images/slideshow_scorched_crypts_1793428248368.jpg';
import slideshowHauntedMire from './assets/images/slideshow_haunted_mire_1793428248930.jpg';
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
  ChevronLeft,
  ArrowLeft,
  Eye,
  EyeOff,
} from 'lucide-react';

const SLIDESHOW_SCENARIOS = [
  {
    id: 'kingdom',
    biome: 'verdant' as BiomeId,
    tag: 'SCENARIO 1 · THE ROYAL KEEP',
    title: 'THE FORTRESS UNDER SIEGE',
    subtitle: 'Valkyrie Maiden stands watch atop the cliff as swarms gather in the horizon',
    desc: 'Ancient kingdom walls fortified against the rising beast tide. Defend the realm against the ancient Colossus.',
    image: titleKingdomPanorama,
    badgeColor: 'text-amber-300 border-amber-500/40 bg-amber-500/20',
    accentBorder: 'border-amber-500/50',
    indicatorColor: 'bg-amber-400',
  },
  {
    id: 'verdant',
    biome: 'verdant' as BiomeId,
    tag: 'SCENARIO 2 · SUNLIT TEMPLE RUINS',
    title: 'VERDANT MEADOWS HORDES',
    subtitle: 'Cleaving through toxic cavern slimes and ravenous tusked boars',
    desc: 'Sunbeams piercing through lush canopy trees. Swarms of slimes and charging boars converge on the maiden.',
    image: slideshowCombatVerdant,
    badgeColor: 'text-emerald-300 border-emerald-500/40 bg-emerald-500/20',
    accentBorder: 'border-emerald-500/50',
    indicatorColor: 'bg-emerald-400',
  },
  {
    id: 'scorched',
    biome: 'scorched' as BiomeId,
    tag: 'SCENARIO 3 · VOLCANIC BASALT FISSURES',
    title: 'THE SCORCHED CRYPTS',
    subtitle: 'Invulnerable dash across magma rivers against Fire Imps and the Magma Wyrm',
    desc: 'A fiery subterranean nightmare. Dashing through waves of fireballs as the colossal Magma Wyrm awakens.',
    image: slideshowScorchedCrypts,
    badgeColor: 'text-orange-300 border-orange-500/40 bg-orange-500/20',
    accentBorder: 'border-orange-500/50',
    indicatorColor: 'bg-orange-400',
  },
  {
    id: 'haunted',
    biome: 'haunted' as BiomeId,
    tag: 'SCENARIO 4 · SPECTRAL MOSS MARSH',
    title: 'THE HAUNTED MIRE',
    subtitle: 'Holy sword nova banishing phantasms and shattering the Lich Shade',
    desc: 'Murky swamp lit by eerie bioluminescent fungi. Unleashing holy wrath to purge the shadowy undead horde.',
    image: slideshowHauntedMire,
    badgeColor: 'text-purple-300 border-purple-500/40 bg-purple-500/20',
    accentBorder: 'border-purple-500/50',
    indicatorColor: 'bg-purple-400',
  },
];

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
  const [cinematicMode, setCinematicMode] = useState<boolean>(false);
  const [activeMonsterFilter, setActiveMonsterFilter] = useState<string | null>(null);

  // Game Mode & Modals
  const [selectedMode, setSelectedMode] = useState<GameMode>('fortress_defense');
  const [showScenariosModal, setShowScenariosModal] = useState<boolean>(false);
  const [activeSlide, setActiveSlide] = useState<number>(0);

  // Touch device detection
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // Title Screen Music
  useEffect(() => {
    if (gameState === 'TITLE_MENU') {
      sound.playMusicTheme('title');
    }
  }, [gameState]);

  // Audio Context unlock on initial user gesture
  useEffect(() => {
    const handleGesture = () => {
      sound.resumeContext();
      if (gameState === 'TITLE_MENU' && sound.currentTheme !== 'title') {
        sound.playMusicTheme('title');
      }
    };
    window.addEventListener('click', handleGesture);
    window.addEventListener('keydown', handleGesture);
    return () => {
      window.removeEventListener('click', handleGesture);
      window.removeEventListener('keydown', handleGesture);
    };
  }, [gameState]);

  const handleToggleSound = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    sound.setMuted(nextMuted);
    if (!nextMuted) {
      sound.playCoinPickup();
      if (gameState === 'TITLE_MENU') {
        sound.playMusicTheme('title');
      }
    } else {
      sound.stopMusic();
    }
  };

  // Slideshow Navigation in Scenario Chronicles Modal
  const nextSlide = useCallback(() => {
    setActiveSlide((prev) => (prev + 1) % SLIDESHOW_SCENARIOS.length);
    sound.playEnemyHit();
  }, []);

  const prevSlide = useCallback(() => {
    setActiveSlide((prev) => (prev - 1 + SLIDESHOW_SCENARIOS.length) % SLIDESHOW_SCENARIOS.length);
    sound.playEnemyHit();
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
        } else if (gameState === 'TITLE_MENU') {
          setShowShop(false);
          setShowBestiary(false);
          setShowAchievements(false);
          setShowHowToPlay(false);
          setShowScenariosModal(false);
        }
      } else if (gameState === 'TITLE_MENU') {
        if (
          (e.code === 'Enter' || e.code === 'Space') &&
          !showShop &&
          !showBestiary &&
          !showAchievements &&
          !showHowToPlay &&
          !showScenariosModal
        ) {
          e.preventDefault();
          handleStartGame(selectedBiome, selectedMode, hyperMode);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [
    gameState,
    selectedBiome,
    selectedMode,
    hyperMode,
    showShop,
    showBestiary,
    showAchievements,
    showHowToPlay,
    showScenariosModal,
  ]);

  // Launch new run
  const handleStartGame = (biome: BiomeId = selectedBiome, mode: GameMode = selectedMode, isHyper: boolean = hyperMode) => {
    setSelectedBiome(biome);
    setSelectedMode(mode);
    const engine = engineRef.current;
    if (engine) {
      engine.reset(biome, mode);
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
    handleStartGame(selectedBiome, selectedMode, hyperMode);
  };

  const handleQuitToMenu = () => {
    engineRef.current?.stop();
    setGameState('TITLE_MENU');
    sound.playMusicTheme('title');
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
            fortress={engineRef.current?.fortress}
            gameMode={selectedMode}
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

      {/* SCENARIO CHRONICLES MODAL (View 4 Pixel Art Scenario Illustrations) */}
      {showScenariosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative flex flex-col w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
            {/* Modal Image Carousel */}
            <div className="relative w-full aspect-video sm:h-[420px] bg-slate-950 overflow-hidden">
              <img
                src={SLIDESHOW_SCENARIOS[activeSlide].image}
                alt={SLIDESHOW_SCENARIOS[activeSlide].title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center animate-panorama"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

              {/* Prev / Next Buttons */}
              <button
                onClick={prevSlide}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-950/75 hover:bg-slate-900 border border-slate-700 text-slate-200 hover:text-amber-300 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-950/75 hover:bg-slate-900 border border-slate-700 text-slate-200 hover:text-amber-300 transition-all cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Overlay Content */}
              <div className="absolute bottom-3 left-4 right-4 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-2">
                <div>
                  <span className={`text-[10px] font-mono tracking-widest uppercase font-bold px-2.5 py-0.5 rounded-full border ${SLIDESHOW_SCENARIOS[activeSlide].badgeColor}`}>
                    {SLIDESHOW_SCENARIOS[activeSlide].tag}
                  </span>
                  <h3 className="text-xl font-bold font-game text-slate-100 mt-1">
                    {SLIDESHOW_SCENARIOS[activeSlide].title}
                  </h3>
                  <p className="text-xs text-slate-300 max-w-xl">
                    {SLIDESHOW_SCENARIOS[activeSlide].desc}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setSelectedBiome(SLIDESHOW_SCENARIOS[activeSlide].biome);
                    setShowScenariosModal(false);
                    sound.playCoinPickup();
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-game text-xs transition-all cursor-pointer whitespace-nowrap"
                >
                  Select This Biome
                </button>
              </div>
            </div>

            {/* Modal Bottom Strip with Thumbnails */}
            <div className="p-3 bg-slate-950 flex items-center justify-between gap-2 border-t border-slate-800">
              <div className="flex items-center gap-2 overflow-x-auto">
                {SLIDESHOW_SCENARIOS.map((sc, idx) => (
                  <button
                    key={sc.id}
                    onClick={() => {
                      setActiveSlide(idx);
                      sound.playEnemyHit();
                    }}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                      activeSlide === idx
                        ? `${sc.badgeColor} font-bold scale-105`
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    0{idx + 1} {sc.title.split(' ')[0]}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowScenariosModal(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UNIFIED TITLE & EXPEDITION DEPLOYMENT SCREEN */}
      {gameState === 'TITLE_MENU' && (
        <div className="fixed inset-0 z-40 flex flex-col justify-between p-4 sm:p-6 md:p-8 overflow-y-auto overflow-x-hidden bg-slate-950">
          {/* Panoramic Pixel Art Kingdom Landscape */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
            <img
              src={titleKingdomPanorama}
              alt="Valkyrie on cliff overlooking fantasy kingdom fortress under siege"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-bottom scale-100 sm:scale-105 animate-panorama transition-transform duration-1000"
            />
            {/* Ambient Lighting & Contrast Scrims */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-slate-950/65" />
            <div className="absolute inset-0 bg-radial-[at_top] from-transparent via-slate-950/20 to-slate-950/80" />
          </div>

          {/* Floating Golden Sparks / Embers */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(16)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full"
                style={{
                  left: `${(i * 17) % 100}%`,
                  bottom: `${(i * 11) % 45}%`,
                  backgroundColor:
                    selectedBiome === 'verdant'
                      ? i % 2 === 0
                        ? '#4ade80'
                        : '#facc15'
                      : selectedBiome === 'scorched'
                      ? i % 2 === 0
                        ? '#f97316'
                        : '#facc15'
                      : i % 2 === 0
                      ? '#c084fc'
                      : '#38bdf8',
                  boxShadow: '0 0 10px currentColor',
                  animation: `emberRise ${3 + (i % 3) * 0.9}s ease-in-out infinite`,
                  animationDelay: `${(i * 0.4) % 3}s`,
                }}
              />
            ))}
          </div>

          {/* Top Brand & Navigation Header */}
          <header className="relative z-10 flex flex-wrap items-center justify-between gap-4 w-full max-w-7xl mx-auto pb-3 border-b border-slate-700/60 bg-slate-950/55 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl">
            {/* Title / Brand */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/30 to-orange-500/30 border border-amber-400/50 text-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.35)]">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-game font-black text-lg sm:text-2xl text-slate-100 tracking-wider text-gold-gleam drop-shadow-md">
                    VALKYRIE SURVIVORS
                  </h1>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/25 text-amber-300 border border-amber-500/40 font-bold hidden md:inline-block">
                    SUPER FANTASY KINGDOM EDITION
                  </span>
                </div>
                <p className="text-[11px] font-mono text-slate-300 drop-shadow">
                  Valkyrie Lead Defender · Encroaching Monster Legions · Roguelite Horde Survival
                </p>
              </div>
            </div>

            {/* Top Controls & Modals */}
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
                  9 Beasts
                </span>
              </button>

              {/* Scenario Chronicles (View 4 Pixel Art Scenario Illustrations) */}
              <button
                onClick={() => setShowScenariosModal(true)}
                title="View All 4 Scenario Illustrations"
                className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 text-amber-300 border border-amber-500/40 hover:border-amber-400 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Scenarios</span>
                <span className="text-[10px] font-mono px-1.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                  4 Arts
                </span>
              </button>

              {/* Sound SFX / Music Toggle */}
              <button
                onClick={handleToggleSound}
                title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all active:scale-95 cursor-pointer ${
                  isMuted
                    ? 'bg-rose-950/80 border-rose-800 text-rose-300'
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

              {/* Cinematic View Toggle */}
              <button
                onClick={() => {
                  setCinematicMode(!cinematicMode);
                  sound.playCoinPickup();
                }}
                title={cinematicMode ? 'Exit Cinematic View' : 'View Full Kingdom Panorama'}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all active:scale-95 cursor-pointer ${
                  cinematicMode
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.5)]'
                    : 'bg-slate-900/90 border-slate-700/80 text-slate-200 hover:border-slate-600'
                }`}
              >
                {cinematicMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-sky-400" />}
                <span className="font-mono text-[11px] hidden sm:inline">
                  {cinematicMode ? 'Show Menu' : 'View Panorama'}
                </span>
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

          {/* Cinematic Mode Banner (when user wants to admire the artwork unobstructed) */}
          {cinematicMode ? (
            <div className="relative z-10 flex flex-col items-center justify-center my-auto text-center pointer-events-auto">
              <div className="bg-slate-950/80 backdrop-blur-md border border-amber-500/40 p-4 sm:p-6 rounded-2xl max-w-lg shadow-2xl">
                <span className="text-xs font-mono tracking-widest text-amber-400 uppercase font-semibold">
                  CINEMATIC LANDSCAPE VIEW
                </span>
                <h2 className="text-2xl font-bold font-game text-slate-100 my-1">
                  THE KINGDOM BEFORE THE STORM
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  The Valkyrie stands watch atop the cliff as swarms of slimes, shadow specters, fire imps, and the ancient Colossus advance toward the castle walls.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => handleStartGame(selectedBiome, selectedMode, hyperMode)}
                    className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold font-game text-sm tracking-wider shadow-lg active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>RUSH INTO BATTLE</span>
                  </button>
                  <button
                    onClick={() => setCinematicMode(false)}
                    className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <EyeOff className="w-4 h-4" />
                    <span>Return to Menu</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Main Interactive Stage: Hero & Realm Deployment */
            <main className="relative z-10 w-full max-w-7xl mx-auto my-auto py-3 sm:py-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                {/* Left Column: Interactive Hero Lead Dossier (5 cols) */}
                <div className="lg:col-span-5 flex flex-col justify-center">
                  <HeroPreview />
                </div>

                {/* Right Column: Expedition Realm & Battle Launch (7 cols) */}
                <div className="lg:col-span-7 flex flex-col justify-between gap-3 bg-slate-950/80 backdrop-blur-md border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-2xl">
                  <div>
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                      <div>
                        <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase font-semibold">
                          MISSION OBJECTIVE · REALM SELECTION
                        </span>
                        <h2 className="text-base sm:text-lg font-bold font-game text-slate-100 flex items-center gap-2">
                          <span>DEFEND THE FORTRESS</span>
                        </h2>
                      </div>

                      <div className="text-[11px] font-mono text-slate-300 drop-shadow">
                        Choose your frontline battleground & mode
                      </div>
                    </div>

                    {/* Operational Battle Mode Selector (Authentic In-Game Modes) */}
                    <div className="mb-2.5">
                      <span className="text-[10px] font-mono tracking-wider text-amber-400 uppercase font-semibold block mb-1">
                        SELECT ACTIVE BATTLE MODE
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {/* Mode 1: Defend the Fortress */}
                        <button
                          onClick={() => {
                            setSelectedMode('fortress_defense');
                            sound.playCoinPickup();
                          }}
                          className={`p-2 rounded-xl border text-left transition-all cursor-pointer relative ${
                            selectedMode === 'fortress_defense'
                              ? 'border-amber-400 bg-gradient-to-b from-amber-950/80 to-slate-900 shadow-[0_0_15px_rgba(251,191,36,0.35)] scale-[1.02]'
                              : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-sm">🏰</span>
                            <span className="text-xs font-bold text-amber-300 font-game">Defend Fortress</span>
                          </div>
                          <p className="text-[10px] text-slate-300 leading-snug">
                            Protect the Royal Citadel from destruction. Sentry ballistas & healing fountain!
                          </p>
                          <div className="mt-1.5 text-[9px] font-mono text-amber-400 font-bold">
                            ★ Citadel Defense Mode
                          </div>
                        </button>

                        {/* Mode 2: Wilderness Survival */}
                        <button
                          onClick={() => {
                            setSelectedMode('wilderness_survival');
                            sound.playCoinPickup();
                          }}
                          className={`p-2 rounded-xl border text-left transition-all cursor-pointer relative ${
                            selectedMode === 'wilderness_survival'
                              ? 'border-emerald-400 bg-gradient-to-b from-emerald-950/80 to-slate-900 shadow-[0_0_15px_rgba(52,211,153,0.35)] scale-[1.02]'
                              : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-sm">⚔️</span>
                            <span className="text-xs font-bold text-emerald-300 font-game">Wilderness Survival</span>
                          </div>
                          <p className="text-[10px] text-slate-300 leading-snug">
                            Classic rogue survival across open biomes with the Citadel as a healing base.
                          </p>
                          <div className="mt-1.5 text-[9px] font-mono text-emerald-400 font-bold">
                            ★ Endless Rogue Hunt
                          </div>
                        </button>

                        {/* Mode 3: Titan Boss Rush */}
                        <button
                          onClick={() => {
                            setSelectedMode('boss_rush');
                            sound.playCoinPickup();
                          }}
                          className={`p-2 rounded-xl border text-left transition-all cursor-pointer relative ${
                            selectedMode === 'boss_rush'
                              ? 'border-purple-400 bg-gradient-to-b from-purple-950/80 to-slate-900 shadow-[0_0_15px_rgba(168,85,247,0.35)] scale-[1.02]'
                              : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-sm">💀</span>
                            <span className="text-xs font-bold text-purple-300 font-game">Titan Boss Rush</span>
                          </div>
                          <p className="text-[10px] text-slate-300 leading-snug">
                            Rapid boss encounters (Ancient Treant, Magma Wyrm, Lich) with +50% Gold!
                          </p>
                          <div className="mt-1.5 text-[9px] font-mono text-purple-400 font-bold">
                            ★ Boss Rush (+50% Gold)
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Biome Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {/* Verdant Meadows */}
                      <button
                        onClick={() => {
                          setSelectedBiome('verdant');
                          sound.playCoinPickup();
                        }}
                        className={`flex flex-col p-2.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                          selectedBiome === 'verdant'
                            ? 'border-emerald-400 bg-gradient-to-b from-emerald-950/80 to-slate-900 shadow-[0_0_20px_rgba(52,211,153,0.3)] scale-[1.02]'
                            : 'border-slate-800 bg-slate-900/70 hover:border-slate-700 hover:bg-slate-900/90'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            <Trees className="w-4 h-4" />
                          </div>
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                            ★☆☆☆☆ Normal
                          </span>
                        </div>
                        <span className="text-xs font-bold text-slate-100 font-game mb-1">
                          Verdant Meadows
                        </span>
                        <p className="text-[10px] text-slate-400 leading-snug line-clamp-2">
                          Outer fields and temple ruins. Ancient Treant Titan awakens at 3:00.
                        </p>
                        <div className="mt-1.5 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-emerald-400">
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
                        className={`flex flex-col p-2.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                          selectedBiome === 'scorched'
                            ? 'border-orange-400 bg-gradient-to-b from-orange-950/80 to-slate-900 shadow-[0_0_20px_rgba(251,146,60,0.3)] scale-[1.02]'
                            : 'border-slate-800 bg-slate-900/70 hover:border-slate-700 hover:bg-slate-900/90'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="p-1 rounded-lg bg-orange-500/20 text-orange-300 border border-orange-500/40">
                            <Flame className="w-4 h-4" />
                          </div>
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-orange-950 text-orange-300 border border-orange-800">
                            ★★★☆☆ Hard
                          </span>
                        </div>
                        <span className="text-xs font-bold text-slate-100 font-game mb-1">
                          Scorched Crypts
                        </span>
                        <p className="text-[10px] text-slate-400 leading-snug line-clamp-2">
                          Volcanic basalt slabs etched with embers. Magma Wyrm awakens at 5:00.
                        </p>
                        <div className="mt-1.5 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-orange-400">
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
                        className={`flex flex-col p-2.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                          selectedBiome === 'haunted'
                            ? 'border-purple-400 bg-gradient-to-b from-purple-950/80 to-slate-900 shadow-[0_0_20px_rgba(192,132,252,0.3)] scale-[1.02]'
                            : 'border-slate-800 bg-slate-900/70 hover:border-slate-700 hover:bg-slate-900/90'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="p-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40">
                            <Ghost className="w-4 h-4" />
                          </div>
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                            ★★★★★ Nightmare
                          </span>
                        </div>
                        <span className="text-xs font-bold text-slate-100 font-game mb-1">
                          Haunted Mire
                        </span>
                        <p className="text-[10px] text-slate-400 leading-snug line-clamp-2">
                          Murky swamp with glowing fungi. Lich Shade awakens at 7:00.
                        </p>
                        <div className="mt-1.5 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-purple-400">
                          <span>Boss: Lich Shade</span>
                          <span>+40% EXP/G</span>
                        </div>
                      </button>
                    </div>

                    {/* Approaching Monster Vanguard */}
                    <div className="mt-2.5 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-inner">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono tracking-wider text-rose-400 uppercase font-semibold flex items-center gap-1.5">
                          <Skull className="w-3.5 h-3.5" />
                          <span>ENCROACHING MONSTER HORDE (INCOMING VANGUARD)</span>
                        </span>
                        <button
                          onClick={() => setShowBestiary(true)}
                          className="text-[10px] font-mono text-amber-400 hover:underline cursor-pointer"
                        >
                          View Full Bestiary →
                        </button>
                      </div>

                      <div className="grid grid-cols-5 gap-1.5 text-center">
                        <div
                          onClick={() => sound.playEnemyHit()}
                          className="p-1.5 rounded-lg bg-slate-950/70 border border-emerald-500/30 hover:border-emerald-400 transition-colors cursor-pointer group"
                          title="Cavern Slime: Basic Swarm"
                        >
                          <div className="text-base group-hover:scale-125 transition-transform">🟢</div>
                          <div className="text-[10px] font-bold text-slate-200 mt-0.5">Slime</div>
                          <div className="text-[9px] text-emerald-400 font-mono">Swarm</div>
                        </div>

                        <div
                          onClick={() => sound.playEnemyHit()}
                          className="p-1.5 rounded-lg bg-slate-950/70 border border-amber-500/30 hover:border-amber-400 transition-colors cursor-pointer group"
                          title="Tusked Boar: Fast Charger"
                        >
                          <div className="text-base group-hover:scale-125 transition-transform">🐗</div>
                          <div className="text-[10px] font-bold text-slate-200 mt-0.5">Boar</div>
                          <div className="text-[9px] text-amber-400 font-mono">Charger</div>
                        </div>

                        <div
                          onClick={() => sound.playEnemyHit()}
                          className="p-1.5 rounded-lg bg-slate-950/70 border border-orange-500/30 hover:border-orange-400 transition-colors cursor-pointer group"
                          title="Fire Imp: Ranged Pyro"
                        >
                          <div className="text-base group-hover:scale-125 transition-transform">🔥</div>
                          <div className="text-[10px] font-bold text-slate-200 mt-0.5">Fire Imp</div>
                          <div className="text-[9px] text-orange-400 font-mono">Ranged</div>
                        </div>

                        <div
                          onClick={() => sound.playEnemyHit()}
                          className="p-1.5 rounded-lg bg-slate-950/70 border border-purple-500/30 hover:border-purple-400 transition-colors cursor-pointer group"
                          title="Shadow Specter: Phantasm"
                        >
                          <div className="text-base group-hover:scale-125 transition-transform">👻</div>
                          <div className="text-[10px] font-bold text-slate-200 mt-0.5">Specter</div>
                          <div className="text-[9px] text-purple-400 font-mono">Phantasm</div>
                        </div>

                        <div
                          onClick={() => sound.playEvolution()}
                          className="p-1.5 rounded-lg bg-slate-950/70 border border-rose-500/40 hover:border-rose-400 transition-colors cursor-pointer group"
                          title="Ancient Treant: Colossus Titan Boss"
                        >
                          <div className="text-base group-hover:scale-125 transition-transform">🌲</div>
                          <div className="text-[10px] font-bold text-rose-300 mt-0.5">Treant</div>
                          <div className="text-[9px] text-rose-400 font-mono font-bold">Titan Boss</div>
                        </div>
                      </div>
                    </div>

                    {/* Run Modifier / Hyper Mode Switch */}
                    <div className="mt-2.5 p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`p-1.5 rounded-lg border transition-colors ${
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
                          <div className="text-[10px] text-slate-400">
                            +25% Player Move Speed, +50% Gold drops, intense horde spawning
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
                  <div className="pt-1">
                    <button
                      onClick={() => handleStartGame(selectedBiome, selectedMode, hyperMode)}
                      className="w-full py-3.5 sm:py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black font-game text-lg sm:text-xl tracking-widest shadow-[0_0_35px_rgba(251,191,36,0.65)] active:scale-98 transition-all flex items-center justify-center gap-3 cursor-pointer animate-pulse-gold group"
                    >
                      <Play className="w-6 h-6 fill-current group-hover:scale-110 transition-transform" />
                      <span>COMMENCE EXPEDITION</span>
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <div className="flex items-center justify-center gap-2 mt-1.5 text-[11px] font-mono text-slate-300 drop-shadow">
                      <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-400">
                        SPACE
                      </span>
                      <span>or</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-400">
                        ENTER
                      </span>
                      <span>to Deploy Immediately</span>
                    </div>
                  </div>
                </div>
              </div>
            </main>
          )}

          {/* Footer Metrics & Controls Info */}
          <footer className="relative z-10 flex flex-col sm:flex-row items-center justify-between w-full max-w-7xl mx-auto gap-3 text-xs text-slate-300 pt-2.5 pb-1 border-t border-slate-700/60 bg-slate-950/60 backdrop-blur-md px-4 rounded-xl">
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
            <div className="flex items-center gap-4 text-[11px] text-slate-300 font-mono">
              <div className="flex items-center gap-2">
                <Keyboard className="w-3.5 h-3.5 text-amber-400" />
                <span>WASD / Arrows to Move</span>
                <span>·</span>
                <span>Space to Dash</span>
                <span>·</span>
                <span>Q/F for Ult</span>
              </div>
              <div className="hidden md:flex items-center gap-1 text-slate-400">
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
