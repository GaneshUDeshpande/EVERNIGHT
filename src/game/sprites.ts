import { EnemyType } from './types';

/**
 * Modern High-Resolution Procedural Pixel-Art Engine and Texture Atlas.
 * Recreates the authentic character sprite sheet (4-frame walk cycle, idle, attack, death)
 * and all 9 enemy types (2-frame animated walk/action cycles, elite and boss variations)
 * with multi-tone shading, specular highlights, dynamic shadows, and combat visual effects.
 */

export interface CachedSprite {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  originX: number;
  originY: number;
}

class SpriteRegistry {
  private cache: Map<string, CachedSprite> = new Map();
  private initialized: boolean = false;

  public init() {
    if (this.initialized) return;
    this.initialized = true;

    // 1. Generate player character animations (Idle, 4-frame walk, Attack, Death)
    for (let f = 0; f < 4; f++) {
      this.generatePlayerWalkFrame(f, false);
      this.generatePlayerWalkFrame(f, true); // White hurt flash
    }
    this.generatePlayerIdleFrame(false);
    this.generatePlayerIdleFrame(true);
    this.generatePlayerAttackFrame(false);
    this.generatePlayerAttackFrame(true);
    this.generatePlayerDeathFrame();

    // 2. Generate 9 enemy types across 2 animation frames each (normal, hurt, elite, boss)
    const enemyTypes: EnemyType[] = [
      'slime',
      'snake',
      'plant',
      'boar',
      'frog',
      'mushroom',
      'ghost',
      'fire_imp',
      'snail',
    ];

    for (const type of enemyTypes) {
      for (let f = 0; f < 2; f++) {
        this.generateEnemySprite(type, f, false, false, false);
        this.generateEnemySprite(type, f, true, false, false); // Hurt
        this.generateEnemySprite(type, f, false, true, false); // Elite
        this.generateEnemySprite(type, f, false, false, true); // Boss
      }
    }

    // 3. Generate Pickups & Collectibles
    this.generateGemSprite('xp_blue', '#38bdf8', '#0284c7', '#0369a1');
    this.generateGemSprite('xp_green', '#4ade80', '#16a34a', '#15803d');
    this.generateGemSprite('xp_red', '#f87171', '#dc2626', '#991b1b');
    this.generateGemSprite('xp_purple', '#c084fc', '#9333ea', '#6b21a8');
    this.generateCoinSprite();
    this.generateChestSprite();
    this.generateChickenSprite();
    this.generateMagnetSprite();

    // 4. Generate Destructibles & Environmental Props
    this.generateDestructibleSprite('barrel');
    this.generateDestructibleSprite('brazier');
    this.generateDestructibleSprite('tombstone');

    // Generate Mystery Shrines
    this.generateShrineSprite('blood');
    this.generateShrineSprite('greed');
    this.generateShrineSprite('haste');
    this.generateShrineSprite('oracle');

    // 5. Weapon Attack Effects
    this.generateSlashEffect('silver', '#f8fafc', '#94a3b8');
    this.generateSlashEffect('gold', '#fef08a', '#eab308');
  }

  public get(key: string): CachedSprite | undefined {
    return this.cache.get(key);
  }

  // ==========================================
  // --- PLAYER CHARACTER (Image 1 Fidelity) ---
  // ==========================================

