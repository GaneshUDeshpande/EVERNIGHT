import { WeaponDef, PassiveDef, WeaponId, PassiveId, Player, ActiveWeapon, ActivePassive } from './types';

export const WEAPON_REGISTRY: Record<WeaponId, WeaponDef> = {
  sword: {
    id: 'sword',
    name: 'Silver Broadsword',
    description: 'Slashes swiftly in front of player with high knockback.',
    icon: '⚔️',
    evolutionPair: 'hollow_heart',
    baseCooldown: 1.1,
    baseDamage: 24,
    baseCount: 1,
    baseArea: 1.0,
    baseSpeed: 1.0,
    basePierce: 999, // slashes all enemies in arc
    baseDuration: 0.25,
    maxLevel: 8,
    levelDescriptions: [
      'Initial slash attack',
      '+10 Damage, +15% Area',
      '-0.15s Cooldown, +1 Slash count',
      '+12 Damage, +20% Knockback',
      '+1 Slash count, +15% Area',
      '-0.2s Cooldown, +15 Damage',
      '+1 Slash count',
      '+20 Damage, +25% Area',
    ],
  },

  magic_wand: {
    id: 'magic_wand',
    name: 'Arcane Wand',
    description: 'Fires tracking magic missiles at the closest enemies.',
    icon: '🔮',
    evolutionPair: 'cooldown_tome',
    baseCooldown: 0.9,
    baseDamage: 18,
    baseCount: 1,
    baseArea: 1.0,
    baseSpeed: 380,
    basePierce: 1,
    baseDuration: 2.0,
    maxLevel: 8,
    levelDescriptions: [
      'Fires 1 tracking bolt at closest enemy',
      '+1 Missile count',
      '-0.15s Cooldown, +5 Damage',
      '+1 Missile count',
      '+8 Damage, +20% Projectile Speed',
      '+1 Pierce, +1 Missile count',
      '-0.15s Cooldown',
      '+1 Missile count, +12 Damage',
    ],
  },

  orbit_shield: {
    id: 'orbit_shield',
    name: 'Spinning Bucklers',
    description: 'Shields revolve around you, blocking and bruising enemies.',
    icon: '🛡️',
    evolutionPair: 'armor',
    baseCooldown: 2.5,
    baseDamage: 15,
    baseCount: 1,
    baseArea: 1.0,
    baseSpeed: 2.2, // rotation rad/s
    basePierce: 999,
    baseDuration: 4.5,
    maxLevel: 8,
    levelDescriptions: [
      '1 orbiting shield deals continuous contact damage',
      '+1 Orbiting shield',
      '+6 Damage, +15% Rotation speed',
      '+1 Orbiting shield',
      '+8 Damage, +20% Orbit radius',
      '+1 Orbiting shield',
      '+10 Damage, -0.5s Cooldown',
      '+1 Orbiting shield, +15 Damage',
    ],
  },

  fire_wand: {
    id: 'fire_wand',
    name: 'Molten Fire Wand',
    description: 'Launches fiery projectiles that detonate on impact.',
    icon: '🔥',
    evolutionPair: 'spinach',
    baseCooldown: 1.8,
    baseDamage: 38,
    baseCount: 1,
    baseArea: 1.0,
    baseSpeed: 320,
    basePierce: 1,
    baseDuration: 2.5,
    maxLevel: 8,
    levelDescriptions: [
      'Fires explosive fireballs with splash damage',
      '+1 Fireball, +10 Damage',
      '+25% Explosion Area',
      '+1 Fireball, -0.2s Cooldown',
      '+15 Damage, +20% Speed',
      '+1 Fireball, +25% Area',
      '+20 Damage, -0.3s Cooldown',
      '+1 Fireball, +30 Damage',
    ],
  },

  lightning_ring: {
    id: 'lightning_ring',
    name: 'Thunder Ring',
    description: 'Strikes random targets with high-voltage lightning bolts.',
    icon: '⚡',
    evolutionPair: 'duplicator',
    baseCooldown: 2.4,
    baseDamage: 45,
    baseCount: 2,
    baseArea: 1.0,
    baseSpeed: 0,
    basePierce: 1,
    baseDuration: 0.3,
    maxLevel: 8,
    levelDescriptions: [
      'Calls down 2 lightning strikes on enemies',
      '+1 Lightning bolt, +10 Damage',
      '+20% Impact Area',
      '+1 Lightning bolt, -0.3s Cooldown',
      '+15 Damage',
      '+1 Lightning bolt, +20% Area',
      '-0.3s Cooldown, +15 Damage',
      '+1 Lightning bolt, +25 Damage',
    ],
  },

  holy_water: {
    id: 'holy_water',
    name: 'Holy Water',
    description: 'Throws flasks that break into persistent sanctified flames.',
    icon: '💧',
    evolutionPair: 'attractorb',
    baseCooldown: 2.8,
    baseDamage: 12,
    baseCount: 1,
    baseArea: 1.0,
    baseSpeed: 200,
    basePierce: 999,
    baseDuration: 3.2,
    maxLevel: 8,
    levelDescriptions: [
      'Lobs holy water forming damaging ground zones',
      '+1 Holy water bottle, +15% Zone duration',
      '+20% Puddle area, +4 Damage per tick',
      '+1 Holy water bottle',
      '+20% Zone duration, -0.3s Cooldown',
      '+1 Holy water bottle, +25% Area',
      '+6 Damage per tick, +1 Holy bottle',
      '+25% Area, +8 Damage per tick',
    ],
  },

  throwing_daggers: {
    id: 'throwing_daggers',
    name: 'Throwing Daggers',
    description: 'Hurls swift steel daggers straight in moving direction.',
    icon: '🗡️',
    evolutionPair: 'bracer',
    baseCooldown: 1.0,
    baseDamage: 16,
    baseCount: 2,
    baseArea: 1.0,
    baseSpeed: 520,
    basePierce: 2,
    baseDuration: 1.5,
    maxLevel: 8,
    levelDescriptions: [
      'Fires 2 piercing daggers in direction faced',
      '+1 Dagger count, +4 Damage',
      '+1 Pierce, +25% Flight Speed',
      '+1 Dagger count, -0.15s Cooldown',
      '+6 Damage, +1 Pierce',
      '+1 Dagger count',
      '-0.15s Cooldown, +8 Damage',
      '+2 Daggers, +10 Damage',
    ],
  },

  radiant_aura: {
    id: 'radiant_aura',
    name: 'Radiant Aura',
    description: 'Emanates a holy damaging ring that knocks back weak foes.',
    icon: '☀️',
    evolutionPair: 'pummarola',
    baseCooldown: 0.8,
    baseDamage: 9,
    baseCount: 1,
    baseArea: 1.0,
    baseSpeed: 0,
    basePierce: 999,
    baseDuration: 0.4,
    maxLevel: 8,
    levelDescriptions: [
      'Emits periodic pulses damaging all adjacent enemies',
      '+20% Aura radius, +3 Damage',
      '-0.1s Cooldown, +20% Knockback',
      '+25% Aura radius, +4 Damage',
      '-0.1s Cooldown, +4 Damage',
      '+25% Aura radius',
      '-0.1s Cooldown, +5 Damage',
      '+30% Aura radius, +8 Damage',
    ],
  },

  // --- EVOLUTIONS ---
  excalibur: {
    id: 'excalibur',
    name: 'Excalibur',
    description: 'Holy 360° light blade nova with high damage and lifesteal!',
    icon: '👑',
    isEvolved: true,
    evolvesFrom: 'sword',
    baseCooldown: 0.65,
    baseDamage: 85,
    baseCount: 2,
    baseArea: 1.6,
    baseSpeed: 1.0,
    basePierce: 999,
    baseDuration: 0.35,
    maxLevel: 1,
    levelDescriptions: ['Ultimate light blade storm with life restoration!'],
  },

  holy_blast: {
    id: 'holy_blast',
    name: 'Holy Wand',
    description: 'Unending stream of piercing celestial energy with no delay!',
    icon: '✨',
    isEvolved: true,
    evolvesFrom: 'magic_wand',
    baseCooldown: 0.22,
    baseDamage: 42,
    baseCount: 2,
    baseArea: 1.3,
    baseSpeed: 620,
    basePierce: 3,
    baseDuration: 2.0,
    maxLevel: 1,
    levelDescriptions: ['Relentless rapid-fire barrage of celestial blasts!'],
  },

  valkyrie_aegis: {
    id: 'valkyrie_aegis',
    name: 'Aegis of the Valkyrie',
    description: 'Towering spectral shields create explosive barrier pulses!',
    icon: '🛡️✨',
    isEvolved: true,
    evolvesFrom: 'orbit_shield',
    baseCooldown: 1.2,
    baseDamage: 65,
    baseCount: 6,
    baseArea: 1.5,
    baseSpeed: 3.5,
    basePierce: 999,
    baseDuration: 6.0,
    maxLevel: 1,
    levelDescriptions: ['Impenetrable vanguard defense with pulsing shockwaves!'],
  },

  hellfire: {
    id: 'hellfire',
    name: 'Hellfire Cataclysm',
    description: 'Massive piercing meteors incinerate entire waves of fiends!',
    icon: '☄️',
    isEvolved: true,
    evolvesFrom: 'fire_wand',
    baseCooldown: 1.1,
    baseDamage: 110,
    baseCount: 3,
    baseArea: 1.7,
    baseSpeed: 450,
    basePierce: 999,
    baseDuration: 3.0,
    maxLevel: 1,
    levelDescriptions: ['Catastrophic meteor barrage piercing all enemies!'],
  },

  thunder_loop: {
    id: 'thunder_loop',
    name: 'Thunder Loop',
    description: 'Double lightning storms arc through enemies in chain shocks!',
    icon: '🌩️',
    isEvolved: true,
    evolvesFrom: 'lightning_ring',
    baseCooldown: 1.4,
    baseDamage: 90,
    baseCount: 6,
    baseArea: 1.4,
    baseSpeed: 0,
    basePierce: 1,
    baseDuration: 0.35,
    maxLevel: 1,
    levelDescriptions: ['Strikes twice as many targets with chain lightning!'],
  },

  la_borra: {
    id: 'la_borra',
    name: 'La Borra',
    description: 'Sanctified zones magnetically follow you and expand endlessly!',
    icon: '🌊',
    isEvolved: true,
    evolvesFrom: 'holy_water',
    baseCooldown: 1.8,
    baseDamage: 32,
    baseCount: 4,
    baseArea: 1.8,
    baseSpeed: 150,
    basePierce: 999,
    baseDuration: 5.0,
    maxLevel: 1,
    levelDescriptions: ['Consecrated flame clouds drift towards you as you move!'],
  },

  thousand_blades: {
    id: 'thousand_blades',
    name: 'Thousand Blades',
    description: 'Continuous laser-fast wall of piercing blades!',
    icon: '⚔️⚡',
    isEvolved: true,
    evolvesFrom: 'throwing_daggers',
    baseCooldown: 0.15,
    baseDamage: 35,
    baseCount: 3,
    baseArea: 1.2,
    baseSpeed: 700,
    basePierce: 6,
    baseDuration: 1.5,
    maxLevel: 1,
    levelDescriptions: ['Infinite stream of hyper-velocity razor blades!'],
  },

  soul_eater: {
    id: 'soul_eater',
    name: 'Soul Eater',
    description: 'Black hole aura drains enemy souls, healing you and growing!',
    icon: '🌌',
    isEvolved: true,
    evolvesFrom: 'radiant_aura',
    baseCooldown: 0.5,
    baseDamage: 26,
    baseCount: 1,
    baseArea: 1.8,
    baseSpeed: 0,
    basePierce: 999,
    baseDuration: 0.45,
    maxLevel: 1,
    levelDescriptions: ['Massive vortex aura with life-drain and vacuum!'],
  },
};

