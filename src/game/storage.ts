import { PersistentSaveData, PermanentUpgrade, PlayerStats, RunResults, BiomeId } from './types';

const STORAGE_KEY = 'valkyrie_survivors_save_v1';

export const PERMANENT_UPGRADES: PermanentUpgrade[] = [
  {
    id: 'might',
    name: 'Might',
    description: 'Increases overall damage dealt by all weapons.',
    icon: '⚔️',
    currentRank: 0,
    maxRank: 5,
    baseCost: 200,
    costMultiplier: 1.5,
    bonusPerRank: '+5% Damage',
  },
  {
    id: 'armor',
    name: 'Armor',
    description: 'Reduces incoming damage from all enemy attacks.',
    icon: '🛡️',
    currentRank: 0,
    maxRank: 3,
    baseCost: 350,
    costMultiplier: 1.8,
    bonusPerRank: '+1 Armor',
  },
  {
    id: 'max_hp',
    name: 'Vitality',
    description: 'Increases maximum health pool.',
    icon: '❤️',
    currentRank: 0,
    maxRank: 5,
    baseCost: 200,
    costMultiplier: 1.5,
    bonusPerRank: '+15 Max HP',
  },
  {
    id: 'recovery',
    name: 'Recovery',
    description: 'Regenerates health continuously over time.',
    icon: '🧪',
    currentRank: 0,
    maxRank: 5,
    baseCost: 250,
    costMultiplier: 1.6,
    bonusPerRank: '+0.2 HP/sec',
  },
  {
    id: 'cooldown',
    name: 'Swift Casting',
    description: 'Reduces weapon attack intervals.',
    icon: '⌛',
    currentRank: 0,
    maxRank: 5,
    baseCost: 300,
    costMultiplier: 1.6,
    bonusPerRank: '-4% Cooldown',
  },
  {
    id: 'area',
    name: 'Area',
    description: 'Expands weapon attack radius and projectile size.',
    icon: '💥',
    currentRank: 0,
    maxRank: 5,
    baseCost: 200,
    costMultiplier: 1.5,
    bonusPerRank: '+5% Area',
  },
  {
    id: 'speed',
    name: 'Boots of Haste',
    description: 'Increases movement speed for agile kiting.',
    icon: '👢',
    currentRank: 0,
    maxRank: 5,
    baseCost: 150,
    costMultiplier: 1.4,
    bonusPerRank: '+5% Speed',
  },
  {
    id: 'magnet',
    name: 'Magnetism',
    description: 'Widens pickup attraction radius for XP gems and gold.',
    icon: '🧲',
    currentRank: 0,
    maxRank: 5,
    baseCost: 150,
    costMultiplier: 1.4,
    bonusPerRank: '+20% Pickup Range',
  },
  {
    id: 'growth',
    name: 'Scholar',
    description: 'Gains more experience from collected gems.',
    icon: '📖',
    currentRank: 0,
    maxRank: 5,
    baseCost: 250,
    costMultiplier: 1.6,
    bonusPerRank: '+10% XP Gain',
  },
  {
    id: 'greed',
    name: 'Greed',
    description: 'Increases gold coins found during runs.',
    icon: '💰',
    currentRank: 0,
    maxRank: 5,
    baseCost: 200,
    costMultiplier: 1.5,
    bonusPerRank: '+10% Gold',
  },
  {
    id: 'reroll',
    name: 'Fate Reroll',
    description: 'Allows rerolling upgrade options during level-up.',
    icon: '🎲',
    currentRank: 0,
    maxRank: 3,
    baseCost: 500,
    costMultiplier: 2.0,
    bonusPerRank: '+1 Reroll per Run',
  },
  {
    id: 'revival',
    name: 'Aegis Revival',
    description: 'Revives once upon death with 50% health restored.',
    icon: '✨',
    currentRank: 0,
    maxRank: 1,
    baseCost: 1500,
    costMultiplier: 1.0,
    bonusPerRank: '+1 Extra Life',
  },
];

export const ACHIEVEMENTS_CATALOG = [
  {
    id: 'first_blood',
    name: 'First Blood',
    description: 'Slay 100 fiends in a single run.',
    icon: '⚔️',
  },
  {
    id: 'titan_slayer',
    name: 'Titan Slayer',
    description: 'Defeat a massive Boss Titan encounter.',
    icon: '👑',
  },
  {
    id: 'transcendence',
    name: 'Transcendence',
    description: 'Forge an evolved weapon from a Treasure Chest.',
    icon: '✨',
  },
  {
    id: 'survivor',
    name: 'Seasoned Survivor',
    description: 'Survive the horde for at least 5 minutes.',
    icon: '⏳',
  },
  {
    id: 'endurance_legend',
    name: 'Endurance Legend',
    description: 'Survive the horde for at least 10 minutes.',
    icon: '🏆',
  },
  {
    id: 'acrobat',
    name: 'Valkyrie Acrobat',
    description: 'Execute 15 successful i-frame dashes during combat.',
    icon: '💨',
  },
  {
    id: 'kings_ransom',
    name: "King's Ransom",
    description: 'Amass 350+ gold coins in a single run.',
    icon: '💰',
  },
  {
    id: 'shrine_pilgrim',
    name: 'Shrine Pilgrim',
    description: 'Pray at 3 in-run mystery shrines in a single expedition.',
    icon: '⛩️',
  },
];

const DEFAULT_SAVE: PersistentSaveData = {
  gold: 0,
  lifetimeGold: 0,
  lifetimeKills: 0,
  highestSurvivalTime: 0,
  runsPlayed: 0,
  unlockedBiomes: ['verdant', 'scorched', 'haunted'],
  upgrades: {},
  achievements: {},
  sfxVolume: 0.7,
  musicVolume: 0.4,
  screenShake: true,
  showDamageNumbers: true,
};

