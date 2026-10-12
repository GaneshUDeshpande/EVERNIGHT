import {
  Player,
  Enemy,
  Projectile,
  DropGem,
  DamageNumber,
  Particle,
  DestructibleObject,
  PlayerStats,
  BiomeId,
  WeaponId,
  PassiveId,
  ShrineObject,
  AfterimageGhost,
  AchievementDef,
} from './types';
import { sprites } from './sprites';
import { sound } from './sound';
import { storage } from './storage';
import { WEAPON_REGISTRY, PASSIVE_REGISTRY } from './weapons';
import { ProceduralMap, LightSource } from './map';
import { EnemyWaveManager } from './enemies';

export interface AmbientParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
}

export class GameEngine {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public player: Player;
  public map: ProceduralMap;
  public waveManager: EnemyWaveManager;

  public enemies: Enemy[] = [];
  public projectiles: Projectile[] = [];
  public gems: DropGem[] = [];
  public damageNumbers: DamageNumber[] = [];
  public particles: Particle[] = [];
  public destructibles: DestructibleObject[] = [];
  public ambientParticles: AmbientParticle[] = [];
  public afterimages: AfterimageGhost[] = [];

  public survivalTime: number = 0;
  public kills: number = 0;
  public isRunning: boolean = false;
  public isPaused: boolean = false;

  // Active Boss tracking & Achievements
  public activeBoss: Enemy | null = null;
  public bossBannerText: string | null = null;
  public bossBannerTimer: number = 0;
  public bossKilledThisRun: boolean = false;
  public newAchievementsThisRun: { id: string; name: string; description: string; icon: string; unlocked: boolean }[] = [];

  // In-run Mystery Shrines
  public nearbyShrine: ShrineObject | null = null;

  // Synergies & Timers
  public consecratedHealTimer: number = 0;

  // Camera & Screen Shake
  public cameraX: number = 0;
  public cameraY: number = 0;
  public screenShakeAmount: number = 0;

  // Combat Juice (Hit-stop & Attack states)
  public hitStopTimer: number = 0;
  public playerAttackTimer: number = 0;

  // Input states
  public keys: Record<string, boolean> = {};
  public joystickVector: { x: number; y: number } = { x: 0, y: 0 };
  public gamepadIndex: number | null = null;
  public lastInputType: 'keyboard' | 'gamepad' | 'touch' = 'keyboard';

  // Spatial Grid Partitioning (cell size 128)
  private readonly gridSize = 128;
  private spatialGrid: Map<string, Enemy[]> = new Map();

  // Dynamic 2D Lighting Layer (Half resolution for high performance)
  private lightCanvas: HTMLCanvasElement;
  private lightCtx: CanvasRenderingContext2D;

  // Callbacks
  public onLevelUp: () => void = () => {};
  public onChestOpen: () => void = () => {};
  public onGameOver: (isVictory: boolean) => void = () => {};

  private nextEntityId: number = 1;
  private lastTimestamp: number = 0;
  private animFrameId: number | null = null;

  constructor(canvas: HTMLCanvasElement, biomeId: BiomeId = 'verdant') {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;

    // Initialize Lighting Buffer
    this.lightCanvas = document.createElement('canvas');
    this.lightCtx = this.lightCanvas.getContext('2d')!;

    sprites.init();
    this.map = new ProceduralMap(biomeId);
    this.waveManager = new EnemyWaveManager();

    const baseStats = storage.calculatePlayerBaseStats();
    this.player = this.createInitialPlayer(baseStats);

    this.initAmbientParticles();
    this.setupInputListeners();
    this.resizeCanvas();
    window.addEventListener('resize', this.resizeCanvas);
  }

  private resizeCanvas = () => {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.ctx.imageSmoothingEnabled = false;

    // Keep light buffer scaled to 1/2 viewport for optimal FPS
    this.lightCanvas.width = Math.max(100, Math.floor(window.innerWidth / 2));
    this.lightCanvas.height = Math.max(100, Math.floor(window.innerHeight / 2));
  };

