# Asset Credits & Technical Specifications

## 1. Character & Entity Artwork
- **Player Character (Valkyrie Maiden)**:
  - Source Reference: Supplied multimodal character sprite sheet (blonde sword maiden with ponytail, kite shield with horned crest, pauldron, arming sword, and scabbard).
  - Procedural Rasterizer: Built in `src/game/sprites.ts`.
  - Animation States: 4-frame walk cycle, idle breathing, attack forward slash extension, and defeat monument stance.
  - License: Custom procedural implementation conforming strictly to supplied reference artwork.

- **Enemy Entities (9 Core Archetypes)**:
  - Source Reference: Supplied 3x3 reference sprite sheet (Green Snake, Blue Slime, Carnivorous Chomper Plant, Wild Boar, Green Frog, Spotted Mushroom, Grim Wraith / Reaper, Infernal Fire Imp, Purple Armored Snail).
  - Procedural Rasterizer: Multi-tone shaded offscreen canvas sprite generator in `src/game/sprites.ts`.
  - Animation: 2-frame walk/action cycle with squash-and-stretch, directional flipping, elite golden runic coronas, and boss coronas.

## 2. Environments & Biomes
- **Verdant Meadows / Whispering Woods**:
  - Procedural organic terrain with dandelion/poppy wildflowers, ancient mossy flagstone pathways, woodland oak shrines, and wooden destructible barrels.
- **Scorched Crypts / Obsidian Ruins**:
  - Basalt slabs, glowing magma fissures with dynamic point light emission, basalt monoliths with carved runes, and burning iron braziers.
- **Haunted Mire / Cursed Barrows**:
  - Swamp pools, bioluminescent purple mushrooms with light radiance, weathered granite dolmens, and ancient tombstones.

## 3. Audio & Music Engine
- **Synthesizer Engine**:
  - Web Audio API pure zero-latency procedural audio engine in `src/game/sound.ts`.
  - Sound Effects: Slashes, magic bursts, explosions, lightning strikes, gem collection arpeggios, coin pickups, player damage grunts, boss arrival horns, chest fanfare, and weapon evolution chords.
  - Polyphony Control: Sound throttling (<45ms window) prevents audio clipping in 400+ active enemy encounters.
  - Music Sequencer: Multi-voice procedural synthesizer with dynamic intensity scaling (chords, bassline, and lead arpeggios).
  - License: Original procedural synthesizer code (MIT License / Apache 2.0).

## 4. Typography & Icons
- **Fonts**:
  - `Cinzel`: Google Fonts (SIL Open Font License 1.1)
  - `Outfit`: Google Fonts (SIL Open Font License 1.1)
- **Icons**:
  - `lucide-react`: ISC License