  private drawPlayerBase(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    frame: number,
    state: 'walk' | 'idle' | 'attack' | 'death',
    isHurt: boolean
  ) {
    const bob = state === 'walk' ? (frame % 2 === 1 ? -1 : 0) : 0;
    const legOffset = state === 'walk' ? (frame === 0 ? 3 : frame === 2 ? -3 : 0) : 0;
    const isAttacking = state === 'attack';

    const p = (x: number, y: number, color: string, sw: number = 2, sh: number = 2) => {
      ctx.fillStyle = isHurt ? '#ffffff' : color;
      ctx.fillRect(x, y + bob, sw, sh);
    };

    // 1. Soft Dynamic Ground Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(w / 2, h - 3, 16, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Sheathed Greatsword on Back
    p(14, 8, '#57341b', 3, 22); // Leather scabbard
    p(13, 4, '#e2e8f0', 5, 4); // Silver pommel
    p(11, 7, '#94a3b8', 9, 2); // Crossguard
    p(14, 11, '#b45309', 3, 3); // Brass buckle

    // 3. Blonde Ponytail (Volumetric with highlight & shadow)
    p(16, 10, '#b45309', 10, 10); // Darker shadow hair
    p(14, 12, '#f59e0b', 12, 10); // Main blonde tone
    p(12, 16, '#fbbf24', 8, 8); // Flowing tail
    p(10, 20, '#fde68a', 6, 6); // Sunlit tip
    p(22, 10, '#ea580c', 4, 4); // Orange ribbon / scrunchie

    // 4. Legs & Leather Boots
    if (state === 'death') {
      // Kneeling posture
      p(18, 38, '#1c1917', 14, 8);
      p(16, 44, '#78350f', 16, 8);
      p(14, 50, '#451a03', 18, 4);
    } else {
      // Back Leg
      p(19 - legOffset, 36, '#292524', 6, 8); // Dark pants
      p(18 - legOffset, 42, '#d97706', 7, 4); // Tan knee wrap
      p(17 - legOffset, 46, '#78350f', 8, 7); // Brown leather boot
      p(16 - legOffset, 51, '#451a03', 8, 3); // Boot sole
      // Front Leg
      p(24 + legOffset, 36, '#1c1917', 6, 8); // Dark pants front
      p(23 + legOffset, 42, '#b45309', 7, 4); // Knee cuff
      p(22 + legOffset, 46, '#92400e', 8, 7); // Boot front
      p(24 + legOffset, 51, '#451a03', 7, 3); // Sole
    }

    // 5. Tunic & Torso Armor
    p(18, 22, '#4c0519', 12, 14); // Deep burgundy base
    p(19, 23, '#881337', 10, 12); // Maroon midtone
    p(20, 24, '#9f1239', 8, 6); // Highlighted fold
    p(18, 33, '#c2410c', 12, 4); // Orange undershirt / sash
    p(22, 34, '#facc15', 4, 3); // Golden belt buckle
    p(23, 35, '#ca8a04', 2, 1);

    // 6. Head & Expressive Face
    p(21, 13, '#fed7aa', 10, 10); // Fair skin tone
    p(22, 15, '#ffedd5', 8, 6); // Facial highlight
    p(26, 16, '#0284c7', 2, 3); // Bright cyan eye
    p(26, 16, '#ffffff', 1, 1); // Eye pupil reflection
    p(27, 20, '#f43f5e', 3, 2); // Gentle blush
    p(22, 9, '#fcd34d', 11, 5); // Blonde fringe / bangs
    p(24, 8, '#fef08a', 7, 2); // Sunlight glint on hair

    // 7. Steel Pauldron (Segmented plate on shoulder)
    p(17, 19, '#475569', 9, 9); // Armor outline
    p(18, 20, '#94a3b8', 8, 8); // Steel plate midtone
    p(19, 21, '#e2e8f0', 6, 4); // Steel gleam highlight
    p(20, 25, '#334155', 3, 3); // Rivet bolt

    // 8. Kite Shield (Wooden grain, metal rim, and horned crest)
    const sx = 27;
    const sy = 19;
    // Wood core planks
    p(sx, sy, '#451a03', 14, 20);
    p(sx + 1, sy + 1, '#78350f', 12, 18);
    p(sx + 2, sy + 2, '#92400e', 10, 16);
    // Vertical wood plank line
    p(sx + 6, sy + 2, '#451a03', 1, 16);
    // Iron rim
    p(sx - 1, sy - 1, '#94a3b8', 16, 2); // Top rim
    p(sx - 1, sy + 1, '#64748b', 2, 18); // Left rim
    p(sx + 13, sy + 1, '#475569', 2, 18); // Right rim
    p(sx + 3, sy + 19, '#475569', 8, 3); // Bottom taper
    // Corner reinforcement brackets
    p(sx - 1, sy - 1, '#cbd5e1', 3, 3);
    p(sx + 12, sy - 1, '#cbd5e1', 3, 3);
    // Horned Crest Insignia in center
    p(sx + 4, sy + 6, '#f1f5f9', 6, 6); // Crest face
    p(sx + 2, sy + 4, '#cbd5e1', 3, 4); // Left horn
    p(sx + 9, sy + 4, '#cbd5e1', 3, 4); // Right horn
    p(sx + 5, sy + 8, '#64748b', 4, 3); // Shadow cutout

    // 9. Arming Sword
    if (isAttacking) {
      // Swung forward horizontally in full attack extension
      p(32, 26, '#fed7aa', 4, 4); // Forward hand
      p(36, 25, '#f59e0b', 2, 8); // Gold crossguard
      p(38, 28, '#ffffff', 18, 3); // Blazing blade sweep
      p(40, 27, '#cbd5e1', 16, 1); // Blade spine
      p(54, 28, '#f1f5f9', 4, 2); // Tip point
    } else if (state === 'death') {
      // Blade thrust into ground as solemn monument
      p(10, 28, '#f59e0b', 6, 2);
      p(12, 30, '#cbd5e1', 3, 24);
      p(11, 52, '#94a3b8', 5, 2);
    } else {
      // Resting / walking blade angle
      const swordSwing = frame === 1 ? -4 : frame === 3 ? 3 : 0;
      p(17, 30 + swordSwing, '#fed7aa', 4, 4); // Hand
      p(15, 32 + swordSwing, '#f59e0b', 7, 2); // Gold guard
      p(13, 34 + swordSwing, '#f8fafc', 4, 12); // Silver blade
      p(11, 44 + swordSwing, '#cbd5e1', 4, 8);
      p(10, 50 + swordSwing, '#94a3b8', 3, 4); // Tip
    }
  }