export const PASSIVE_REGISTRY: Record<PassiveId, PassiveDef> = {
  spinach: {
    id: 'spinach',
    name: 'Spinach',
    description: 'Raises weapon damage by 10% per level.',
    icon: '🥬',
    maxLevel: 5,
    levelDescriptions: [
      '+10% Damage',
      '+10% Damage (Total +20%)',
      '+10% Damage (Total +30%)',
      '+10% Damage (Total +40%)',
      '+10% Damage (Total +50%)',
    ],
    statBonus: (lvl) => ({ might: 1.0 + lvl * 0.1 }),
  },

  armor: {
    id: 'armor',
    name: 'Steel Cuirass',
    description: 'Reduces incoming enemy damage by 1 per level.',
    icon: '🛡️',
    maxLevel: 5,
    levelDescriptions: [
      '+1 Armor',
      '+1 Armor (Total +2)',
      '+1 Armor (Total +3)',
      '+1 Armor (Total +4)',
      '+1 Armor (Total +5)',
    ],
    statBonus: (lvl) => ({ armor: lvl }),
  },

  hollow_heart: {
    id: 'hollow_heart',
    name: 'Hollow Heart',
    description: 'Expands maximum health by 20% per level.',
    icon: '🖤',
    maxLevel: 5,
    levelDescriptions: [
      '+20% Max Health',
      '+20% Max Health (Total +40%)',
      '+20% Max Health (Total +60%)',
      '+20% Max Health (Total +80%)',
      '+20% Max Health (Total +100%)',
    ],
    statBonus: (lvl) => ({ maxHp: 100 * (1 + lvl * 0.2) }),
  },

  cooldown_tome: {
    id: 'cooldown_tome',
    name: 'Empty Tome',
    description: 'Reduces weapon attack cooldown by 8% per level.',
    icon: '📖',
    maxLevel: 5,
    levelDescriptions: [
      '-8% Cooldown',
      '-8% Cooldown (Total -16%)',
      '-8% Cooldown (Total -24%)',
      '-8% Cooldown (Total -32%)',
      '-8% Cooldown (Total -40%)',
    ],
    statBonus: (lvl) => ({ cooldown: Math.max(0.4, 1.0 - lvl * 0.08) }),
  },

  bracer: {
    id: 'bracer',
    name: 'Bracer of Velocity',
    description: 'Increases projectile flight speed by 15% per level.',
    icon: '🧤',
    maxLevel: 5,
    levelDescriptions: [
      '+15% Projectile Speed',
      '+15% Projectile Speed (Total +30%)',
      '+15% Projectile Speed (Total +45%)',
      '+15% Projectile Speed (Total +60%)',
      '+15% Projectile Speed (Total +75%)',
    ],
    statBonus: (lvl) => ({ projectileSpeed: 1.0 + lvl * 0.15 }),
  },

  duplicator: {
    id: 'duplicator',
    name: 'Duplicator',
    description: 'Weapons fire +1 extra projectile per level.',
    icon: '💍',
    maxLevel: 5,
    levelDescriptions: [
      '+1 Projectile count',
      '+1 Projectile count (Total +2)',
      '+1 Projectile count (Total +3)',
      '+1 Projectile count (Total +4)',
      '+1 Projectile count (Total +5)',
    ],
    statBonus: (lvl) => ({ projectileCount: lvl }),
  },

  attractorb: {
    id: 'attractorb',
    name: 'Attractorb',
    description: 'Increases pickup magnet range by 30% per level.',
    icon: '🔮',
    maxLevel: 5,
    levelDescriptions: [
      '+30% Magnet Range',
      '+30% Magnet Range (Total +60%)',
      '+30% Magnet Range (Total +90%)',
      '+30% Magnet Range (Total +120%)',
      '+30% Magnet Range (Total +150%)',
    ],
    statBonus: (lvl) => ({ magnetRange: 75 * (1 + lvl * 0.3) }),
  },

  pummarola: {
    id: 'pummarola',
    name: 'Pummarola',
    description: 'Regenerates 0.5 HP per second per level.',
    icon: '🧄',
    maxLevel: 5,
    levelDescriptions: [
      '+0.5 HP/s Recovery',
      '+0.5 HP/s (Total +1.0 HP/s)',
      '+0.5 HP/s (Total +1.5 HP/s)',
      '+0.5 HP/s (Total +2.0 HP/s)',
      '+0.5 HP/s (Total +2.5 HP/s)',
    ],
    statBonus: (lvl) => ({ hpRegen: lvl * 0.5 }),
  },
};

