export type GameState =
  | 'TITLE_MENU'
  | 'PLAYING'
  | 'LEVEL_UP'
  | 'CHEST_OPEN'
  | 'PAUSED'
  | 'GAME_OVER'
  | 'VICTORY'
  | 'META_SHOP';

export type BiomeId = 'verdant' | 'scorched' | 'haunted';

export interface BiomeConfig {
  id: BiomeId;
  name: string;
  description: string;
  bgColor: string;
  obstacleType: string;
  accentColor: string;
}

export type EnemyType =
  | 'slime'
  | 'snake'
  | 'plant'
  | 'boar'
  | 'frog'
  | 'mushroom'
  | 'ghost'
  | 'fire_imp'
  | 'snail';

export interface PlayerStats {
  maxHp: number;
  currentHp: number;
  hpRegen: number; // HP per second
  armor: number; // Flat damage reduction
  moveSpeed: number; // Pixels per second
  might: number; // Damage multiplier (1.0 = 100%)
  area: number; // Attack scale multiplier
  cooldown: number; // Cooldown multiplier (0.8 = 20% faster)
  projectileSpeed: number; // Speed multiplier
  projectileCount: number; // Bonus projectiles
  magnetRange: number; // Pickup attraction radius in pixels
  greed: number; // Gold multiplier
  growth: number; // XP multiplier
  luck: number; // Critical / chest bonus
  revivals: number; // Extra lives
  rerolls: number; // Level up rerolls left this run
}

export type WeaponId =
  | 'sword'
  | 'magic_wand'
  | 'orbit_shield'
  | 'fire_wand'
  | 'lightning_ring'
  | 'holy_water'
  | 'throwing_daggers'
  | 'radiant_aura'
  | 'excalibur'
  | 'holy_blast'
  | 'valkyrie_aegis'
  | 'hellfire'
  | 'thunder_loop'
  | 'la_borra'
  | 'thousand_blades'
  | 'soul_eater';

export type PassiveId =
  | 'spinach'
  | 'armor'
  | 'hollow_heart'
  | 'cooldown_tome'
  | 'bracer'
  | 'duplicator'
  | 'attractorb'
  | 'pummarola';

export interface WeaponDef {
  id: WeaponId;
  name: string;
  description: string;
  icon: string;
  isEvolved?: boolean;
  evolutionPair?: PassiveId;
  evolvesFrom?: WeaponId;
  baseCooldown: number;
  baseDamage: number;
  baseCount: number;
  baseArea: number;
  baseSpeed: number;
  basePierce: number;
  baseDuration: number;
  maxLevel: number;
  levelDescriptions: string[];
}

export interface PassiveDef {
  id: PassiveId;
  name: string;
  description: string;
  icon: string;
  maxLevel: number;
  levelDescriptions: string[];
  statBonus: (level: number) => Partial<PlayerStats>;
}

export interface ActiveWeapon {
  id: WeaponId;
  level: number;
  cooldownTimer: number;
  totalDamage: number;
}

export interface ActivePassive {
  id: PassiveId;
  level: number;
}

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1; // 1 = right, -1 = left
  moving: boolean;
  frameIndex: number;
  animTimer: number;
  invincibleTimer: number;
  isDead: boolean;
  level: number;
  xp: number;
  nextLevelXp: number;
  gold: number;
  stats: PlayerStats;
  weapons: ActiveWeapon[];
  passives: ActivePassive[];

  // Active Dash & Dodge Roll
  dashTimer: number;
  dashCooldown: number;
  dashCooldownMax: number;
  isDashing: boolean;
  dashesUsed: number;

  // Charged Ultimate Skill
  ultimateCharge: number;
  ultimateMax: number;
  isUltimateReady: boolean;

  // Run shrine stats
  shrinesPrayed: number;
}

export interface Enemy {
  id: number;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  maxHp: number;
  hp: number;
  speed: number;
  damage: number;
  xpValue: number;
  isElite: boolean;
  isBoss: boolean;
  facing: 1 | -1;
  hurtTimer: number;
  behaviorTimer: number;
  chargeCooldown: number;
  shootCooldown: number;
}

export interface Projectile {
  id: number;
  weaponId: WeaponId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  radius: number;
  pierce: number;
  life: number;
  maxLife: number;
  angle: number;
  orbitAngle?: number;
  orbitDistance?: number;
  hitEnemies: Set<number>;
  isArea?: boolean;
  areaColor?: string;
  isSynergyCombo?: boolean;
}

export interface DropGem {
  id: number;
  x: number;
  y: number;
  value: number;
  type: 'xp_blue' | 'xp_green' | 'xp_red' | 'xp_purple' | 'gold_coin' | 'chicken' | 'magnet' | 'chest';
  magnetized: boolean;
}

export type ShrineType = 'blood' | 'greed' | 'haste' | 'oracle';

export interface ShrineObject {
  id: number;
  x: number;
  y: number;
  type: ShrineType;
  used: boolean;
  title: string;
  description: string;
}

export interface DestructibleObject {
  id: number;
  x: number;
  y: number;
  hp: number;
  type: 'barrel' | 'brazier' | 'tombstone';
}

export interface DamageNumber {
  id: number;
  x: number;
  y: number;
  damage: number;
  isCrit: boolean;
  isHeal: boolean;
  life: number;
  maxLife: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

export interface AfterimageGhost {
  x: number;
  y: number;
  facing: 1 | -1;
  frameIndex: number;
  alpha: number;
}

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

export interface PermanentUpgrade {
  id: string;
  name: string;
  description: string;
  icon: string;
  currentRank: number;
  maxRank: number;
  baseCost: number;
  costMultiplier: number;
  bonusPerRank: string;
}

export interface PersistentSaveData {
  gold: number;
  lifetimeGold: number;
  lifetimeKills: number;
  highestSurvivalTime: number; // in seconds
  runsPlayed: number;
  unlockedBiomes: BiomeId[];
  upgrades: Record<string, number>;
  achievements: Record<string, boolean>;
  sfxVolume: number;
  musicVolume: number;
  screenShake: boolean;
  showDamageNumbers: boolean;
}

export interface RunResults {
  survivalTime: number;
  kills: number;
  levelReached: number;
  goldEarned: number;
  isVictory: boolean;
  weapons: { id: WeaponId; level: number; totalDamage: number }[];
  newAchievements?: AchievementDef[];
}
