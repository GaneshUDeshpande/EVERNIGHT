import { Enemy, EnemyType, Player, Projectile } from './types';

export interface EnemyStats {
  type: EnemyType;
  baseHp: number;
  baseSpeed: number;
  baseDamage: number;
  radius: number;
  xpValue: number;
}

export const ENEMY_BASE_STATS: Record<EnemyType, EnemyStats> = {
  slime: {
    type: 'slime',
    baseHp: 18,
    baseSpeed: 75,
    baseDamage: 7,
    radius: 12,
    xpValue: 1,
  },
  snake: {
    type: 'snake',
    baseHp: 30,
    baseSpeed: 95,
    baseDamage: 10,
    radius: 13,
    xpValue: 2,
  },
  boar: {
    type: 'boar',
    baseHp: 65,
    baseSpeed: 80,
    baseDamage: 16,
    radius: 15,
    xpValue: 4,
  },
  frog: {
    type: 'frog',
    baseHp: 45,
    baseSpeed: 90,
    baseDamage: 12,
    radius: 14,
    xpValue: 3,
  },
  mushroom: {
    type: 'mushroom',
    baseHp: 50,
    baseSpeed: 60,
    baseDamage: 11,
    radius: 14,
    xpValue: 3,
  },
  snail: {
    type: 'snail',
    baseHp: 140,
    baseSpeed: 42,
    baseDamage: 14,
    radius: 16,
    xpValue: 5,
  },
  plant: {
    type: 'plant',
    baseHp: 75,
    baseSpeed: 48,
    baseDamage: 15,
    radius: 15,
    xpValue: 5,
  },
  fire_imp: {
    type: 'fire_imp',
    baseHp: 85,
    baseSpeed: 105,
    baseDamage: 18,
    radius: 15,
    xpValue: 6,
  },
  ghost: {
    type: 'ghost',
    baseHp: 200,
    baseSpeed: 110,
    baseDamage: 22,
    radius: 18,
    xpValue: 10,
  },
};

export class EnemyWaveManager {
  private nextEnemyId = 1;
  private spawnTimer = 0;
  private bossTimer = 0;
  private spawnedBosses: Set<number> = new Set(); // minutes marked

  public updateAndSpawn(
    dt: number,
    survivalTime: number,
    player: Player,
    activeEnemies: Enemy[],
    viewWidth: number,
    viewHeight: number
  ): Enemy[] {
    this.spawnTimer += dt;
    this.bossTimer += dt;

    const newEnemies: Enemy[] = [];
    const minutes = Math.floor(survivalTime / 60);

    // Dynamic wave composition based on survival time (Vampire Survivors progression)
    let availableTypes: EnemyType[] = ['slime'];
    if (survivalTime >= 30) availableTypes.push('snake');
    if (survivalTime >= 60) availableTypes.push('frog', 'snail');
    if (survivalTime >= 120) availableTypes.push('boar', 'mushroom');
    if (survivalTime >= 180) availableTypes.push('plant');
    if (survivalTime >= 240) availableTypes.push('fire_imp');
    if (survivalTime >= 360) availableTypes.push('ghost');

    // Escalating spawn rate: from 1.5/s at start to 20+/s at minute 10
    const spawnInterval = Math.max(0.12, 1.2 - (survivalTime / 600) * 1.0);
    const maxEnemiesOnScreen = Math.min(450, 80 + Math.floor(survivalTime * 0.7));

    if (this.spawnTimer >= spawnInterval && activeEnemies.length < maxEnemiesOnScreen) {
      this.spawnTimer = 0;

      // Batch spawn size increases with time
      const batchCount = Math.min(8, 1 + Math.floor(survivalTime / 90));
      for (let i = 0; i < batchCount; i++) {
        if (activeEnemies.length + newEnemies.length >= maxEnemiesOnScreen) break;

        const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        const isElite = Math.random() < Math.min(0.12, 0.02 + survivalTime * 0.0001);

        const enemy = this.createEnemy(type, player, viewWidth, viewHeight, survivalTime, isElite, false);
        newEnemies.push(enemy);
      }
    }

    // Check scheduled boss encounters
    // Minute 3: Giant Boar Alpha
    if (minutes === 3 && !this.spawnedBosses.has(3)) {
      this.spawnedBosses.add(3);
      newEnemies.push(this.createBoss('boar', player, viewWidth, viewHeight, survivalTime, 'ALPHA TUSK'));
    }
    // Minute 6: Infernal Flame Behemoth
    if (minutes === 6 && !this.spawnedBosses.has(6)) {
      this.spawnedBosses.add(6);
      newEnemies.push(this.createBoss('fire_imp', player, viewWidth, viewHeight, survivalTime, 'INFERNAL COLOSSUS'));
    }
    // Minute 9: The Grim Harvester Boss
    if (minutes === 9 && !this.spawnedBosses.has(9)) {
      this.spawnedBosses.add(9);
      newEnemies.push(this.createBoss('ghost', player, viewWidth, viewHeight, survivalTime, 'THE GRIM HARVESTER'));
    }

    return newEnemies;
  }