export interface UpgradeChoice {
  type: 'weapon_new' | 'weapon_upgrade' | 'passive_new' | 'passive_upgrade' | 'gold_bag';
  id: string;
  name: string;
  description: string;
  icon: string;
  nextLevel: number;
  maxLevel: number;
  isEvolutionCandidate?: boolean;
}

export function generateUpgradeChoices(player: Player): UpgradeChoice[] {
  const choices: UpgradeChoice[] = [];
  const MAX_WEAPON_SLOTS = 6;
  const MAX_PASSIVE_SLOTS = 6;

  // 1. Check existing weapons for upgrades
  for (const aw of player.weapons) {
    const def = WEAPON_REGISTRY[aw.id];
    if (aw.level < def.maxLevel) {
      choices.push({
        type: 'weapon_upgrade',
        id: aw.id,
        name: def.name,
        description: def.levelDescriptions[aw.level] || 'Empower weapon properties.',
        icon: def.icon,
        nextLevel: aw.level + 1,
        maxLevel: def.maxLevel,
        isEvolutionCandidate: aw.level + 1 === def.maxLevel,
      });
    }
  }

  // 2. Check existing passives for upgrades
  for (const ap of player.passives) {
    const def = PASSIVE_REGISTRY[ap.id];
    if (ap.level < def.maxLevel) {
      choices.push({
        type: 'passive_upgrade',
        id: ap.id,
        name: def.name,
        description: def.levelDescriptions[ap.level] || 'Increase passive attribute.',
        icon: def.icon,
        nextLevel: ap.level + 1,
        maxLevel: def.maxLevel,
      });
    }
  }

  // 3. New weapons if under limit
  if (player.weapons.length < MAX_WEAPON_SLOTS) {
    const ownedIds = new Set(player.weapons.map((w) => w.id));
    const baseWeapons: WeaponId[] = [
      'sword',
      'magic_wand',
      'orbit_shield',
      'fire_wand',
      'lightning_ring',
      'holy_water',
      'throwing_daggers',
      'radiant_aura',
    ];
    for (const wid of baseWeapons) {
      if (!ownedIds.has(wid)) {
        const def = WEAPON_REGISTRY[wid];
        choices.push({
          type: 'weapon_new',
          id: wid,
          name: def.name,
          description: def.description,
          icon: def.icon,
          nextLevel: 1,
          maxLevel: def.maxLevel,
        });
      }
    }
  }

  // 4. New passives if under limit
  if (player.passives.length < MAX_PASSIVE_SLOTS) {
    const ownedPassives = new Set(player.passives.map((p) => p.id));
    const allPassives: PassiveId[] = [
      'spinach',
      'armor',
      'hollow_heart',
      'cooldown_tome',
      'bracer',
      'duplicator',
      'attractorb',
      'pummarola',
    ];
    for (const pid of allPassives) {
      if (!ownedPassives.has(pid)) {
        const def = PASSIVE_REGISTRY[pid];
        choices.push({
          type: 'passive_new',
          id: pid,
          name: def.name,
          description: def.description,
          icon: def.icon,
          nextLevel: 1,
          maxLevel: def.maxLevel,
        });
      }
    }
  }

  // If pool has items, shuffle and pick up to 3 (or 4 with luck)
  if (choices.length > 0) {
    const shuffled = choices.sort(() => Math.random() - 0.5);
    const count = Math.min(shuffled.length, 3);
    return shuffled.slice(0, count);
  }

  // Fallback: Rich Coin Bag
  return [
    {
      type: 'gold_bag',
      id: 'gold_bag',
      name: 'Pouch of Gold',
      description: 'Awards +100 gold coins instantly.',
      icon: '💰',
      nextLevel: 1,
      maxLevel: 1,
    },
  ];
}

