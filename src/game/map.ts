import { BiomeId, BiomeConfig, DestructibleObject, ShrineObject, ShrineType } from './types';

export const BIOMES: Record<BiomeId, BiomeConfig> = {
  verdant: {
    id: 'verdant',
    name: 'Verdant Meadows',
    description: 'Ancient ruins overgrown with wildflowers, mossy flagstones, and sacred shrines.',
    bgColor: '#0f1f14',
    obstacleType: 'tree',
    accentColor: '#4ade80',
  },
  scorched: {
    id: 'scorched',
    name: 'Scorched Crypts',
    description: 'Cracked volcanic basalt slabs etched with glowing runes and smoldering embers.',
    bgColor: '#170c0c',
    obstacleType: 'pillar',
    accentColor: '#f97316',
  },
  haunted: {
    id: 'haunted',
    name: 'Haunted Mire',
    description: 'Murky swamp surrounded by bioluminescent fungi, cold fog, and cursed barrows.',
    bgColor: '#0c1318',
    obstacleType: 'grave',
    accentColor: '#a855f7',
  },
};

export interface MapObstacle {
  x: number;
  y: number;
  radius: number;
  type: string;
}

export interface LightSource {
  x: number;
  y: number;
  radius: number;
  color: string;
  intensity: number;
}

export interface MapChunk {
  chunkX: number;
  chunkY: number;
  canvas: HTMLCanvasElement;
  obstacles: MapObstacle[];
  destructibles: DestructibleObject[];
  shrines: ShrineObject[];
  lights: LightSource[];
}

export class ProceduralMap {
  public biome: BiomeConfig;
  public readonly chunkSize = 512;
  private chunks: Map<string, MapChunk> = new Map();
  private nextDestructibleId = 1;

  constructor(biomeId: BiomeId = 'verdant') {
    this.biome = BIOMES[biomeId] || BIOMES.verdant;
  }

  public setBiome(biomeId: BiomeId) {
    this.biome = BIOMES[biomeId] || BIOMES.verdant;
    this.chunks.clear();
  }

  private hashCoords(cx: number, cy: number): number {
    let h = (cx * 73856093) ^ (cy * 19349663);
    h = (h ^ (h >> 13)) * 0x5bd1e995;
    return (h ^ (h >> 15)) >>> 0;
  }

  public getChunk(cx: number, cy: number): MapChunk {
    const key = `${cx},${cy}`;
    const cached = this.chunks.get(key);
    if (cached) return cached;

    const chunk = this.generateChunk(cx, cy);
    this.chunks.set(key, chunk);

    // Keep active chunk cache bounded
    if (this.chunks.size > 70) {
      const firstKey = this.chunks.keys().next().value;
      if (firstKey) this.chunks.delete(firstKey);
    }

    return chunk;
  }

  private generateChunk(cx: number, cy: number): MapChunk {
    const canvas = document.createElement('canvas');
    canvas.width = this.chunkSize;
    canvas.height = this.chunkSize;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    let seed = this.hashCoords(cx, cy);
    const rng = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };

    const lights: LightSource[] = [];

    // 1. Base Soil / Basalt / Mud Foundation
    ctx.fillStyle = this.biome.bgColor;
    ctx.fillRect(0, 0, this.chunkSize, this.chunkSize);

    // 2. Micro-texture Dithering (Eliminates flat solid color)
    for (let x = 0; x < this.chunkSize; x += 16) {
      for (let y = 0; y < this.chunkSize; y += 16) {
        if (rng() > 0.65) {
          ctx.fillStyle =
            this.biome.id === 'verdant'
              ? 'rgba(21, 128, 61, 0.08)'
              : this.biome.id === 'scorched'
                ? 'rgba(234, 88, 12, 0.06)'
                : 'rgba(126, 34, 206, 0.06)';
          ctx.fillRect(x, y, 16, 16);
        }
      }
    }