  private createEnemy(
    type: EnemyType,
    player: Player,
    vw: number,
    vh: number,
    survivalTime: number,
    isElite: boolean,
    isBoss: boolean
  ): Enemy {
    // Spawn just outside camera viewport
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.max(vw, vh) * 0.6 + 60;
    const x = player.x + Math.cos(angle) * distance;
    const y = player.y + Math.sin(angle) * distance;

    const base = ENEMY_BASE_STATS[type];
    const hpScale = 1 + (survivalTime / 60) * 0.35;
    const eliteMult = isElite ? 4.0 : 1.0;

    return {
      id: this.nextEnemyId++,
      type,
      x,
      y,
      vx: 0,
      vy: 0,
      radius: isElite ? base.radius * 1.4 : base.radius,
      maxHp: Math.round(base.baseHp * hpScale * eliteMult),
      hp: Math.round(base.baseHp * hpScale * eliteMult),
      speed: base.baseSpeed * (isElite ? 1.15 : 1.0),
      damage: Math.round(base.baseDamage * (isElite ? 1.5 : 1.0)),
      xpValue: isElite ? base.xpValue * 8 : base.xpValue,
      isElite,
      isBoss,
      facing: x < player.x ? 1 : -1,
      hurtTimer: 0,
      behaviorTimer: Math.random() * 2,
      chargeCooldown: 2.0,
      shootCooldown: 1.5 + Math.random(),
    };
  }

  private createBoss(
    type: EnemyType,
    player: Player,
    vw: number,
    vh: number,
    survivalTime: number,
    _bossName: string
  ): Enemy {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.max(vw, vh) * 0.55 + 50;
    const x = player.x + Math.cos(angle) * distance;
    const y = player.y + Math.sin(angle) * distance;

    const base = ENEMY_BASE_STATS[type];
    const bossHp = Math.round(base.baseHp * 35 + survivalTime * 15);

    return {
      id: this.nextEnemyId++,
      type,
      x,
      y,
      vx: 0,
      vy: 0,
      radius: base.radius * 2.2,
      maxHp: bossHp,
      hp: bossHp,
      speed: base.baseSpeed * 1.25,
      damage: base.baseDamage * 2.5,
      xpValue: 120,
      isElite: true,
      isBoss: true,
      facing: 1,
      hurtTimer: 0,
      behaviorTimer: 0,
      chargeCooldown: 1.5,
      shootCooldown: 1.2,
    };
  }