/**
 * Checks if player can evolve any weapon upon opening a chest.
 * Requires: Weapon at Max Level (Lv 8) AND matching passive in inventory.
 */
export function checkAvailableEvolution(player: Player): {
  baseWeaponId: WeaponId;
  evolvedWeaponId: WeaponId;
} | null {
  const passiveIds = new Set(player.passives.map((p) => p.id));

  const evolutionMap: Record<WeaponId, { pair: PassiveId; evolved: WeaponId }> = {
    sword: { pair: 'hollow_heart', evolved: 'excalibur' },
    magic_wand: { pair: 'cooldown_tome', evolved: 'holy_blast' },
    orbit_shield: { pair: 'armor', evolved: 'valkyrie_aegis' },
    fire_wand: { pair: 'spinach', evolved: 'hellfire' },
    lightning_ring: { pair: 'duplicator', evolved: 'thunder_loop' },
    holy_water: { pair: 'attractorb', evolved: 'la_borra' },
    throwing_daggers: { pair: 'bracer', evolved: 'thousand_blades' },
    radiant_aura: { pair: 'pummarola', evolved: 'soul_eater' },
    excalibur: { pair: 'hollow_heart', evolved: 'excalibur' },
    holy_blast: { pair: 'cooldown_tome', evolved: 'holy_blast' },
    valkyrie_aegis: { pair: 'armor', evolved: 'valkyrie_aegis' },
    hellfire: { pair: 'spinach', evolved: 'hellfire' },
    thunder_loop: { pair: 'duplicator', evolved: 'thunder_loop' },
    la_borra: { pair: 'attractorb', evolved: 'la_borra' },
    thousand_blades: { pair: 'bracer', evolved: 'thousand_blades' },
    soul_eater: { pair: 'pummarola', evolved: 'soul_eater' },
  };

  for (const w of player.weapons) {
    const def = WEAPON_REGISTRY[w.id];
    if (w.level >= def.maxLevel && !def.isEvolved) {
      const evo = evolutionMap[w.id];
      if (evo && passiveIds.has(evo.pair)) {
        return {
          baseWeaponId: w.id,
          evolvedWeaponId: evo.evolved,
        };
      }
    }
  }

  return null;
}