    // 3. Organic Terrain Patches & Paths
    const patchCount = 20;
    for (let i = 0; i < patchCount; i++) {
      const px = rng() * (this.chunkSize - 40);
      const py = rng() * (this.chunkSize - 40);
      const pw = 30 + rng() * 60;
      const ph = 24 + rng() * 45;

      if (this.biome.id === 'verdant') {
        // Lush green grass clusters with soft edges
        ctx.fillStyle = rng() > 0.5 ? 'rgba(34, 197, 94, 0.12)' : 'rgba(22, 101, 52, 0.18)';
        ctx.beginPath();
        ctx.roundRect(px, py, pw, ph, [8, 12, 10, 8]);
        ctx.fill();

        // Delicate Wildflowers (poppies, daisies, bluebells)
        if (rng() > 0.35) {
          const flowerColors = ['#facc15', '#f43f5e', '#38bdf8', '#ffffff'];
          const fc = flowerColors[Math.floor(rng() * flowerColors.length)];
          ctx.fillStyle = fc;
          ctx.fillRect(px + 4, py + 4, 3, 3);
          ctx.fillRect(px + 14, py + 8, 3, 3);
          ctx.fillRect(px + 8, py + 16, 3, 3);
        }
      } else if (this.biome.id === 'scorched') {
        // Obsidian basalt slabs & magma veins
        ctx.fillStyle = 'rgba(30, 41, 59, 0.4)';
        ctx.beginPath();
        ctx.roundRect(px, py, pw, ph, [4, 4, 4, 4]);
        ctx.fill();

        // Molten lava fissures
        if (rng() > 0.4) {
          const lx = px + 6;
          const ly = py + 8;
          ctx.fillStyle = '#b91c1c';
          ctx.fillRect(lx, ly, pw * 0.7, 3);
          ctx.fillStyle = '#ea580c';
          ctx.fillRect(lx + 2, ly, pw * 0.5, 2);
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(lx + 6, ly, pw * 0.3, 1);

          // Add subtle dynamic light source
          lights.push({
            x: cx * this.chunkSize + lx + pw * 0.3,
            y: cy * this.chunkSize + ly,
            radius: 45,
            color: '#f97316',
            intensity: 0.3,
          });
        }
      } else {
        // Haunted Mire: Murky swamp water pools & bioluminescent moss
        ctx.fillStyle = 'rgba(15, 23, 42, 0.5)';
        ctx.beginPath();
        ctx.ellipse(px + pw / 2, py + ph / 2, pw / 2, ph / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Bioluminescent glowing fungal clusters
        if (rng() > 0.45) {
          ctx.fillStyle = '#a855f7';
          ctx.fillRect(px + 6, py + 6, 4, 4);
          ctx.fillStyle = '#c084fc';
          ctx.fillRect(px + 7, py + 7, 2, 2);

          lights.push({
            x: cx * this.chunkSize + px + 8,
            y: cy * this.chunkSize + py + 8,
            radius: 35,
            color: '#c084fc',
            intensity: 0.25,
          });
        }
      }
    }

    // 4. Cobblestone / Ruin Tile Path (Organic trails connecting the world)
    if (rng() > 0.55) {
      const pathY = 120 + rng() * (this.chunkSize - 240);
      ctx.fillStyle = 'rgba(51, 65, 85, 0.22)';
      ctx.fillRect(0, pathY, this.chunkSize, 40);

      // Cobblestone paver details
      for (let x = 8; x < this.chunkSize; x += 32) {
        ctx.fillStyle = 'rgba(71, 85, 105, 0.35)';
        ctx.fillRect(x, pathY + 6, 24, 12);
        ctx.fillRect(x + 12, pathY + 22, 24, 12);
      }
    }

    // 5. Landmark Ruins / Props (Non-repetitive exploration points)
    const isSpawnChunk = cx === 0 && cy === 0;
    const obstacles: MapObstacle[] = [];
    const obstacleCount = isSpawnChunk ? 2 : Math.floor(2 + rng() * 3);

    for (let i = 0; i < obstacleCount; i++) {
      const ox = cx * this.chunkSize + 70 + rng() * (this.chunkSize - 140);
      const oy = cy * this.chunkSize + 70 + rng() * (this.chunkSize - 140);

      // Protect spawn area from obstructions
      if (isSpawnChunk && Math.hypot(ox, oy) < 200) continue;

      obstacles.push({
        x: ox,
        y: oy,
        radius: 18,
        type: this.biome.obstacleType,
      });

      const lx = ox - cx * this.chunkSize;
      const ly = oy - cy * this.chunkSize;

      // Draw rich landmark props
      if (this.biome.id === 'verdant') {
        // Ancient Mossy Oak / Woodland Shrine
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.ellipse(lx, ly + 14, 20, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Gnarled trunk
        ctx.fillStyle = '#29180c';
        ctx.fillRect(lx - 7, ly - 10, 14, 26);
        ctx.fillStyle = '#451a03';
        ctx.fillRect(lx - 5, ly - 8, 10, 22);

        // Volumetric leafy canopy
        ctx.fillStyle = '#14532d';
        ctx.beginPath();
        ctx.arc(lx, ly - 16, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#16a34a';
        ctx.beginPath();
        ctx.arc(lx - 5, ly - 20, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#4ade80';
        ctx.beginPath();
        ctx.arc(lx - 7, ly - 23, 10, 0, Math.PI * 2);
        ctx.fill();
      } else if (this.biome.id === 'scorched') {
        // Basalt Runestone / Flame Obelisk
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.ellipse(lx, ly + 16, 18, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(lx - 10, ly - 26, 20, 42);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(lx - 8, ly - 24, 16, 38);

        // Carved glowing magma glyph
        ctx.fillStyle = '#ea580c';
        ctx.fillRect(lx - 3, ly - 18, 6, 22);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(lx - 1, ly - 14, 2, 14);

        lights.push({
          x: ox,
          y: oy - 10,
          radius: 60,
          color: '#f97316',
          intensity: 0.45,
        });
      } else {
        // Ancient Stonehenge Dolmen / Weathered Celtic Cross
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.ellipse(lx, ly + 12, 18, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(lx - 12, ly - 16, 24, 28);
        ctx.fillStyle = '#334155';
        ctx.fillRect(lx - 10, ly - 14, 20, 24);

        // Creeping glowing moss & rune
        ctx.fillStyle = '#a855f7';
        ctx.fillRect(lx - 6, ly - 8, 12, 4);
        ctx.fillStyle = '#10b981';
        ctx.fillRect(lx - 8, ly + 4, 16, 3);

        lights.push({
          x: ox,
          y: oy,
          radius: 50,
          color: '#a855f7',
          intensity: 0.35,
        });
      }
    }

    // 6. Destructibles (Barrels, Braziers, Tombstones)
    const destructibles: DestructibleObject[] = [];
    const destCount = isSpawnChunk ? 2 : Math.floor(1 + rng() * 3);

    for (let i = 0; i < destCount; i++) {
      const dx = cx * this.chunkSize + 50 + rng() * (this.chunkSize - 100);
      const dy = cy * this.chunkSize + 50 + rng() * (this.chunkSize - 100);

      const type: 'barrel' | 'brazier' | 'tombstone' =
        this.biome.id === 'verdant'
          ? 'barrel'
          : this.biome.id === 'scorched'
            ? 'brazier'
            : 'tombstone';

      destructibles.push({
        id: this.nextDestructibleId++,
        x: dx,
        y: dy,
        hp: 1,
        type,
      });

      if (type === 'brazier') {
        lights.push({
          x: dx,
          y: dy,
          radius: 75,
          color: '#f97316',
          intensity: 0.5,
        });
      }
    }

    // 7. Mystery Shrines (Procedural risk-reward altars)
    const shrines: ShrineObject[] = [];
    if (!isSpawnChunk && rng() > 0.65) {
      const sx = cx * this.chunkSize + 120 + rng() * (this.chunkSize - 240);
      const sy = cy * this.chunkSize + 120 + rng() * (this.chunkSize - 240);
      const shrineTypes: ShrineType[] = ['blood', 'greed', 'haste', 'oracle'];
      const type = shrineTypes[Math.floor(rng() * shrineTypes.length)];
      const descriptions: Record<ShrineType, string> = {
        blood: 'Sacrifice 20% max HP for +25% Might for this run!',
        greed: 'Summon an enraged elite horde for +150 Gold coins!',
        haste: 'Lose 1 Armor for +20% Move Speed and -25% Dash Cooldown!',
        oracle: '50% chance for a Treasure Chest; 50% chance for lightning hazard!',
      };

      shrines.push({
        id: cx * 1000 + cy,
        x: sx,
        y: sy,
        type,
        used: false,
        title: `Shrine of ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        description: descriptions[type],
      });

      lights.push({
        x: sx,
        y: sy,
        radius: 75,
        color:
          type === 'blood'
            ? '#ef4444'
            : type === 'greed'
              ? '#f59e0b'
              : type === 'haste'
                ? '#38bdf8'
                : '#c084fc',
        intensity: 0.6,
      });
    }

    return {
      chunkX: cx,
      chunkY: cy,
      canvas,
      obstacles,
      destructibles,
      shrines,
      lights,
    };
  }
}