export class StorageManager {
  private data: PersistentSaveData;

  constructor() {
    this.data = this.load();
  }

  public getData(): PersistentSaveData {
    return { ...this.data };
  }

  private load(): PersistentSaveData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_SAVE };
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SAVE, ...parsed };
    } catch {
      return { ...DEFAULT_SAVE };
    }
  }

  public save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Failed to save game data to localStorage', e);
    }
  }

  public getUpgradeRank(id: string): number {
    return this.data.upgrades[id] || 0;
  }

  public getUpgradeCost(upgrade: PermanentUpgrade): number {
    const rank = this.getUpgradeRank(upgrade.id);
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, rank));
  }

  public buyUpgrade(id: string): boolean {
    const upgrade = PERMANENT_UPGRADES.find((u) => u.id === id);
    if (!upgrade) return false;
    const currentRank = this.getUpgradeRank(id);
    if (currentRank >= upgrade.maxRank) return false;

    const cost = this.getUpgradeCost(upgrade);
    if (this.data.gold < cost) return false;

    this.data.gold -= cost;
    this.data.upgrades[id] = currentRank + 1;
    this.save();
    return true;
  }

  public refundAllUpgrades() {
    let refundTotal = 0;
    for (const upgrade of PERMANENT_UPGRADES) {
      const rank = this.getUpgradeRank(upgrade.id);
      for (let r = 0; r < rank; r++) {
        refundTotal += Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, r));
      }
    }
    this.data.gold += refundTotal;
    this.data.upgrades = {};
    this.save();
  }

  public calculatePlayerBaseStats(): PlayerStats {
    const base: PlayerStats = {
      maxHp: 100,
      currentHp: 100,
      hpRegen: 0,
      armor: 0,
      moveSpeed: 180,
      might: 1.0,
      area: 1.0,
      cooldown: 1.0,
      projectileSpeed: 1.0,
      projectileCount: 0,
      magnetRange: 75,
      greed: 1.0,
      growth: 1.0,
      luck: 1.0,
      revivals: 0,
      rerolls: 0,
    };

    // Apply permanent upgrades
    const mightRank = this.getUpgradeRank('might');
    base.might += mightRank * 0.05;

    const armorRank = this.getUpgradeRank('armor');
    base.armor += armorRank * 1;

    const hpRank = this.getUpgradeRank('max_hp');
    base.maxHp += hpRank * 15;
    base.currentHp = base.maxHp;

    const regenRank = this.getUpgradeRank('recovery');
    base.hpRegen += regenRank * 0.2;

    const cdRank = this.getUpgradeRank('cooldown');
    base.cooldown = Math.max(0.6, base.cooldown - cdRank * 0.04);

    const areaRank = this.getUpgradeRank('area');
    base.area += areaRank * 0.05;

    const speedRank = this.getUpgradeRank('speed');
    base.moveSpeed += speedRank * 9; // ~5%

    const magnetRank = this.getUpgradeRank('magnet');
    base.magnetRange += magnetRank * 15; // ~20%

    const growthRank = this.getUpgradeRank('growth');
    base.growth += growthRank * 0.1;

    const greedRank = this.getUpgradeRank('greed');
    base.greed += greedRank * 0.1;

    const rerollRank = this.getUpgradeRank('reroll');
    base.rerolls = rerollRank;

    const revivalRank = this.getUpgradeRank('revival');
    base.revivals = revivalRank;

    return base;
  }

  public isAchievementUnlocked(id: string): boolean {
    return !!this.data.achievements?.[id];
  }

  public checkAndUnlockAchievements(runStats: {
    kills: number;
    survivalTime: number;
    gold: number;
    dashes: number;
    shrines: number;
    evolvedWeaponCount: number;
    bossKilled: boolean;
  }): { id: string; name: string; description: string; icon: string; unlocked: boolean }[] {
    const newlyUnlocked: { id: string; name: string; description: string; icon: string; unlocked: boolean }[] = [];
    if (!this.data.achievements) this.data.achievements = {};

    const tryUnlock = (id: string, condition: boolean) => {
      if (condition && !this.data.achievements[id]) {
        this.data.achievements[id] = true;
        const entry = ACHIEVEMENTS_CATALOG.find((a) => a.id === id);
        if (entry) {
          newlyUnlocked.push({ ...entry, unlocked: true });
        }
      }
    };

    tryUnlock('first_blood', runStats.kills >= 100);
    tryUnlock('titan_slayer', runStats.bossKilled);
    tryUnlock('transcendence', runStats.evolvedWeaponCount > 0);
    tryUnlock('survivor', runStats.survivalTime >= 300);
    tryUnlock('endurance_legend', runStats.survivalTime >= 600);
    tryUnlock('acrobat', runStats.dashes >= 15);
    tryUnlock('kings_ransom', runStats.gold >= 350);
    tryUnlock('shrine_pilgrim', runStats.shrines >= 3);

    if (newlyUnlocked.length > 0) {
      this.save();
    }

    return newlyUnlocked;
  }

  public recordRun(results: RunResults) {
    this.data.gold += results.goldEarned;
    this.data.lifetimeGold += results.goldEarned;
    this.data.lifetimeKills += results.kills;
    this.data.runsPlayed += 1;
    if (results.survivalTime > this.data.highestSurvivalTime) {
      this.data.highestSurvivalTime = results.survivalTime;
    }
    this.save();
  }

  public updateSettings(settings: Partial<PersistentSaveData>) {
    this.data = { ...this.data, ...settings };
    this.save();
  }
}

export const storage = new StorageManager();