  private initAmbientParticles() {
    this.ambientParticles = [];
    const count = 55;
    const isVerdant = this.map.biome.id === 'verdant';
    const isScorched = this.map.biome.id === 'scorched';

    for (let i = 0; i < count; i++) {
      this.ambientParticles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: 15 + Math.random() * 35,
        vy: 10 + Math.random() * 20,
        size: 2 + Math.random() * 3,
        alpha: 0.3 + Math.random() * 0.4,
        color: isVerdant
          ? Math.random() > 0.4
            ? '#4ade80'
            : '#facc15' // Leaves & Fireflies
          : isScorched
            ? Math.random() > 0.5
              ? '#ea580c'
              : '#78716c' // Embers & Ash
            : '#c084fc', // Spores & Wisps
      });
    }
  }

  private createInitialPlayer(stats: PlayerStats): Player {
    return {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      facing: 1,
      moving: false,
      frameIndex: 0,
      animTimer: 0,
      invincibleTimer: 0,
      isDead: false,
      level: 1,
      xp: 0,
      nextLevelXp: 5,
      gold: 0,
      stats,
      weapons: [
        {
          id: 'sword',
          level: 1,
          cooldownTimer: 0,
          totalDamage: 0,
        },
      ],
      passives: [],
      dashTimer: 0,
      dashCooldown: 0,
      dashCooldownMax: 2.8,
      isDashing: false,
      dashesUsed: 0,
      ultimateCharge: 0,
      ultimateMax: 100,
      isUltimateReady: false,
      shrinesPrayed: 0,
    };
  }

  public reset(biomeId: BiomeId = 'verdant') {
    const baseStats = storage.calculatePlayerBaseStats();
    this.player = this.createInitialPlayer(baseStats);
    this.map.setBiome(biomeId);
    this.waveManager = new EnemyWaveManager();
    this.enemies = [];
    this.projectiles = [];
    this.gems = [];
    this.damageNumbers = [];
    this.particles = [];
    this.destructibles = [];
    this.afterimages = [];
    this.nearbyShrine = null;
    this.activeBoss = null;
    this.bossBannerText = null;
    this.bossBannerTimer = 0;
    this.bossKilledThisRun = false;
    this.newAchievementsThisRun = [];
    this.consecratedHealTimer = 0;
    this.survivalTime = 0;
    this.kills = 0;
    this.cameraX = 0;
    this.cameraY = 0;
    this.screenShakeAmount = 0;
    this.hitStopTimer = 0;
    this.playerAttackTimer = 0;
    this.isPaused = false;
    this.initAmbientParticles();
  }

  public start() {
    this.isRunning = true;
    this.lastTimestamp = performance.now();
    sound.startMusic();
    this.loop(this.lastTimestamp);
  }

  public stop() {
    this.isRunning = false;
    sound.stopMusic();
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public setPaused(paused: boolean) {
    this.isPaused = paused;
    if (paused) {
      sound.stopMusic();
    } else {
      sound.startMusic();
      this.lastTimestamp = performance.now();
    }
  }

  // --- ACTIVE COMBAT ABILITIES ---

  public triggerDash() {
    if (this.player.isDead || this.player.dashCooldown > 0) return;

    const effectiveCd = Math.max(1.0, this.player.dashCooldownMax * this.player.stats.cooldown);
    this.player.dashCooldown = effectiveCd;
    this.player.dashTimer = 0.22;
    this.player.isDashing = true;
    this.player.invincibleTimer = 0.25; // Complete I-Frames!
    this.player.dashesUsed += 1;

    sound.playDash();
    this.addScreenShake(3);

    // Particle burst behind player
    const backAngle = this.player.facing === 1 ? Math.PI : 0;
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        id: this.nextEntityId++,
        x: this.player.x,
        y: this.player.y + (Math.random() * 16 - 8),
        vx: Math.cos(backAngle + (Math.random() * 0.8 - 0.4)) * (80 + Math.random() * 60),
        vy: Math.sin(backAngle + (Math.random() * 0.8 - 0.4)) * (40 + Math.random() * 40),
        size: 3,
        color: '#38bdf8',
        life: 0.25,
        maxLife: 0.25,
      });
    }
  }

  public triggerUltimate() {
    if (
      this.player.isDead ||
      (!this.player.isUltimateReady && this.player.ultimateCharge < this.player.ultimateMax)
    ) {
      return;
    }

    this.player.ultimateCharge = 0;
    this.player.isUltimateReady = false;

    sound.playUltimate();
    this.addScreenShake(14);
    this.hitStopTimer = 0.15; // High impact freeze juice

    // Wipe hostile projectiles from existence
    this.projectiles = this.projectiles.filter((p) => !p.weaponId?.startsWith('enemy'));

    // Obliterate all on-screen enemies with Valkyrie Holy Nova
    const ultDamage = Math.round(350 * this.player.stats.might);
    for (const e of this.enemies) {
      const dist = Math.hypot(e.x - this.player.x, e.y - this.player.y);
      if (dist <= 750) {
        e.hp -= ultDamage;
        e.hurtTimer = 0.35;

        // Knockback outwards from player
        const angle = Math.atan2(e.y - this.player.y, e.x - this.player.x);
        e.x += Math.cos(angle) * 75;
        e.y += Math.sin(angle) * 75;

        this.damageNumbers.push({
          id: this.nextEntityId++,
          x: e.x,
          y: e.y - 20,
          damage: ultDamage,
          isCrit: true,
          isHeal: false,
          life: 0.9,
          maxLife: 0.9,
        });

        if (e.hp <= 0) {
          this.killEnemy(e);
        }
      }
    }

    // Radiant sword rain particles
    for (let i = 0; i < 40; i++) {
      this.particles.push({
        id: this.nextEntityId++,
        x: this.player.x + (Math.random() * 800 - 400),
        y: this.player.y - 300 + Math.random() * 100,
        vx: (Math.random() - 0.5) * 50,
        vy: 400 + Math.random() * 300,
        size: 3 + Math.random() * 3,
        color: Math.random() > 0.4 ? '#facc15' : '#ffffff',
        life: 0.55,
        maxLife: 0.55,
      });
    }
  }

  public prayAtNearbyShrine() {
    if (!this.nearbyShrine || this.nearbyShrine.used) return;

    const shrine = this.nearbyShrine;
    shrine.used = true;
    this.player.shrinesPrayed += 1;

    sound.playShrinePray();
    this.addScreenShake(8);

    switch (shrine.type) {
      case 'blood': {
        const hpLoss = Math.round(this.player.stats.maxHp * 0.2);
        this.player.stats.maxHp = Math.max(30, this.player.stats.maxHp - hpLoss);
        this.player.stats.currentHp = Math.min(this.player.stats.currentHp, this.player.stats.maxHp);
        this.player.stats.might *= 1.25;
        this.damageNumbers.push({
          id: this.nextEntityId++,
          x: this.player.x,
          y: this.player.y - 35,
          damage: hpLoss,
          isCrit: true,
          isHeal: false,
          life: 1.2,
          maxLife: 1.2,
        });
        break;
      }

      case 'greed': {
        this.player.gold += 150;
        sound.playCoinPickup();
        // Spawn enraged boars
        for (let i = 0; i < 3; i++) {
          const angle = (Math.PI * 2 * i) / 3;
          this.enemies.push({
            id: this.nextEntityId++,
            type: 'boar',
            x: shrine.x + Math.cos(angle) * 120,
            y: shrine.y + Math.sin(angle) * 120,
            vx: 0,
            vy: 0,
            radius: 18,
            maxHp: 220,
            hp: 220,
            speed: 130,
            damage: 22,
            xpValue: 8,
            isElite: true,
            isBoss: false,
            facing: 1,
            hurtTimer: 0,
            behaviorTimer: 0,
            chargeCooldown: 1.0,
            shootCooldown: 0,
          });
        }
        break;
      }

      case 'haste': {
        this.player.stats.armor = Math.max(0, this.player.stats.armor - 1);
        this.player.stats.moveSpeed *= 1.2;
        this.player.dashCooldownMax *= 0.75;
        break;
      }

      case 'oracle': {
        if (Math.random() > 0.4) {
          // Blessed: Drops Chest
          this.gems.push({
            id: this.nextEntityId++,
            x: shrine.x,
            y: shrine.y,
            value: 80,
            type: 'chest',
            magnetized: false,
          });
          sound.playEvolution();
        } else {
          // Cursed: Lightning hazard!
          sound.playLightning();
          this.damagePlayer(15);
          this.player.xp += 50;
          this.addExplosionParticles(shrine.x, shrine.y, '#c084fc');
        }
        break;
      }
    }

    this.nearbyShrine = null;
  }

  // --- RADAR & WEAPON SYNERGIES ---

  public getRadarData() {
    const blips: { type: 'boss' | 'elite' | 'chest' | 'shrine'; x: number; y: number }[] = [];

    // Bosses & Elites
    for (const e of this.enemies) {
      if (e.isBoss) {
        blips.push({ type: 'boss', x: e.x, y: e.y });
      } else if (e.isElite) {
        blips.push({ type: 'elite', x: e.x, y: e.y });
      }
    }

    // Chests
    for (const g of this.gems) {
      if (g.type === 'chest') {
        blips.push({ type: 'chest', x: g.x, y: g.y });
      }
    }

    // Shrines in nearby chunks
    const cs = this.map.chunkSize;
    const cx = Math.floor(this.player.x / cs);
    const cy = Math.floor(this.player.y / cs);
    for (let dx = -3; dx <= 3; dx++) {
      for (let dy = -3; dy <= 3; dy++) {
        const chunk = this.map.getChunk(cx + dx, cy + dy);
        for (const s of chunk.shrines) {
          if (!s.used) {
            blips.push({ type: 'shrine', x: s.x, y: s.y });
          }
        }
      }
    }

    return {
      playerPos: {
        x: this.player.x,
        y: this.player.y,
        facing: this.player.facing,
      },
      blips,
    };
  }

  public hasSynergy(name: 'plasma_overload' | 'shield_bash' | 'consecrated_ground'): boolean {
    const weaponIds = new Set(this.player.weapons.map((w) => w.id));
    if (name === 'plasma_overload') {
      return (
        (weaponIds.has('fire_wand') || weaponIds.has('hellfire')) &&
        (weaponIds.has('lightning_ring') || weaponIds.has('thunder_loop'))
      );
    }
    if (name === 'shield_bash') {
      return (
        (weaponIds.has('sword') || weaponIds.has('excalibur')) &&
        (weaponIds.has('orbit_shield') || weaponIds.has('valkyrie_aegis'))
      );
    }
    if (name === 'consecrated_ground') {
      return (
        (weaponIds.has('holy_water') || weaponIds.has('la_borra')) &&
        (weaponIds.has('radiant_aura') || weaponIds.has('soul_eater'))
      );
    }
    return false;
  }

  public getActiveSynergies(): { name: string; icon: string; desc: string }[] {
    const list: { name: string; icon: string; desc: string }[] = [];
    if (this.hasSynergy('plasma_overload')) {
      list.push({
        name: 'Plasma Overload',
        icon: '⚡🔥',
        desc: 'Fire & Lightning generate chain violet plasma explosions',
      });
    }
    if (this.hasSynergy('shield_bash')) {
      list.push({
        name: 'Shield Shockwave',
        icon: '🛡️⚔️',
        desc: 'Broadsword slashes pulse kinetic waves that repel foes and deflect shots',
      });
    }
    if (this.hasSynergy('consecrated_ground')) {
      list.push({
        name: 'Consecrated Ground',
        icon: '✨🧪',
        desc: 'Holy ground pools continuously mend player wounds (+1 HP per tick)',
      });
    }
    return list;
  }

  private setupInputListeners() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      this.keys[e.code.toLowerCase()] = true;
      this.lastInputType = 'keyboard';

      // Action Hotkeys
      if (e.code === 'Space' || e.key === 'Shift') {
        this.triggerDash();
      }
      if (e.key === 'q' || e.key === 'Q' || e.key === 'f' || e.key === 'F') {
        this.triggerUltimate();
      }
      if (e.key === 'e' || e.key === 'E') {
        this.prayAtNearbyShrine();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
      this.keys[e.code.toLowerCase()] = false;
    });

    window.addEventListener('gamepadconnected', (e) => {
      this.gamepadIndex = e.gamepad.index;
      this.lastInputType = 'gamepad';
    });

    window.addEventListener('gamepaddisconnected', () => {
      this.gamepadIndex = null;
    });
  }

  private pollGamepad(): { x: number; y: number } {
    if (this.gamepadIndex === null) return { x: 0, y: 0 };
    const gamepads = navigator.getGamepads();
    const gp = gamepads[this.gamepadIndex];
    if (!gp) return { x: 0, y: 0 };

    let x = gp.axes[0] || 0;
    let y = gp.axes[1] || 0;

    // D-Pad support
    if (gp.buttons[14]?.pressed) x = -1; // Left
    if (gp.buttons[15]?.pressed) x = 1; // Right
    if (gp.buttons[12]?.pressed) y = -1; // Up
    if (gp.buttons[13]?.pressed) y = 1; // Down

    // Controller Action Buttons
    if (gp.buttons[1]?.pressed || gp.buttons[5]?.pressed) {
      this.triggerDash(); // B / RB
    }
    if (gp.buttons[3]?.pressed || gp.buttons[4]?.pressed) {
      this.triggerUltimate(); // Y / LB
    }
    if (gp.buttons[2]?.pressed) {
      this.prayAtNearbyShrine(); // X
    }

    // Deadzone
    const deadzone = 0.2;
    if (Math.abs(x) < deadzone) x = 0;
    if (Math.abs(y) < deadzone) y = 0;

    if (Math.abs(x) > 0 || Math.abs(y) > 0) {
      this.lastInputType = 'gamepad';
    }

    return { x, y };
  }

  private loop = (timestamp: number) => {
    if (!this.isRunning) return;

    const dt = Math.min((timestamp - this.lastTimestamp) / 1000, 0.1);
    this.lastTimestamp = timestamp;

    if (!this.isPaused) {
      // Hit-stop freeze frame check
      if (this.hitStopTimer > 0) {
        this.hitStopTimer -= dt;
      } else {
        this.update(dt);
      }
    }
    this.render();

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    if (this.player.isDead) return;

    this.survivalTime += dt;

    // Update music intensity based on elapsed time or active boss
    if (this.activeBoss) {
      sound.setIntensity(3);
    } else if (this.survivalTime >= 180) {
      sound.setIntensity(2);
    } else {
      sound.setIntensity(1);
    }

    // Boss banner timer countdown
    if (this.bossBannerTimer > 0) {
      this.bossBannerTimer -= dt;
      if (this.bossBannerTimer <= 0) {
        this.bossBannerText = null;
      }
    }

    // Player attack swing timer countdown
    if (this.playerAttackTimer > 0) {
      this.playerAttackTimer -= dt;
    }

    // 15-Minute Survival Victory Trigger
    if (this.survivalTime >= 900 && !this.player.isDead) {
      this.handleVictory();
      return;
    }

    // Update dash afterimages decay
    for (let i = this.afterimages.length - 1; i >= 0; i--) {
      const g = this.afterimages[i];
      g.alpha -= dt * 3.8;
      if (g.alpha <= 0) {
        this.afterimages.splice(i, 1);
      }
    }

    // Check nearby shrines in surrounding chunks
    const cs = this.map.chunkSize;
    const playerCX = Math.floor(this.player.x / cs);
    const playerCY = Math.floor(this.player.y / cs);
    let closestShrine: ShrineObject | null = null;
    let closestDist = 55;

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const chunk = this.map.getChunk(playerCX + dx, playerCY + dy);
        for (const s of chunk.shrines) {
          if (!s.used) {
            const dist = Math.hypot(this.player.x - s.x, this.player.y - s.y);
            if (dist < closestDist) {
              closestDist = dist;
              closestShrine = s;
            }
          }
        }
      }
    }
    this.nearbyShrine = closestShrine;

    // Consecrated Ground synergy continuous heal inside holy water pools
    if (this.hasSynergy('consecrated_ground')) {
      this.consecratedHealTimer += dt;
      if (this.consecratedHealTimer >= 0.6) {
        this.consecratedHealTimer = 0;
        const insideHolyPool = this.projectiles.some(
          (p) =>
            (p.weaponId === 'holy_water' || p.weaponId === 'la_borra') &&
            p.isArea &&
            Math.hypot(this.player.x - p.x, this.player.y - p.y) <= p.radius
        );
        if (insideHolyPool && this.player.stats.currentHp < this.player.stats.maxHp) {
          this.healPlayer(1);
          this.particles.push({
            id: this.nextEntityId++,
            x: this.player.x + (Math.random() * 16 - 8),
            y: this.player.y - 10,
            vx: 0,
            vy: -25,
            size: 3,
            color: '#4ade80',
            life: 0.45,
            maxLife: 0.45,
          });
        }
      }
    }

    // 1. Process Player Input & Movement
    this.updatePlayerMovement(dt);

    // 2. Health Regen
    if (this.player.stats.hpRegen > 0) {
      this.player.stats.currentHp = Math.min(
        this.player.stats.maxHp,
        this.player.stats.currentHp + this.player.stats.hpRegen * dt
      );
    }

    // 3. Invincibility Timer
    if (this.player.invincibleTimer > 0) {
      this.player.invincibleTimer -= dt;
    }

    // 4. Weapons Firing System
    this.updateWeapons(dt);

    // 5. Update Projectiles & Spatial Collisions
    this.updateProjectiles(dt);

    // 6. Spawn & Update Enemies
    this.updateEnemies(dt);

    // 7. Update Collectibles & Magnet
    this.updateGems(dt);

    // 8. Update Damage Numbers & Particles
    this.updateEffects(dt);

    // 9. Camera Smoothing & Screen Shake
    const targetCamX = this.player.x - this.canvas.width / 2;
    const targetCamY = this.player.y - this.canvas.height / 2;
    this.cameraX += (targetCamX - this.cameraX) * 0.12;
    this.cameraY += (targetCamY - this.cameraY) * 0.12;

    if (this.screenShakeAmount > 0) {
      this.screenShakeAmount = Math.max(0, this.screenShakeAmount - dt * 25);
    }

    // 10. Update Ambient Weather Particles
    this.updateAmbientParticles(dt);
  }

  private updatePlayerMovement(dt: number) {
    let mx = 0;
    let my = 0;

    // Keyboard
    if (this.keys['w'] || this.keys['arrowup']) my -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) my += 1;
    if (this.keys['a'] || this.keys['arrowleft']) mx -= 1;
    if (this.keys['d'] || this.keys['arrowright']) mx += 1;

    // Gamepad
    const gp = this.pollGamepad();
    if (Math.abs(gp.x) > 0 || Math.abs(gp.y) > 0) {
      mx = gp.x;
      my = gp.y;
    }

    // Touch Joystick
    if (Math.abs(this.joystickVector.x) > 0 || Math.abs(this.joystickVector.y) > 0) {
      mx = this.joystickVector.x;
      my = this.joystickVector.y;
      this.lastInputType = 'touch';
    }

    // Cooldown countdown
    if (this.player.dashCooldown > 0) {
      this.player.dashCooldown = Math.max(0, this.player.dashCooldown - dt);
    }

    const mag = Math.hypot(mx, my);

    // Active Dash Boost & Trail
    if (this.player.isDashing) {
      this.player.dashTimer -= dt;
      const dashSpeed = this.player.stats.moveSpeed * 2.6;

      if (mag > 0.05) {
        this.player.vx = (mx / mag) * dashSpeed;
        this.player.vy = (my / mag) * dashSpeed;
      } else {
        this.player.vx = this.player.facing * dashSpeed;
        this.player.vy = 0;
      }

      // Record afterimage
      this.afterimages.push({
        x: this.player.x,
        y: this.player.y,
        facing: this.player.facing,
        frameIndex: this.player.frameIndex,
        alpha: 0.75,
      });

      if (this.player.dashTimer <= 0) {
        this.player.isDashing = false;
      }
    } else if (mag > 0.05) {
      const normX = (mx / mag) * Math.min(1, mag);
      const normY = (my / mag) * Math.min(1, mag);

      this.player.vx = normX * this.player.stats.moveSpeed;
      this.player.vy = normY * this.player.stats.moveSpeed;
      this.player.moving = true;

      if (mx > 0.1) this.player.facing = 1;
      else if (mx < -0.1) this.player.facing = -1;

      // 4-frame walk cycle
      this.player.animTimer += dt * 9;
      this.player.frameIndex = Math.floor(this.player.animTimer) % 4;
    } else {
      this.player.vx *= 0.7;
      this.player.vy *= 0.7;
      this.player.moving = false;
      this.player.frameIndex = 0;
    }

    this.player.x += this.player.vx * dt;
    this.player.y += this.player.vy * dt;
  }

  private updateWeapons(dt: number) {
    for (const w of this.player.weapons) {
      w.cooldownTimer -= dt;
      if (w.cooldownTimer <= 0) {
        const def = WEAPON_REGISTRY[w.id];
        const effectiveCd = Math.max(0.12, def.baseCooldown * this.player.stats.cooldown);
        w.cooldownTimer = effectiveCd;

        this.fireWeapon(w);
      }
    }
  }

  private fireWeapon(w: { id: WeaponId; level: number }) {
    const def = WEAPON_REGISTRY[w.id];
    const lvlIdx = Math.min(w.level - 1, def.levelDescriptions.length - 1);
    const damage = Math.round(
      (def.baseDamage + lvlIdx * 5) * this.player.stats.might
    );
    const count = def.baseCount + this.player.stats.projectileCount;
    const area = def.baseArea * this.player.stats.area;
    const speed = def.baseSpeed * this.player.stats.projectileSpeed;

    switch (w.id) {
      case 'sword':
      case 'excalibur': {
        sound.playSlash();
        const isExcalibur = w.id === 'excalibur';
        const slashAngle = this.player.facing === 1 ? 0 : Math.PI;
        this.playerAttackTimer = 0.16; // Trigger attack visual frame

        this.projectiles.push({
          id: this.nextEntityId++,
          weaponId: w.id,
          x: this.player.x + (isExcalibur ? 0 : this.player.facing * 35),
          y: this.player.y,
          vx: 0,
          vy: 0,
          damage: isExcalibur ? damage * 1.5 : damage,
          radius: isExcalibur ? 95 * area : 58 * area,
          pierce: 999,
          life: def.baseDuration,
          maxLife: def.baseDuration,
          angle: slashAngle,
          hitEnemies: new Set(),
          isArea: true,
          areaColor: isExcalibur ? '#facc15' : '#e2e8f0',
        });

        // Shield Bash Shockwave Synergy
        if (this.hasSynergy('shield_bash')) {
          this.projectiles.push({
            id: this.nextEntityId++,
            weaponId: w.id,
            x: this.player.x,
            y: this.player.y,
            vx: 0,
            vy: 0,
            damage: Math.round(damage * 0.75),
            radius: (isExcalibur ? 110 : 80) * area,
            pierce: 999,
            life: 0.18,
            maxLife: 0.18,
            angle: 0,
            hitEnemies: new Set(),
            isArea: true,
            areaColor: 'rgba(56, 189, 248, 0.45)',
            isSynergyCombo: true,
          });

          // Deflect / destroy any hostile projectiles inside kinetic ring
          this.projectiles = this.projectiles.filter(
            (proj) =>
              !proj.weaponId?.startsWith('enemy') ||
              Math.hypot(proj.x - this.player.x, proj.y - this.player.y) > 80 * area
          );
        }
        break;
      }

      case 'magic_wand':
      case 'holy_blast': {
        const targets = this.findNearestEnemies(count);
        if (targets.length === 0) break;

        sound.playMagicCast();
        for (const target of targets) {
          const dx = target.x - this.player.x;
          const dy = target.y - this.player.y;
          const dist = Math.hypot(dx, dy) || 1;
          const angle = Math.atan2(dy, dx);

          this.projectiles.push({
            id: this.nextEntityId++,
            weaponId: w.id,
            x: this.player.x,
            y: this.player.y,
            vx: (dx / dist) * speed,
            vy: (dy / dist) * speed,
            damage,
            radius: 8 * area,
            pierce: w.id === 'holy_blast' ? 4 : def.basePierce,
            life: def.baseDuration,
            maxLife: def.baseDuration,
            angle,
            hitEnemies: new Set(),
          });
        }
        break;
      }

      case 'orbit_shield':
      case 'valkyrie_aegis': {
        const isAegis = w.id === 'valkyrie_aegis';
        const shieldCount = isAegis ? 6 : Math.min(6, 1 + w.level);
        this.projectiles = this.projectiles.filter(
          (p) => p.weaponId !== 'orbit_shield' && p.weaponId !== 'valkyrie_aegis'
        );

        for (let i = 0; i < shieldCount; i++) {
          const startAngle = (Math.PI * 2 * i) / shieldCount;
          this.projectiles.push({
            id: this.nextEntityId++,
            weaponId: w.id,
            x: this.player.x,
            y: this.player.y,
            vx: 0,
            vy: 0,
            damage,
            radius: 12 * area,
            pierce: 999,
            life: def.baseDuration,
            maxLife: def.baseDuration,
            angle: startAngle,
            orbitAngle: startAngle,
            orbitDistance: (isAegis ? 85 : 65) * area,
            hitEnemies: new Set(),
          });
        }
        break;
      }

      case 'fire_wand':
      case 'hellfire': {
        const target = this.findRandomEnemy();
        const targetX = target ? target.x : this.player.x + this.player.facing * 300;
        const targetY = target ? target.y : this.player.y;
        const dx = targetX - this.player.x;
        const dy = targetY - this.player.y;
        const dist = Math.hypot(dx, dy) || 1;
        const angle = Math.atan2(dy, dx);

        this.projectiles.push({
          id: this.nextEntityId++,
          weaponId: w.id,
          x: this.player.x,
          y: this.player.y,
          vx: (dx / dist) * speed,
          vy: (dy / dist) * speed,
          damage,
          radius: (w.id === 'hellfire' ? 20 : 12) * area,
          pierce: w.id === 'hellfire' ? 999 : 1,
          life: def.baseDuration,
          maxLife: def.baseDuration,
          angle,
          hitEnemies: new Set(),
          isArea: true,
          areaColor: '#ea580c',
        });
        break;
      }

      case 'lightning_ring':
      case 'thunder_loop': {
        const targets = this.findRandomEnemies(count);
        if (targets.length === 0) break;

        sound.playLightning();
        this.addScreenShake(3);

        for (const target of targets) {
          this.projectiles.push({
            id: this.nextEntityId++,
            weaponId: w.id,
            x: target.x,
            y: target.y,
            vx: 0,
            vy: 0,
            damage,
            radius: 42 * area,
            pierce: 999,
            life: 0.28,
            maxLife: 0.28,
            angle: 0,
            hitEnemies: new Set(),
            isArea: true,
            areaColor: '#38bdf8',
          });
        }
        break;
      }

      case 'holy_water':
      case 'la_borra': {
        for (let i = 0; i < count; i++) {
          const throwAngle = Math.random() * Math.PI * 2;
          const throwDist = 70 + Math.random() * 120;
          const destX = this.player.x + Math.cos(throwAngle) * throwDist;
          const destY = this.player.y + Math.sin(throwAngle) * throwDist;

          this.projectiles.push({
            id: this.nextEntityId++,
            weaponId: w.id,
            x: destX,
            y: destY,
            vx: 0,
            vy: 0,
            damage,
            radius: 50 * area,
            pierce: 999,
            life: def.baseDuration,
            maxLife: def.baseDuration,
            angle: 0,
            hitEnemies: new Set(),
            isArea: true,
            areaColor: 'rgba(56, 189, 248, 0.35)',
          });
        }
        break;
      }

      case 'throwing_daggers':
      case 'thousand_blades': {
        for (let i = 0; i < count; i++) {
          const spread = (i - (count - 1) / 2) * 0.12;
          const baseAngle = this.player.facing === 1 ? 0 : Math.PI;
          const angle = baseAngle + spread;

          this.projectiles.push({
            id: this.nextEntityId++,
            weaponId: w.id,
            x: this.player.x,
            y: this.player.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            damage,
            radius: 6 * area,
            pierce: w.id === 'thousand_blades' ? 6 : def.basePierce,
            life: def.baseDuration,
            maxLife: def.baseDuration,
            angle,
            hitEnemies: new Set(),
          });
        }
        break;
      }

      case 'radiant_aura':
      case 'soul_eater': {
        const isSoul = w.id === 'soul_eater';
        this.projectiles.push({
          id: this.nextEntityId++,
          weaponId: w.id,
          x: this.player.x,
          y: this.player.y,
          vx: 0,
          vy: 0,
          damage,
          radius: (isSoul ? 130 : 80) * area,
          pierce: 999,
          life: 0.35,
          maxLife: 0.35,
          angle: 0,
          hitEnemies: new Set(),
          isArea: true,
          areaColor: isSoul ? 'rgba(168, 85, 247, 0.4)' : 'rgba(250, 204, 21, 0.25)',
        });
        break;
      }
    }
  }

  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;

      if (p.life <= 0 || p.pierce <= 0) {
        if (p.weaponId === 'fire_wand' && p.life <= 0) {
          sound.playExplosion();
          this.addExplosionParticles(p.x, p.y, '#ea580c');
        }
        this.projectiles.splice(i, 1);
        continue;
      }

      if (p.orbitAngle !== undefined && p.orbitDistance !== undefined) {
        p.orbitAngle += dt * 3.5;
        p.x = this.player.x + Math.cos(p.orbitAngle) * p.orbitDistance;
        p.y = this.player.y + Math.sin(p.orbitAngle) * p.orbitDistance;
      } else {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }

      if (p.weaponId === 'la_borra') {
        const dx = this.player.x - p.x;
        const dy = this.player.y - p.y;
        p.x += dx * dt * 0.4;
        p.y += dy * dt * 0.4;
      }

      this.checkProjectileHits(p);
    }
  }

  private checkProjectileHits(p: Projectile) {
    const nearbyEnemies = this.getNearbyEnemies(p.x, p.y, p.radius + 20);

    for (const enemy of nearbyEnemies) {
      if (p.hitEnemies.has(enemy.id)) continue;

      const dist = Math.hypot(p.x - enemy.x, p.y - enemy.y);
      if (dist <= p.radius + enemy.radius) {
        p.hitEnemies.add(enemy.id);
        p.pierce -= 1;

        const armorReduction = enemy.type === 'snail' ? 3 : 0;
        const finalDamage = Math.max(1, p.damage - armorReduction);

        const activeWeapon = this.player.weapons.find((w) => w.id === p.weaponId);
        if (activeWeapon) {
          activeWeapon.totalDamage += finalDamage;
        }

        enemy.hp -= finalDamage;
        enemy.hurtTimer = 0.12;
        sound.playEnemyHit();

        // Hit-stop impact juice on crit or boss hits
        const isCrit = Math.random() < 0.12;
        if (isCrit || enemy.isBoss) {
          this.hitStopTimer = 0.035; // 35ms micro freeze
        }

        // Plasma Overload Synergy Arc Explosion
        if (
          this.hasSynergy('plasma_overload') &&
          (p.weaponId === 'fire_wand' ||
            p.weaponId === 'hellfire' ||
            p.weaponId === 'lightning_ring' ||
            p.weaponId === 'thunder_loop')
        ) {
          this.addExplosionParticles(enemy.x, enemy.y, '#c084fc');
          for (const nearE of this.enemies) {
            if (nearE.id !== enemy.id && Math.hypot(nearE.x - enemy.x, nearE.y - enemy.y) <= 70) {
              nearE.hp -= Math.round(finalDamage * 0.4);
              nearE.hurtTimer = 0.12;
            }
          }
        }

        if ((p.weaponId === 'excalibur' || p.weaponId === 'soul_eater') && Math.random() < 0.15) {
          this.healPlayer(1);
        }

        this.damageNumbers.push({
          id: this.nextEntityId++,
          x: enemy.x + (Math.random() * 16 - 8),
          y: enemy.y - 12,
          damage: finalDamage,
          isCrit,
          isHeal: false,
          life: 0.65,
          maxLife: 0.65,
        });

        this.addHitParticles(enemy.x, enemy.y, '#f8fafc');

        const kx = (enemy.x - this.player.x) / (dist || 1);
        const ky = (enemy.y - this.player.y) / (dist || 1);
        const kbForce = p.weaponId === 'sword' || p.weaponId === 'excalibur' ? 140 : 45;
        enemy.vx += kx * kbForce;
        enemy.vy += ky * kbForce;

        if (enemy.hp <= 0) {
          this.killEnemy(enemy);
        }

        if (p.pierce <= 0) break;
      }
    }
  }

  private killEnemy(enemy: Enemy) {
    this.kills += 1;
    sound.playEnemyDeath();
    this.addDeathParticles(enemy.x, enemy.y, enemy.type);

    // Charge ultimate meter
    const chargeVal = enemy.isBoss ? 25 : enemy.isElite ? 8 : 0.8;
    this.player.ultimateCharge = Math.min(
      this.player.ultimateMax,
      this.player.ultimateCharge + chargeVal
    );
    if (this.player.ultimateCharge >= this.player.ultimateMax) {
      this.player.isUltimateReady = true;
    }

    if (enemy === this.activeBoss) {
      this.activeBoss = null;
    }

    if (enemy.isBoss) {
      this.bossKilledThisRun = true;
      this.gems.push({
        id: this.nextEntityId++,
        x: enemy.x,
        y: enemy.y,
        value: 100,
        type: 'chest',
        magnetized: false,
      });
      this.addScreenShake(10);
    } else if (enemy.isElite) {
      this.gems.push({
        id: this.nextEntityId++,
        x: enemy.x,
        y: enemy.y,
        value: 50,
        type: Math.random() < 0.6 ? 'chest' : 'xp_purple',
        magnetized: false,
      });
    } else {
      const val = enemy.xpValue;
      const gemType: DropGem['type'] =
        val >= 10 ? 'xp_purple' : val >= 4 ? 'xp_red' : val >= 2 ? 'xp_green' : 'xp_blue';

      this.gems.push({
        id: this.nextEntityId++,
        x: enemy.x,
        y: enemy.y,
        value: val,
        type: gemType,
        magnetized: false,
      });

      if (Math.random() < 0.1 * this.player.stats.greed) {
        this.gems.push({
          id: this.nextEntityId++,
          x: enemy.x + (Math.random() * 20 - 10),
          y: enemy.y + (Math.random() * 20 - 10),
          value: 1,
          type: 'gold_coin',
          magnetized: false,
        });
      }
    }

    const idx = this.enemies.indexOf(enemy);
    if (idx !== -1) {
      this.enemies.splice(idx, 1);
    }
  }

  private updateEnemies(dt: number) {
    const spawned = this.waveManager.updateAndSpawn(
      dt,
      this.survivalTime,
      this.player,
      this.enemies,
      this.canvas.width,
      this.canvas.height
    );

    // Detect if a boss has just spawned
    for (const s of spawned) {
      if (s.isBoss && !this.activeBoss) {
        this.activeBoss = s;
        this.bossBannerText = `WARNING: ${s.type.toUpperCase()} TITAN DETECTED!`;
        this.bossBannerTimer = 3.5;
        sound.playBossWarning();
        this.addScreenShake(8);
      }
    }

    this.enemies.push(...spawned);
    this.rebuildSpatialGrid();

    const newEnemyProjectiles: Projectile[] = [];
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      this.waveManager.updateEnemyBehavior(e, this.player, dt, newEnemyProjectiles);

      const dist = Math.hypot(this.player.x - e.x, this.player.y - e.y);
      if (dist < 18 + e.radius) {
        this.damagePlayer(e.damage);
      }
    }

    if (newEnemyProjectiles.length > 0) {
      this.projectiles.push(...newEnemyProjectiles);
    }
  }

  private damagePlayer(rawDamage: number) {
    if (this.player.invincibleTimer > 0 || this.player.isDashing || this.player.isDead) return;

    const actualDamage = Math.max(1, rawDamage - this.player.stats.armor);
    this.player.stats.currentHp -= actualDamage;
    this.player.invincibleTimer = 0.45;

    sound.playPlayerHurt();
    this.addScreenShake(6);

    this.damageNumbers.push({
      id: this.nextEntityId++,
      x: this.player.x,
      y: this.player.y - 18,
      damage: actualDamage,
      isCrit: true,
      isHeal: false,
      life: 0.75,
      maxLife: 0.75,
    });

    if (this.player.stats.currentHp <= 0) {
      this.handlePlayerDeath();
    }
  }

  private handlePlayerDeath() {
    if (this.player.stats.revivals > 0) {
      this.player.stats.revivals -= 1;
      this.player.stats.currentHp = Math.round(this.player.stats.maxHp * 0.5);
      this.player.invincibleTimer = 2.0;
      sound.playEvolution();
      this.addScreenShake(12);
      this.addExplosionParticles(this.player.x, this.player.y, '#facc15');
      return;
    }

    this.player.isDead = true;
    sound.playGameOver();
    sound.stopMusic();

    const evolvedCount = this.player.weapons.filter(
      (w) => WEAPON_REGISTRY[w.id]?.isEvolved
    ).length;
    const newAchievements = storage.checkAndUnlockAchievements({
      kills: this.kills,
      survivalTime: Math.floor(this.survivalTime),
      gold: this.player.gold,
      dashes: this.player.dashesUsed,
      shrines: this.player.shrinesPrayed,
      evolvedWeaponCount: evolvedCount,
      bossKilled: this.bossKilledThisRun,
    });
    this.newAchievementsThisRun = newAchievements;

    const results = {
      survivalTime: Math.floor(this.survivalTime),
      kills: this.kills,
      levelReached: this.player.level,
      goldEarned: this.player.gold,
      isVictory: false,
      weapons: this.player.weapons.map((w) => ({
        id: w.id,
        level: w.level,
        totalDamage: w.totalDamage,
      })),
      newAchievements,
    };
    storage.recordRun(results);
    this.onGameOver(false);
  }

  public handleVictory() {
    this.player.isDead = true;
    sound.playEvolution();
    sound.stopMusic();

    const evolvedCount = this.player.weapons.filter(
      (w) => WEAPON_REGISTRY[w.id]?.isEvolved
    ).length;
    const newAchievements = storage.checkAndUnlockAchievements({
      kills: this.kills,
      survivalTime: Math.floor(this.survivalTime),
      gold: this.player.gold,
      dashes: this.player.dashesUsed,
      shrines: this.player.shrinesPrayed,
      evolvedWeaponCount: evolvedCount,
      bossKilled: this.bossKilledThisRun,
    });
    this.newAchievementsThisRun = newAchievements;

    const results = {
      survivalTime: Math.floor(this.survivalTime),
      kills: this.kills,
      levelReached: this.player.level,
      goldEarned: this.player.gold + 500, // Grand victory bounty
      isVictory: true,
      weapons: this.player.weapons.map((w) => ({
        id: w.id,
        level: w.level,
        totalDamage: w.totalDamage,
      })),
      newAchievements,
    };
    storage.recordRun(results);
    this.onGameOver(true);
  }

  public healPlayer(amount: number) {
    this.player.stats.currentHp = Math.min(
      this.player.stats.maxHp,
      this.player.stats.currentHp + amount
    );
    this.damageNumbers.push({
      id: this.nextEntityId++,
      x: this.player.x,
      y: this.player.y - 20,
      damage: amount,
      isCrit: false,
      isHeal: true,
      life: 0.6,
      maxLife: 0.6,
    });
  }

  private updateGems(dt: number) {
    const magnetRadius = this.player.stats.magnetRange;

    for (let i = this.gems.length - 1; i >= 0; i--) {
      const g = this.gems[i];
      const dx = this.player.x - g.x;
      const dy = this.player.y - g.y;
      const dist = Math.hypot(dx, dy);

      if (dist <= magnetRadius || g.magnetized) {
        g.magnetized = true;
        const speed = Math.max(380, 800 - dist * 1.5);
        g.x += (dx / dist) * speed * dt;
        g.y += (dy / dist) * speed * dt;
      }

      if (dist <= 24) {
        this.collectGem(g);
        this.gems.splice(i, 1);
      }
    }
  }

  private collectGem(gem: DropGem) {
    switch (gem.type) {
      case 'gold_coin': {
        this.player.gold += Math.round(gem.value * this.player.stats.greed);
        sound.playCoinPickup();
        break;
      }

      case 'chicken': {
        this.healPlayer(30);
        sound.playCoinPickup();
        break;
      }

      case 'magnet': {
        sound.playEvolution();
        for (const g of this.gems) {
          g.magnetized = true;
        }
        break;
      }

      case 'chest': {
        sound.playChestOpen();
        this.player.gold += 50;
        this.onChestOpen();
        break;
      }

      default: {
        const xpEarned = Math.round(gem.value * this.player.stats.growth);
        this.player.xp += xpEarned;
        sound.playGemPickup();

        // Charge ultimate meter from XP gems
        const chargeGain =
          gem.type === 'xp_purple'
            ? 8.0
            : gem.type === 'xp_red'
              ? 4.0
              : gem.type === 'xp_green'
                ? 2.5
                : 1.5;
        this.player.ultimateCharge = Math.min(
          this.player.ultimateMax,
          this.player.ultimateCharge + chargeGain
        );
        if (this.player.ultimateCharge >= this.player.ultimateMax) {
          this.player.isUltimateReady = true;
        }

        if (this.player.xp >= this.player.nextLevelXp) {
          this.triggerLevelUp();
        }
        break;
      }
    }
  }

  private triggerLevelUp() {
    this.player.level += 1;
    this.player.xp -= this.player.nextLevelXp;
    this.player.nextLevelXp = Math.round(this.player.nextLevelXp * 1.35 + 5);

    sound.playLevelUp();
    this.onLevelUp();
  }

  private updateEffects(dt: number) {
    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const dn = this.damageNumbers[i];
      dn.life -= dt;
      dn.y -= dt * 32;
      if (dn.life <= 0) {
        this.damageNumbers.splice(i, 1);
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private updateAmbientParticles(dt: number) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    for (const p of this.ambientParticles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.x > w + 20) p.x = -20;
      if (p.y > h + 20) p.y = -20;
      if (p.x < -20) p.x = w + 20;
      if (p.y < -20) p.y = h + 20;
    }
  }

  public addScreenShake(amount: number) {
    if (storage.getData().screenShake) {
      this.screenShakeAmount = Math.max(this.screenShakeAmount, amount);
    }
  }

  // --- Spatial Grid Helpers ---
  private rebuildSpatialGrid() {
    this.spatialGrid.clear();
    for (const e of this.enemies) {
      const cellX = Math.floor(e.x / this.gridSize);
      const cellY = Math.floor(e.y / this.gridSize);
      const key = `${cellX},${cellY}`;
      let list = this.spatialGrid.get(key);
      if (!list) {
        list = [];
        this.spatialGrid.set(key, list);
      }
      list.push(e);
    }
  }

  private getNearbyEnemies(x: number, y: number, radius: number): Enemy[] {
    const minCX = Math.floor((x - radius) / this.gridSize);
    const maxCX = Math.floor((x + radius) / this.gridSize);
    const minCY = Math.floor((y - radius) / this.gridSize);
    const maxCY = Math.floor((y + radius) / this.gridSize);

    const result: Enemy[] = [];
    for (let cx = minCX; cx <= maxCX; cx++) {
      for (let cy = minCY; cy <= maxCY; cy++) {
        const list = this.spatialGrid.get(`${cx},${cy}`);
        if (list) {
          result.push(...list);
        }
      }
    }
    return result;
  }

  private findNearestEnemies(count: number): Enemy[] {
    if (this.enemies.length === 0) return [];
    return [...this.enemies]
      .sort((a, b) => {
        const da = Math.hypot(a.x - this.player.x, a.y - this.player.y);
        const db = Math.hypot(b.x - this.player.x, b.y - this.player.y);
        return da - db;
      })
      .slice(0, count);
  }

  private findRandomEnemy(): Enemy | undefined {
    if (this.enemies.length === 0) return undefined;
    return this.enemies[Math.floor(Math.random() * this.enemies.length)];
  }

  private findRandomEnemies(count: number): Enemy[] {
    if (this.enemies.length === 0) return [];
    const shuffled = [...this.enemies].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  // --- Particles ---
  private addHitParticles(x: number, y: number, color: string) {
    for (let i = 0; i < 4; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 80;
      this.particles.push({
        id: this.nextEntityId++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 2,
        color,
        life: 0.25,
        maxLife: 0.25,
      });
    }
  }

  private addDeathParticles(x: number, y: number, _type: string) {
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 120;
      this.particles.push({
        id: this.nextEntityId++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 3,
        color: Math.random() > 0.5 ? '#f59e0b' : '#ef4444',
        life: 0.4,
        maxLife: 0.4,
      });
    }
  }

  private addExplosionParticles(x: number, y: number, color: string) {
    for (let i = 0; i < 18; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 160;
      this.particles.push({
        id: this.nextEntityId++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 4,
        color,
        life: 0.5,
        maxLife: 0.5,
      });
    }
  }

  // ==========================================
  // --- RENDERING PIPELINE ---
  // ==========================================
  private render() {
    const { ctx, canvas } = this;
    const shakeX = (Math.random() * 2 - 1) * this.screenShakeAmount;
    const shakeY = (Math.random() * 2 - 1) * this.screenShakeAmount;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(-this.cameraX + shakeX, -this.cameraY + shakeY);

    // 1. Render Map Chunks in Viewport
    this.renderMapChunks();

    // 2. Render Ground AoE Zones (Holy water pools, auras)
    this.renderGroundZones();

    // 3. Render Collectibles & Gems
    this.renderGems();

    // 4. Render Enemies
    this.renderEnemies();

    // 5. Render Dash Afterimages & Player Character
    this.renderAfterimages();
    this.renderPlayer();

    // 6. Render Projectiles (Swords, orbs, lightning)
    this.renderProjectiles();

    // 7. Render Particles & Floating Damage
    this.renderEffects();

    ctx.restore();

    // 8. Atmospheric Ambient Weather Particles
    this.renderAmbientParticles();

    // 9. 2D Dynamic Lighting Layer Pass
    this.renderDynamicLighting(shakeX, shakeY);

    // 10. Low Health Screen Vignette
    if (this.player.stats.currentHp < this.player.stats.maxHp * 0.3) {
      const grad = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        canvas.width * 0.3,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width * 0.7
      );
      grad.addColorStop(0, 'rgba(220, 38, 38, 0)');
      grad.addColorStop(1, 'rgba(220, 38, 38, 0.4)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 11. Boss Arrival Banner
    if (this.bossBannerText) {
      this.renderBossBanner();
    }
  }

  private renderMapChunks() {
    const cs = this.map.chunkSize;
    const minCX = Math.floor(this.cameraX / cs);
    const maxCX = Math.floor((this.cameraX + this.canvas.width) / cs);
    const minCY = Math.floor(this.cameraY / cs);
    const maxCY = Math.floor((this.cameraY + this.canvas.height) / cs);

    for (let cx = minCX; cx <= maxCX; cx++) {
      for (let cy = minCY; cy <= maxCY; cy++) {
        const chunk = this.map.getChunk(cx, cy);
        this.ctx.drawImage(chunk.canvas, cx * cs, cy * cs);

        // Render Shrines in this chunk
        for (const s of chunk.shrines) {
          const sprite = sprites.get(`shrine_${s.type}`);
          if (sprite) {
            this.ctx.drawImage(sprite.canvas, s.x - sprite.originX, s.y - sprite.originY);
          }
          if (!s.used) {
            const pulse = (Math.sin(this.survivalTime * 4) + 1) * 0.5;
            this.ctx.save();
            this.ctx.strokeStyle =
              s.type === 'blood'
                ? '#ef4444'
                : s.type === 'greed'
                  ? '#f59e0b'
                  : s.type === 'haste'
                    ? '#38bdf8'
                    : '#c084fc';
            this.ctx.lineWidth = 1.5;
            this.ctx.globalAlpha = 0.4 + pulse * 0.4;
            this.ctx.beginPath();
            this.ctx.arc(s.x, s.y - 10, 18 + pulse * 6, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.restore();
          }
        }

        // Render Destructibles in this chunk
        for (const d of chunk.destructibles) {
          const sprite = sprites.get(`destructible_${d.type}`);
          if (sprite) {
            this.ctx.drawImage(sprite.canvas, d.x - sprite.originX, d.y - sprite.originY);
          }
        }
      }
    }
  }

  private renderAfterimages() {
    const ctx = this.ctx;
    for (const ghost of this.afterimages) {
      const sprite = sprites.get(`player_${ghost.frameIndex}_normal`);
      if (sprite) {
        ctx.save();
        ctx.globalAlpha = ghost.alpha * 0.65;
        ctx.translate(ghost.x, ghost.y);
        if (ghost.facing === -1) {
          ctx.scale(-1, 1);
        }
        ctx.drawImage(sprite.canvas, -sprite.originX, -sprite.originY);
        ctx.restore();
      }
    }
  }

  private renderGroundZones() {
    const ctx = this.ctx;
    for (const p of this.projectiles) {
      if (p.isArea && p.areaColor) {
        ctx.save();
        ctx.fillStyle = p.areaColor;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = p.areaColor;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  private renderGems() {
    for (const g of this.gems) {
      const spriteName =
        g.type === 'gold_coin'
          ? 'item_coin'
          : g.type === 'chicken'
            ? 'item_chicken'
            : g.type === 'magnet'
              ? 'item_magnet'
              : g.type === 'chest'
                ? 'item_chest'
                : `gem_${g.type}`;

      const sprite = sprites.get(spriteName);
      if (sprite) {
        this.ctx.drawImage(sprite.canvas, g.x - sprite.originX, g.y - sprite.originY);
      }
    }
  }

  private renderEnemies() {
    const ctx = this.ctx;

    for (const e of this.enemies) {
      // 2-frame walk/action cycle
      const animFrame = Math.floor(e.behaviorTimer * 6) % 2;
      const stateKey = e.hurtTimer > 0 ? 'hurt' : e.isBoss ? 'boss' : e.isElite ? 'elite' : 'normal';
      const key = `enemy_${e.type}_${animFrame}_${stateKey}`;
      const sprite = sprites.get(key) || sprites.get(`enemy_${e.type}_0_normal`);

      if (sprite) {
        ctx.save();
        ctx.translate(e.x, e.y);
        if (e.facing === -1) {
          ctx.scale(-1, 1);
        }

        ctx.drawImage(sprite.canvas, -sprite.originX, -sprite.originY);
        ctx.restore();

        // Health bar for damaged or Elite/Boss enemies
        if (e.hp < e.maxHp || e.isElite || e.isBoss) {
          const barWidth = e.isBoss ? 56 : 26;
          const barHeight = e.isBoss ? 5 : 3;
          const pct = Math.max(0, e.hp / e.maxHp);

          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.fillRect(e.x - barWidth / 2, e.y - e.radius - 12, barWidth, barHeight);

          ctx.fillStyle = e.isBoss ? '#ef4444' : '#22c55e';
          ctx.fillRect(e.x - barWidth / 2, e.y - e.radius - 12, barWidth * pct, barHeight);
        }
      }
    }
  }

  private renderPlayer() {
    const ctx = this.ctx;
    const isHurt = this.player.invincibleTimer > 0;
    const isAttacking = this.playerAttackTimer > 0;

    let spriteName = `player_${this.player.frameIndex}_${isHurt ? 'hurt' : 'normal'}`;
    if (isAttacking) {
      spriteName = `player_attack_${isHurt ? 'hurt' : 'normal'}`;
    } else if (!this.player.moving) {
      spriteName = `player_idle_${isHurt ? 'hurt' : 'normal'}`;
    }

    // Radiant golden ultimate wings & halo
    if (this.player.isUltimateReady) {
      ctx.save();
      const auraPulse = (Math.sin(this.survivalTime * 7) + 1) * 0.5;
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.5 + auraPulse * 0.4;
      ctx.beginPath();
      ctx.arc(this.player.x, this.player.y, 22 + auraPulse * 4, 0, Math.PI * 2);
      ctx.stroke();

      // Wing rays behind character
      ctx.fillStyle = 'rgba(250, 204, 21, 0.45)';
      ctx.beginPath();
      ctx.ellipse(this.player.x - 14, this.player.y - 6, 12, 4.5, -0.35, 0, Math.PI * 2);
      ctx.ellipse(this.player.x + 14, this.player.y - 6, 12, 4.5, 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    const sprite = sprites.get(spriteName);
    if (sprite) {
      ctx.save();
      ctx.translate(this.player.x, this.player.y);
      if (this.player.facing === -1) {
        ctx.scale(-1, 1);
      }

      ctx.drawImage(sprite.canvas, -sprite.originX, -sprite.originY);
      ctx.restore();
    }

    // Health Bar directly above Player
    const hbWidth = 38;
    const hbHeight = 4;
    const hpRatio = Math.max(0, this.player.stats.currentHp / this.player.stats.maxHp);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(this.player.x - hbWidth / 2, this.player.y - 44, hbWidth, hbHeight);

    ctx.fillStyle = hpRatio > 0.4 ? '#22c55e' : hpRatio > 0.2 ? '#f59e0b' : '#ef4444';
    ctx.fillRect(this.player.x - hbWidth / 2, this.player.y - 44, hbWidth * hpRatio, hbHeight);

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(this.player.x - hbWidth / 2, this.player.y - 44, hbWidth, hbHeight);
  }

  private renderProjectiles() {
    const ctx = this.ctx;

    for (const p of this.projectiles) {
      if (p.isArea) continue;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);

      switch (p.weaponId) {
        case 'magic_wand':
        case 'holy_blast': {
          ctx.fillStyle = p.weaponId === 'holy_blast' ? '#facc15' : '#38bdf8';
          ctx.beginPath();
          ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(-2, 0, p.radius * 0.5, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'orbit_shield':
        case 'valkyrie_aegis': {
          const isAegis = p.weaponId === 'valkyrie_aegis';
          ctx.fillStyle = isAegis ? '#facc15' : '#94a3b8';
          ctx.fillRect(-6, -10, 12, 20);
          ctx.fillStyle = isAegis ? '#ffffff' : '#64748b';
          ctx.fillRect(-4, -8, 8, 16);
          break;
        }

        case 'throwing_daggers':
        case 'thousand_blades': {
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(-8, -2, 16, 4);
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(-10, -4, 4, 8);
          break;
        }

        default: {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
      }

      ctx.restore();
    }
  }

  private renderEffects() {
    const ctx = this.ctx;

    // Particles
    for (const part of this.particles) {
      const alpha = Math.max(0, part.life / part.maxLife);
      ctx.fillStyle = part.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Damage numbers
    if (storage.getData().showDamageNumbers) {
      ctx.font = 'bold 12px "Outfit", sans-serif';
      ctx.textAlign = 'center';

      for (const dn of this.damageNumbers) {
        const alpha = Math.max(0, dn.life / dn.maxLife);
        ctx.globalAlpha = alpha;

        if (dn.isHeal) {
          ctx.fillStyle = '#4ade80';
          ctx.fillText(`+${dn.damage}`, dn.x, dn.y);
        } else if (dn.isCrit) {
          ctx.fillStyle = '#facc15';
          ctx.font = 'bold 14px "Outfit", sans-serif';
          ctx.fillText(`${dn.damage}!`, dn.x, dn.y);
        } else {
          ctx.fillStyle = '#f8fafc';
          ctx.fillText(`${dn.damage}`, dn.x, dn.y);
        }
      }
      ctx.globalAlpha = 1.0;
    }
  }

  // --- Dynamic 2D Lighting Layer ---
  private renderDynamicLighting(shakeX: number, shakeY: number) {
    const lw = this.lightCanvas.width;
    const lh = this.lightCanvas.height;
    const lctx = this.lightCtx;

    // Clear and fill with subtle ambient darkness
    lctx.clearRect(0, 0, lw, lh);
    lctx.fillStyle = 'rgba(7, 10, 16, 0.42)';
    lctx.fillRect(0, 0, lw, lh);

    // Set blend mode to punch light holes
    lctx.globalCompositeOperation = 'destination-out';

    const scale = 0.5; // Since lightmap is 1/2 size
    const screenCamX = (this.cameraX - shakeX) * scale;
    const screenCamY = (this.cameraY - shakeY) * scale;

    const drawLight = (worldX: number, worldY: number, radius: number, alpha: number) => {
      const sx = worldX * scale - screenCamX;
      const sy = worldY * scale - screenCamY;
      const r = radius * scale;

      const grad = lctx.createRadialGradient(sx, sy, 0, sx, sy, r);
      grad.addColorStop(0, `rgba(0, 0, 0, ${alpha})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      lctx.fillStyle = grad;
      lctx.beginPath();
      lctx.arc(sx, sy, r, 0, Math.PI * 2);
      lctx.fill();
    };

    // 1. Player Torchlight
    drawLight(this.player.x, this.player.y, 210, 0.95);

    // 2. Visible chunk lights (braziers, glowing fungi, lava fissures)
    const cs = this.map.chunkSize;
    const minCX = Math.floor(this.cameraX / cs);
    const maxCX = Math.floor((this.cameraX + this.canvas.width) / cs);
    const minCY = Math.floor(this.cameraY / cs);
    const maxCY = Math.floor((this.cameraY + this.canvas.height) / cs);

    for (let cx = minCX; cx <= maxCX; cx++) {
      for (let cy = minCY; cy <= maxCY; cy++) {
        const chunk = this.map.getChunk(cx, cy);
        for (const light of chunk.lights) {
          drawLight(light.x, light.y, light.radius, light.intensity);
        }
      }
    }

    // 3. Projectile Lights (Fireballs, Lightning, Holy water)
    for (const p of this.projectiles) {
      if (p.weaponId === 'fire_wand' || p.weaponId === 'hellfire') {
        drawLight(p.x, p.y, 90, 0.7);
      } else if (p.weaponId === 'lightning_ring' || p.weaponId === 'thunder_loop') {
        drawLight(p.x, p.y, 140, 0.85);
      } else if (p.weaponId === 'magic_wand' || p.weaponId === 'holy_blast') {
        drawLight(p.x, p.y, 60, 0.5);
      }
    }

    // 4. Boss Aura Light
    if (this.activeBoss) {
      drawLight(this.activeBoss.x, this.activeBoss.y, 180, 0.8);
    }

    lctx.globalCompositeOperation = 'source-over';

    // Draw lightmap over main canvas
    this.ctx.save();
    this.ctx.drawImage(this.lightCanvas, 0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
  }

  private renderAmbientParticles() {
    const ctx = this.ctx;
    for (const p of this.ambientParticles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  }

  private renderBossBanner() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const cy = 90;

    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(w / 2 - 220, cy - 18, 440, 36);

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.strokeRect(w / 2 - 220, cy - 18, 440, 36);

    ctx.font = 'bold 14px "Cinzel", serif';
    ctx.fillStyle = '#facc15';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.bossBannerText || '', w / 2, cy);
    ctx.restore();
  }

  // --- UPGRADE APPLICATION ---
  public applyUpgrade(type: 'weapon' | 'passive', id: string) {
    if (type === 'weapon') {
      const wid = id as WeaponId;
      const existing = this.player.weapons.find((w) => w.id === wid);
      if (existing) {
        existing.level += 1;
      } else {
        this.player.weapons.push({
          id: wid,
          level: 1,
          cooldownTimer: 0,
          totalDamage: 0,
        });
      }
    } else {
      const pid = id as PassiveId;
      const existing = this.player.passives.find((p) => p.id === pid);
      if (existing) {
        existing.level += 1;
      } else {
        this.player.passives.push({
          id: pid,
          level: 1,
        });
      }
      this.recalculatePlayerPassives();
    }
  }

  public applyEvolution(baseWeaponId: WeaponId, evolvedWeaponId: WeaponId) {
    const idx = this.player.weapons.findIndex((w) => w.id === baseWeaponId);
    if (idx !== -1) {
      const prevDamage = this.player.weapons[idx].totalDamage;
      this.player.weapons[idx] = {
        id: evolvedWeaponId,
        level: 1,
        cooldownTimer: 0,
        totalDamage: prevDamage,
      };
    }
    sound.playEvolution();
    this.addScreenShake(12);
  }

  private recalculatePlayerPassives() {
    const baseStats = storage.calculatePlayerBaseStats();
    for (const ap of this.player.passives) {
      const def = PASSIVE_REGISTRY[ap.id];
      if (def) {
        const bonus = def.statBonus(ap.level);
        if (bonus.might) baseStats.might *= bonus.might;
        if (bonus.armor) baseStats.armor += bonus.armor;
        if (bonus.maxHp) {
          const oldMax = baseStats.maxHp;
          baseStats.maxHp = bonus.maxHp;
          baseStats.currentHp += baseStats.maxHp - oldMax;
        }
        if (bonus.cooldown) baseStats.cooldown *= bonus.cooldown;
        if (bonus.projectileSpeed) baseStats.projectileSpeed *= bonus.projectileSpeed;
        if (bonus.projectileCount) baseStats.projectileCount += bonus.projectileCount;
        if (bonus.magnetRange) baseStats.magnetRange = bonus.magnetRange;
        if (bonus.hpRegen) baseStats.hpRegen += bonus.hpRegen;
      }
    }
    this.player.stats = baseStats;
  }
}