  /**
   * Updates individual enemy AI based on its specific archetype
   */
  public updateEnemyBehavior(
    enemy: Enemy,
    player: Player,
    dt: number,
    newProjectiles: Projectile[]
  ) {
    enemy.behaviorTimer += dt;
    enemy.chargeCooldown -= dt;
    enemy.shootCooldown -= dt;

    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.hypot(dx, dy) || 1;
    const nx = dx / dist;
    const ny = dy / dist;

    enemy.facing = dx >= 0 ? 1 : -1;

    switch (enemy.type) {
      case 'boar': {
        // Charge attack when close
        if (dist < 260 && enemy.chargeCooldown <= 0) {
          // Dash at high speed
          enemy.vx = nx * enemy.speed * 2.8;
          enemy.vy = ny * enemy.speed * 2.8;
          enemy.chargeCooldown = 3.2;
        } else {
          // Standard pursuit
          enemy.vx += (nx * enemy.speed - enemy.vx) * 0.1;
          enemy.vy += (ny * enemy.speed - enemy.vy) * 0.1;
        }
        break;
      }

      case 'frog': {
        // Hop movement: rest, then sudden leap
        const hopCycle = (enemy.behaviorTimer * 1.8) % 2.0;
        if (hopCycle < 0.6) {
          // Airborne leap
          enemy.vx = nx * enemy.speed * 2.2;
          enemy.vy = ny * enemy.speed * 2.2;
        } else {
          // Landing pause
          enemy.vx *= 0.85;
          enemy.vy *= 0.85;
        }
        break;
      }

      case 'snake': {
        // Meandering sine wave
        const perpX = -ny;
        const perpY = nx;
        const wave = Math.sin(enemy.behaviorTimer * 4.5) * 0.65;
        enemy.vx = (nx + perpX * wave) * enemy.speed;
        enemy.vy = (ny + perpY * wave) * enemy.speed;
        break;
      }

      case 'plant': {
        // Keep distance & shoot thorny thorns
        if (dist < 220) {
          // Back up slightly or stop
          enemy.vx = -nx * enemy.speed * 0.4;
          enemy.vy = -ny * enemy.speed * 0.4;
        } else {
          enemy.vx = nx * enemy.speed * 0.7;
          enemy.vy = ny * enemy.speed * 0.7;
        }

        // Ranged attack
        if (enemy.shootCooldown <= 0 && dist < 380) {
          enemy.shootCooldown = 2.4;
          newProjectiles.push({
            id: Math.floor(Math.random() * 1000000),
            weaponId: 'throwing_daggers', // reuse projectile mechanics
            x: enemy.x,
            y: enemy.y,
            vx: nx * 180,
            vy: ny * 180,
            damage: 8,
            radius: 5,
            pierce: 1,
            life: 2.2,
            maxLife: 2.2,
            angle: Math.atan2(ny, nx),
            hitEnemies: new Set(),
            isArea: false,
            areaColor: '#db2777', // thorny pink
          });
        }
        break;
      }

      case 'fire_imp': {
        // Fast float + fireball shooting
        enemy.vx = nx * enemy.speed;
        enemy.vy = ny * enemy.speed;

        if (enemy.shootCooldown <= 0 && dist < 420) {
          enemy.shootCooldown = 2.8;
          newProjectiles.push({
            id: Math.floor(Math.random() * 1000000),
            weaponId: 'fire_wand',
            x: enemy.x,
            y: enemy.y,
            vx: nx * 210,
            vy: ny * 210,
            damage: 12,
            radius: 7,
            pierce: 1,
            life: 2.5,
            maxLife: 2.5,
            angle: Math.atan2(ny, nx),
            hitEnemies: new Set(),
            isArea: true,
            areaColor: '#ea580c',
          });
        }
        break;
      }

      case 'snail': {
        // Unstoppable slow tank
        enemy.vx = nx * enemy.speed;
        enemy.vy = ny * enemy.speed;
        break;
      }

      case 'ghost': {
        // Phasing wraith - moves with float acceleration
        enemy.vx += (nx * enemy.speed - enemy.vx) * 0.08;
        enemy.vy += (ny * enemy.speed - enemy.vy) * 0.08;
        break;
      }

      default: {
        // Slime / Mushroom: direct pursuit
        enemy.vx = nx * enemy.speed;
        enemy.vy = ny * enemy.speed;
        break;
      }
    }

    enemy.x += enemy.vx * dt;
    enemy.y += enemy.vy * dt;

    if (enemy.hurtTimer > 0) {
      enemy.hurtTimer -= dt;
    }
  }
}