  private generatePlayerWalkFrame(frame: number, isHurt: boolean) {
    const w = 56;
    const h = 60;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    this.drawPlayerBase(ctx, w, h, frame, 'walk', isHurt);

    this.cache.set(`player_${frame}_${isHurt ? 'hurt' : 'normal'}`, {
      canvas,
      width: w,
      height: h,
      originX: w / 2,
      originY: h - 6,
    });
  }

  private generatePlayerIdleFrame(isHurt: boolean) {
    const w = 56;
    const h = 60;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    this.drawPlayerBase(ctx, w, h, 0, 'idle', isHurt);

    this.cache.set(`player_idle_${isHurt ? 'hurt' : 'normal'}`, {
      canvas,
      width: w,
      height: h,
      originX: w / 2,
      originY: h - 6,
    });
  }

  private generatePlayerAttackFrame(isHurt: boolean) {
    const w = 64;
    const h = 60;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    this.drawPlayerBase(ctx, w, h, 1, 'attack', isHurt);

    this.cache.set(`player_attack_${isHurt ? 'hurt' : 'normal'}`, {
      canvas,
      width: w,
      height: h,
      originX: 28,
      originY: h - 6,
    });
  }

  private generatePlayerDeathFrame() {
    const w = 56;
    const h = 60;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    this.drawPlayerBase(ctx, w, h, 0, 'death', false);

    this.cache.set('player_death', {
      canvas,
      width: w,
      height: h,
      originX: w / 2,
      originY: h - 6,
    });
  }

  // ==========================================
  // --- 9 ENEMY TYPES (Image 2 Fidelity) ---
  // ==========================================

