# Implementation Plan — Combat Depth & Feature Expansion

This plan outlines the implementation of the selected combat systems and polish features for Valkyrie Survivors without disrupting existing mechanics, meta-progression, or performance.

---

## 1. Active Dash & Dodge Roll (I-Frames)
- **Mechanics**:
  - Activated via `Space` / `Shift` on keyboard, `B` / `RB` on gamepad, or an on-screen touch button.
  - Grants a high-velocity dash vector for `0.22s` with complete invulnerability (`invincibleTimer` set during dash).
  - Displays trailing translucent afterimage pixel sprites behind the player.
  - Base cooldown of `2.8s`, with a circular HUD cooldown indicator next to the player health bar.
  - Synergizes with permanent speed and cooldown meta-upgrades.

---

## 2. Charged Ultimate Skill ("Valkyrie Wrath")
- **Mechanics**:
  - Ultimate energy meter charged by collecting XP gems and defeating foes (100 energy cap).
  - Activated via `Q` / `F` on keyboard, `Y` / `LB` on gamepad, or a dedicated touch button when gauge is full.
  - **Effect**: Full-screen golden sword rain nova dealing massive holy damage to all on-screen enemies, clearing projectiles, granting brief hit-stop juice, and pushing swarms backward.
  - Distinctive visual aura: Player emits radiant golden wing particles while the gauge is at 100%.

---

## 3. In-Run Mystery Shrines (Risk-Reward Curses)
- **Mechanics**:
  - Procedurally spawned throughout map chunks (1 shrine per 3-4 chunks).
  - Approach within range to reveal interaction prompt: `"Press E / (X) to Pray"`.
  - **Shrine Archetypes**:
    - **Shrine of Blood**: Sacrifices 20% max HP for +25% Might for the remainder of the run.
    - **Shrine of Greed**: Instantly summons an enraged elite enemy wave in exchange for +150 Gold coins.
    - **Shrine of Haste**: Sacrifices -1 Armor in exchange for +20% Movement Speed and -25% Dash cooldown.
    - **Shrine of the Oracle**: 50% chance to drop a Treasure Chest; 50% chance to trigger a lightning storm hazard.
  - Floating status notification when activated.

---

## 4. Minimap Radar System
- **HUD Integration**:
  - Positioned in the upper-right corner with a stylish pixel-art border.
  - Tracks key world entities relative to the player:
    - Glowing red skull icon for active Bosses and Elite enemies.
    - Golden chest icon for uncollected Treasure Chests.
    - Azure shrine beacon for unactivated mystery shrines.
    - Player direction indicator.
  - Performant radius polling (`1500px` range).

---

## 5. Enhanced Weapon Synergy Visual Combos
- **Mechanics**:
  - Detects complementary weapon pairs in inventory and activates special visual synergy effects on hit:
    - **Fire Wand + Lightning Ring = Plasma Overload**: Critical hits trigger a purple plasma arc explosion.
    - **Sword + Orbit Shield = Shield Bash Shockwave**: Slashes deflect nearby projectiles and pulse an outward kinetic ring.
    - **Holy Water + Radiant Aura = Consecrated Ground**: Holy pools expand and heal 1 HP per tick inside their radius.

---

## 6. End-of-Run Achievement & Unlock Badges
- **System**:
  - Saved persistently to `localStorage` across all runs.
  - **Badges**:
    1. *First Blood*: Slay 100 enemies.
    2. *Titan Slayer*: Defeat a Boss encounter.
    3. *Transcendence*: Complete any Weapon Evolution.
    4. *Survivor*: Reach 5 minutes of survival time.
    5. *Endurance Legend*: Reach 10 minutes of survival time.
    6. *Acrobat*: Execute 15 i-frame dashes during combat.
    7. *King's Ransom*: Collect 500 gold coins in a single run.
    8. *Shrine Pilgrim*: Pray at 3 mystery shrines in a single run.
  - Visible on the Game Over screen and accessible via a new "Achievements" button on the Title Screen.

---

## Proposed Changes by Module

1. `src/game/types.ts`:
   - Add Dash & Ultimate stats to `Player` interface.
   - Define `ShrineObject`, `AchievementDef`, and `MinimapEntity` types.
2. `src/game/engine.ts`:
   - Implement Dash execution, afterimage rendering, and i-frame logic.
   - Implement Ultimate meter accumulation, trigger, and screen-wipe VFX.
   - Implement Shrine interaction and radar entity tracking.
3. `src/game/sprites.ts`:
   - Add Shrine sprites (Blood, Greed, Haste, Oracle) and afterimage canvas buffers.
4. `src/components/HUD.tsx`:
   - Add Minimap Radar canvas, Dash cooldown ring, and Ultimate charge bar.
5. `src/components/AchievementsModal.tsx`:
   - Create interactive badges viewer modal with progress pips.
6. `src/components/GameOverModal.tsx` & `src/App.tsx`:
   - Wire achievements, shrine interaction keys (`E`), Dash (`Space`/`Shift`), and Ultimate (`Q`/`F`).

---

## Verification Plan
1. Test keyboard (`Space` for Dash, `Q` for Ultimate, `E` for Shrine) and gamepad mappings.
2. Verify Dash gives complete invulnerability when passing directly through enemies.
3. Confirm Ultimate charges correctly and obliterates normal swarm enemies with screen shake and SFX.
4. Test Shrines on each biome and verify risk-reward stat modifications.
5. Verify Minimap radar accurately plots distant chests, shrines, and bosses.
6. Compile and lint via `compile_applet` and `lint_applet`.