  private generateEnemySprite(
    type: EnemyType,
    frame: number,
    isHurt: boolean,
    isElite: boolean,
    isBoss: boolean
  ) {
    const baseSize = 34;
    const size = isBoss ? 64 : isElite ? 48 : baseSize;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    const scale = isBoss ? 1.85 : isElite ? 1.4 : 1.0;
    ctx.save();
    ctx.scale(scale, scale);

    const px = (x: number, y: number, color: string, w = 1, h = 1) => {
      ctx.fillStyle = isHurt ? '#ffffff' : color;
      ctx.fillRect(x, y, w, h);
    };

    // Soft grounded shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(17, 30, isBoss ? 16 : 10, isBoss ? 6 : 4, 0, 0, Math.PI * 2);
    ctx.fill();

    const bob = frame === 1 ? -1 : 0;

    switch (type) {
      case 'slime': {
        // Cute teardrop blue slime with eye shine & bounce
        const squish = frame === 1 ? 1 : 0;
        // Body base
        for (let y = 8 + squish; y <= 27; y++) {
          const hw = y < 14 ? (y - 8) * 1.5 : y > 23 ? 27 - y + 6 : 10;
          px(17 - hw, y + bob, '#1d4ed8', hw * 2, 1);
        }
        // Shading layers
        px(11, 14 + bob, '#3b82f6', 12, 10);
        px(12, 10 + bob, '#60a5fa', 6, 6);
        px(13, 9 + bob, '#bfdbfe', 3, 3); // Gloss shine
        // Eyes
        px(12, 20 + bob, '#020617', 2, 3);
        px(20, 20 + bob, '#020617', 2, 3);
        px(12, 19 + bob, '#ffffff', 1, 1);
        px(20, 19 + bob, '#ffffff', 1, 1);
        break;
      }

      case 'snake': {
        // Lime-green slithering serpent with flickering tongue
        const wave = frame === 1 ? -1 : 1;
        // Head
        px(7 + wave, 7 + bob, '#15803d', 10, 8);
        px(8 + wave, 8 + bob, '#22c55e', 8, 6);
        px(9 + wave, 9 + bob, '#86efac', 4, 3);
        // Beady eyes
        px(9 + wave, 9 + bob, '#052e16', 2, 2);
        px(13 + wave, 9 + bob, '#052e16', 2, 2);
        // Forked tongue flickering
        if (frame === 0) {
          px(5 + wave, 13 + bob, '#ef4444', 3, 1);
          px(4 + wave, 14 + bob, '#ef4444', 2, 2);
        } else {
          px(6 + wave, 13 + bob, '#dc2626', 2, 1);
          px(5 + wave, 12 + bob, '#dc2626', 2, 2);
        }
        // Coiled body segments
        px(12, 14 + bob, '#16a34a', 6, 9);
        px(16 - wave, 19 + bob, '#15803d', 7, 7);
        px(21, 16 + bob, '#22c55e', 5, 8);
        px(25 + wave, 20 + bob, '#166534', 4, 7);
        // Underbelly stripes
        px(13, 17 + bob, '#bbf7d0', 3, 2);
        px(18 - wave, 22 + bob, '#bbf7d0', 3, 2);
        break;
      }

      case 'plant': {
        // Carnivorous Chomper with pink jaws and sharp fangs
        const mouthOpen = frame === 0 ? 0 : -2;
        // Stem & broad green leaves
        px(15, 18, '#14532d', 4, 9);
        px(16, 19, '#16a34a', 2, 8);
        px(6, 24, '#15803d', 9, 3);
        px(19, 24, '#15803d', 9, 3);
        px(8, 23, '#4ade80', 5, 2);
        px(21, 23, '#4ade80', 5, 2);
        // Pink toothy jaws
        px(7, 5 + mouthOpen, '#9d174d', 20, 14);
        px(9, 7 + mouthOpen, '#db2777', 16, 10);
        px(11, 8 + mouthOpen, '#f472b6', 12, 6);
        // Dark cavernous mouth interior
        px(10, 9 + mouthOpen, '#4c0519', 14, 7);
        // Sharp White Teeth
        px(11, 9 + mouthOpen, '#ffffff', 2, 2);
        px(15, 9 + mouthOpen, '#ffffff', 2, 2);
        px(19, 9 + mouthOpen, '#ffffff', 2, 2);
        px(12, 14 + mouthOpen, '#ffffff', 2, 2);
        px(16, 14 + mouthOpen, '#ffffff', 2, 2);
        px(20, 14 + mouthOpen, '#ffffff', 2, 2);
        break;
      }

      case 'boar': {
        // Brown wild boar with charging tusks and galloping legs
        const legStep = frame === 1 ? 2 : -2;
        // Stout body
        px(7, 11 + bob, '#451a03', 19, 13);
        px(8, 12 + bob, '#78350f', 17, 11);
        px(10, 14 + bob, '#92400e', 13, 6);
        // Snout
        px(4, 14 + bob, '#292524', 6, 8);
        px(3, 16 + bob, '#1c1917', 4, 4);
        // Gleaming White Tusks
        px(4, 18 + bob, '#ffffff', 2, 4);
        px(5, 17 + bob, '#f8fafc', 2, 2);
        // Angry eye
        px(9, 13 + bob, '#facc15', 3, 2);
        px(10, 13 + bob, '#000000', 1, 1);
        // Pointed ear
        px(10, 9 + bob, '#78350f', 4, 4);
        // Galloping Legs
        px(8 + legStep, 24, '#451a03', 3, 5);
        px(14 - legStep, 24, '#451a03', 3, 5);
        px(19 + legStep, 24, '#451a03', 3, 5);
        px(23 - legStep, 24, '#451a03', 3, 5);
        // Short tail
        px(25, 14 + bob, '#78350f', 3, 3);
        break;
      }

      case 'frog': {
        // Green sitting toad with bulging eyes and jumping posture
        const isLeaping = frame === 1;
        // Bulging eyeballs
        px(9, 6 + (isLeaping ? -2 : 0), '#047857', 5, 5);
        px(20, 6 + (isLeaping ? -2 : 0), '#047857', 5, 5);
        px(10, 7 + (isLeaping ? -2 : 0), '#059669', 3, 3);
        px(21, 7 + (isLeaping ? -2 : 0), '#059669', 3, 3);
        px(11, 8 + (isLeaping ? -2 : 0), '#064e3b', 2, 2);
        px(22, 8 + (isLeaping ? -2 : 0), '#064e3b', 2, 2);
        px(11, 7 + (isLeaping ? -2 : 0), '#ffffff', 1, 1);
        px(22, 7 + (isLeaping ? -2 : 0), '#ffffff', 1, 1);
        // Head & plump body
        px(8, 11 + bob, '#065f46', 18, 13);
        px(9, 12 + bob, '#059669', 16, 11);
        px(11, 14 + bob, '#10b981', 12, 7);
        // Wide mouth
        px(10, 16 + bob, '#022c22', 14, 1);
        // Folded or stretched legs
        if (isLeaping) {
          px(5, 23, '#047857', 5, 8);
          px(24, 23, '#047857', 5, 8);
        } else {
          px(6, 22, '#047857', 6, 6);
          px(22, 22, '#047857', 6, 6);
          px(12, 24, '#059669', 10, 4);
        }
        break;
      }

      case 'mushroom': {
        // Red cap mushroom with white spots and smiling stalk
        const squish = frame === 1 ? 1 : 0;
        // Red Domed Cap
        px(6, 6 + squish, '#991b1b', 22, 12);
        px(7, 7 + squish, '#dc2626', 20, 10);
        px(9, 8 + squish, '#ef4444', 16, 6);
        // White Polka Spots
        px(9, 8 + squish, '#ffffff', 4, 4);
        px(17, 8 + squish, '#ffffff', 4, 4);
        px(22, 10 + squish, '#ffffff', 3, 3);
        px(13, 12 + squish, '#ffffff', 4, 3);
        // Creamy Stalk
        px(11, 17, '#b45309', 12, 10);
        px(12, 18, '#fef3c7', 10, 8);
        px(13, 19, '#ffffff', 8, 5);
        // Smiling eyes & mouth
        px(13, 20, '#78350f', 2, 2);
        px(19, 20, '#78350f', 2, 2);
        px(15, 23, '#78350f', 4, 1);
        break;
      }

      case 'ghost': {
        // Grim Reaper / Shadow Ghost with dark hooded cowl and pale mask
        const floatShift = frame === 1 ? 1 : -1;
        // Dark Hood & Robe
        px(8, 4 + floatShift, '#020617', 18, 22);
        px(9, 6 + floatShift, '#0f172a', 16, 18);
        px(10, 8 + floatShift, '#1e293b', 14, 14);
        // Ragged spectral wisps at base
        px(8, 25 + floatShift, '#0f172a', 3, 4);
        px(13, 26 + floatShift, '#0f172a', 4, 4);
        px(19, 25 + floatShift, '#0f172a', 3, 4);
        px(23, 24 + floatShift, '#0f172a', 3, 3);
        // Pale White Mask
        px(12, 10 + floatShift, '#e2e8f0', 10, 10);
        px(13, 11 + floatShift, '#f8fafc', 8, 8);
        // Black hollow sockets & sinister mouth
        px(14, 13 + floatShift, '#020617', 2, 3);
        px(18, 13 + floatShift, '#020617', 2, 3);
        px(15, 18 + floatShift, '#020617', 4, 2);
        // Ethereal eye flare
        px(14, 14 + floatShift, '#38bdf8', 1, 1);
        px(18, 14 + floatShift, '#38bdf8', 1, 1);
        break;
      }

      case 'fire_imp': {
        // Fiery flame elemental with crackling spikes and amber glow
        const flare = frame === 1 ? 1 : 0;
        // Red/Orange Spire Flames
        px(7 - flare, 4, '#991b1b', 20 + flare * 2, 22);
        px(8, 6, '#dc2626', 18, 18);
        px(10, 8, '#ea580c', 14, 14);
        // Flame horns
        px(11, 2 - flare, '#dc2626', 3, 5);
        px(16, 1 + flare, '#ea580c', 3, 6);
        px(20, 3 - flare, '#dc2626', 3, 5);
        // Glowing Yellow Core & Face
        px(11, 12, '#f59e0b', 12, 10);
        px(13, 14, '#fef08a', 8, 6);
        // Angry eyes
        px(12, 15, '#450a0a', 3, 2);
        px(19, 15, '#450a0a', 3, 2);
        // Sharp mouth
        px(13, 19, '#7f1d1d', 8, 2);
        break;
      }

      case 'snail': {
        // Purple snail with lilac body, eyestalks, and shell spiral
        const glide = frame === 1 ? 1 : 0;
        // Lilac foot / body
        px(5 + glide, 19, '#be185d', 23, 8);
        px(6 + glide, 20, '#f472b6', 21, 6);
        px(7 + glide, 21, '#fbcfe8', 19, 3);
        // Eyestalks
        px(6 + glide, 11, '#f472b6', 2, 9);
        px(10 + glide, 11, '#f472b6', 2, 9);
        px(5 + glide, 10, '#000000', 3, 3);
        px(9 + glide, 10, '#000000', 3, 3);
        px(6 + glide, 10, '#ffffff', 1, 1);
        px(10 + glide, 10, '#ffffff', 1, 1);
        // Big Purple Spiral Shell
        px(13, 11, '#581c87', 15, 15);
        px(14, 12, '#7e22ce', 13, 13);
        px(15, 13, '#a855f7', 11, 11);
        // Spiral whorl grooves
        px(17, 15, '#4c1d95', 7, 7);
        px(19, 17, '#c084fc', 3, 3);
        break;
      }
    }

    ctx.restore();

    // Visual treatment for Elite: Golden runic corona
    if (isElite) {
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(3, 3, size - 6, size - 6);
      // Corner gems
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(2, 2, 3, 3);
      ctx.fillRect(size - 5, 2, 3, 3);
      ctx.fillRect(2, size - 5, 3, 3);
      ctx.fillRect(size - 5, size - 5, 3, 3);
    }

    // Visual treatment for Boss: Fiery crimson & gold royal spikes
    if (isBoss) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.strokeRect(2, 2, size - 4, size - 4);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1;
      ctx.strokeRect(5, 5, size - 10, size - 10);
    }

    const stateKey = isHurt ? 'hurt' : isBoss ? 'boss' : isElite ? 'elite' : 'normal';
    const key = `enemy_${type}_${frame}_${stateKey}`;
    this.cache.set(key, {
      canvas,
      width: size,
      height: size,
      originX: size / 2,
      originY: size / 2,
    });
  }

  // ==========================================
  // --- PICKUPS & COLLECTIBLES ---
  // ==========================================

  private generateGemSprite(name: string, bright: string, mid: string, dark: string) {
    const size = 18;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    // Diamond silhouette
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.moveTo(9, 1);
    ctx.lineTo(17, 9);
    ctx.lineTo(9, 17);
    ctx.lineTo(1, 9);
    ctx.closePath();
    ctx.fill();

    // Midtone facet
    ctx.fillStyle = mid;
    ctx.beginPath();
    ctx.moveTo(9, 3);
    ctx.lineTo(15, 9);
    ctx.lineTo(9, 15);
    ctx.lineTo(3, 9);
    ctx.closePath();
    ctx.fill();

    // Bright face
    ctx.fillStyle = bright;
    ctx.beginPath();
    ctx.moveTo(9, 5);
    ctx.lineTo(13, 9);
    ctx.lineTo(9, 13);
    ctx.lineTo(5, 9);
    ctx.closePath();
    ctx.fill();

    // Specular shine
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(7, 4, 3, 2);
    ctx.fillRect(8, 6, 2, 2);

    this.cache.set(`gem_${name}`, {
      canvas,
      width: size,
      height: size,
      originX: 9,
      originY: 9,
    });
  }

  private generateCoinSprite() {
    const size = 18;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    // Gilded Coin
    ctx.fillStyle = '#92400e';
    ctx.beginPath();
    ctx.arc(9, 9, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(9, 9, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(9, 9, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(7, 6, 4, 3);

    this.cache.set('item_coin', {
      canvas,
      width: size,
      height: size,
      originX: 9,
      originY: 9,
    });
  }

  private generateChestSprite() {
    const size = 32;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    // Gilded Oak Chest with metal trim
    ctx.fillStyle = '#451a03'; // Deep wood
    ctx.fillRect(4, 9, 24, 18);

    ctx.fillStyle = '#92400e'; // Front panels
    ctx.fillRect(6, 11, 20, 14);

    ctx.fillStyle = '#d97706'; // Gold straps
    ctx.fillRect(4, 9, 24, 3);
    ctx.fillRect(4, 17, 24, 3);
    ctx.fillRect(4, 25, 24, 2);

    ctx.fillStyle = '#facc15'; // Golden latch lock
    ctx.fillRect(14, 15, 4, 6);
    ctx.fillStyle = '#1e293b'; // Keyhole
    ctx.fillRect(15, 17, 2, 2);

    // Corner rivets
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(5, 10, 2, 2);
    ctx.fillRect(25, 10, 2, 2);

    this.cache.set('item_chest', {
      canvas,
      width: size,
      height: size,
      originX: 16,
      originY: 16,
    });
  }

  private generateChickenSprite() {
    const size = 22;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    // Bone
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(3, 14, 6, 4);
    ctx.fillRect(2, 13, 3, 6);

    // Juicy meat
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.arc(13, 10, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.arc(12, 9, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fef08a';
    ctx.fillRect(10, 7, 3, 2);

    this.cache.set('item_chicken', {
      canvas,
      width: size,
      height: size,
      originX: 11,
      originY: 11,
    });
  }

  private generateMagnetSprite() {
    const size = 22;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    // Red arch
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.arc(11, 11, 9, Math.PI, 0, false);
    ctx.lineTo(20, 16);
    ctx.lineTo(15, 16);
    ctx.lineTo(15, 11);
    ctx.arc(11, 11, 4, 0, Math.PI, true);
    ctx.lineTo(7, 16);
    ctx.lineTo(2, 16);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(11, 10, 7, Math.PI, 0, false);
    ctx.fill();

    // Silver poles
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(2, 14, 5, 4);
    ctx.fillRect(15, 14, 5, 4);

    this.cache.set('item_magnet', {
      canvas,
      width: size,
      height: size,
      originX: 11,
      originY: 11,
    });
  }

  private generateDestructibleSprite(type: 'barrel' | 'brazier' | 'tombstone') {
    const size = 32;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    if (type === 'barrel') {
      ctx.fillStyle = '#451a03';
      ctx.fillRect(6, 4, 20, 24);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(8, 4, 16, 24);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(10, 4, 12, 24);
      // Metal hoops
      ctx.fillStyle = '#475569';
      ctx.fillRect(5, 7, 22, 3);
      ctx.fillRect(5, 21, 22, 3);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(6, 8, 2, 1);
      ctx.fillRect(24, 8, 2, 1);
    } else if (type === 'brazier') {
      // Stone basin
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(7, 15, 18, 12);
      ctx.fillStyle = '#334155';
      ctx.fillRect(5, 13, 22, 4);
      // Fire inside
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(16, 8, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.arc(16, 8, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(16, 8, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Weathered Granite Cross
      ctx.fillStyle = '#334155';
      ctx.fillRect(6, 9, 20, 18);
      ctx.fillStyle = '#475569';
      ctx.fillRect(8, 7, 16, 18);
      // Carved cross & moss
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(15, 10, 2, 12);
      ctx.fillRect(12, 13, 8, 2);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(7, 22, 6, 4);
    }

    this.cache.set(`destructible_${type}`, {
      canvas,
      width: size,
      height: size,
      originX: 16,
      originY: 16,
    });
  }

  private generateShrineSprite(type: 'blood' | 'greed' | 'haste' | 'oracle') {
    const size = 36;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    // Ground shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(18, 31, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Base stone pedestal
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(8, 22, 20, 10);
    ctx.fillStyle = '#334155';
    ctx.fillRect(10, 20, 16, 4);

    if (type === 'blood') {
      // Crimson Spire with glowing red skull
      ctx.fillStyle = '#881337';
      ctx.fillRect(12, 6, 12, 16);
      ctx.fillStyle = '#be123c';
      ctx.fillRect(14, 4, 8, 16);
      // Crimson skull emblem
      ctx.fillStyle = '#fecdd3';
      ctx.fillRect(16, 8, 4, 4);
      ctx.fillStyle = '#4c0519';
      ctx.fillRect(17, 9, 1, 1);
      ctx.fillRect(19, 9, 1, 1);
      // Runes
      ctx.fillStyle = '#fb7185';
      ctx.fillRect(15, 14, 6, 2);
    } else if (type === 'greed') {
      // Golden Altar with coins
      ctx.fillStyle = '#78350f';
      ctx.fillRect(11, 7, 14, 15);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(13, 5, 10, 16);
      // Gold Chalice / Coin pile
      ctx.fillStyle = '#facc15';
      ctx.fillRect(14, 3, 8, 6);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(16, 4, 4, 2);
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(15, 13, 6, 4);
    } else if (type === 'haste') {
      // Azure Winged Wind Spire
      ctx.fillStyle = '#0369a1';
      ctx.fillRect(13, 5, 10, 17);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(15, 3, 6, 18);
      // Wing filigree
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(10, 8, 4, 8);
      ctx.fillRect(22, 8, 4, 8);
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(16, 7, 4, 4);
    } else {
      // Oracle: Violet Pedestal with Floating Mystic Orb
      ctx.fillStyle = '#581c87';
      ctx.fillRect(13, 10, 10, 12);
      ctx.fillStyle = '#7e22ce';
      ctx.fillRect(14, 8, 8, 14);
      // Floating Crystal Orb
      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.arc(18, 5, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(17, 3, 2, 2);
    }

    this.cache.set(`shrine_${type}`, {
      canvas,
      width: size,
      height: size,
      originX: 18,
      originY: 30,
    });
  }

  // ==========================================
  // --- COMBAT WEAPON FX ---
  // ==========================================

  private generateSlashEffect(name: string, bright: string, dark: string) {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Crescent arc sweep
    ctx.strokeStyle = dark;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(32, 32, 24, -Math.PI * 0.45, Math.PI * 0.45);
    ctx.stroke();

    ctx.strokeStyle = bright;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(32, 32, 24, -Math.PI * 0.4, Math.PI * 0.4);
    ctx.stroke();

    this.cache.set(`slash_${name}`, {
      canvas,
      width: size,
      height: size,
      originX: 32,
      originY: 32,
    });
  }
}

export const sprites = new SpriteRegistry();
