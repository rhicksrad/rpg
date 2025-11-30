README.md

# rpg

Top-down NES-style action RPG sandbox: Zelda-style camera and movement with room to grow into a D&D-grade ruleset.

Right now the project includes:

- A bearded adventurer hero sprite that can walk and animate.
- A tile-based world with metadata for collision.
- A camera that scrolls over larger maps instead of a fixed screen.
- Data-driven maps for at least two areas:
  - Level 1: grassy overworld.
  - Level 2: castle/dungeon.
- An entity system that tracks the hero and will later handle NPCs, enemies, items, and projectiles.

The goal is to build a small, clean engine that can handle rich systems (stats, spells, items, quests) without turning into spaghetti.

---

## Stack

- TypeScript
- Vite
- pnpm
- Node 20+

---

## Getting started

From the repo root:

1. Activate Node 20

   - If you use `nvm`:

     ```bash
     nvm use
     ```

   - Otherwise make sure `node -v` reports a compatible Node 20.x.

2. Install dependencies

   ```bash
   pnpm install


Run the dev server

pnpm dev


Open the game

Visit the URL Vite prints (usually http://localhost:5173).

You should see a grassy map, a bearded adventurer in the middle, and the camera following as you move.

Build for production

pnpm run build


This is what CI runs in .github/workflows/ci.yml.

Controls

Movement: arrow keys or WASD.

The hero collides with blocking tiles (walls, water, etc.) and cannot walk through them.

The camera tracks the hero across the map with edge clamping.

As of steps 1–5, there is no combat yet; this is purely movement, collision, and navigation over data-driven maps.

Project layout (high level)

This is the intended layout; some files may be missing if they haven’t been implemented yet.

index.html

Root HTML for the game. Hosts the canvas and Vite entry.

src/main.ts

Entry point and top-level game loop.

Sets up the canvas and 2D context.

Loads assets and maps.

Creates the hero entity and initializes the entity system.

Each frame:

Reads input state.

Updates entities and camera.

Renders the tilemap and entities.

src/assets.ts

Centralized asset loader and sprite sheet metadata.

Exposes:

loadAssets() which returns hero + terrain + enemy sprite sheets.

Shared tile constants like TILE_SIZE.

src/renderTiles.ts

Utility functions for drawing tiles and tilemaps:

drawTile to render a single tile from a tileset.

drawTileMap to render an entire 2D map using tile indices.

Aware of the camera so only visible tiles are drawn.

src/hero.ts

Hero-specific state and behavior:

Position in tile + pixel space.

Direction, animation frame, movement speed.

Functions:

createHero(canvas) to initialize the hero in the world.

updateHero(hero, keys, dt, map) to move the hero with collision.

drawHero(ctx, hero, heroSpriteSheet, camera) to render the hero sprite.

src/entities/

Core entity model and registry (basic ECS or tagged objects).

Hero is one entity; enemies, NPCs, items, and projectiles will live here too.

Update and render loops iterate over entities instead of hardcoding behavior in main.ts.

src/maps/

Map definitions and metadata.

Each map provides:

width, height, and a tile index array.

Tile metadata references (e.g., which indices are blocking or hazardous).

Spawn points (hero start, exits, etc.).

Map loader responsible for switching between level 1 grass and level 2 castle.

src/camera.ts (if present)

Camera position and scrolling behavior.

Functions to follow the hero and clamp to map bounds.

src/style.css

Centers the canvas, sets background and scaling behavior.

Keeps the visuals pixel-friendly (image-rendering: pixelated).

.github/workflows/ci.yml

CI pipeline:

Checkout → pnpm setup → pnpm install → pnpm run build.

AGENTS.md

Describes the “agents” (roles) that work on this repo:

PLAN, ENGINE, GAMEPLAY, SYSTEMS, CONTENT, etc.

Good place to coordinate responsibilities between humans and tools.

Current implementation status (after steps 1–5)

Completed:

Tile metadata and collision:

Tiles know if they are walkable or blocking.

Hero movement checks collision before committing.

Tile-coordinate world model:

Hero and entities are positioned in tile space with pixel offsets.

Movement and collision are based on tile size, not magic numbers.

Camera and scrolling:

Camera follows the hero about the center of the screen.

Map can be larger than the viewport; camera clamps to map edges.

Data-driven maps:

At least one grassy “level 1” and one castle “level 2” map defined as data.

Level metadata feeds the renderer and collision system.

Entity system foundation:

Core structure for creating, updating, and rendering entities.

Hero is managed as an entity, and the system is ready for enemies/NPCs.

Next likely steps

Not implemented yet, but planned:

Enemies and NPCs as entities using the new system.

Melee combat and hit detection.

Items, inventory, and stats.

Quests, dialogue, and area transitions with requirements.

For more detail on long-term direction, see here:

Entity system

Introduce an entity registry (light ECS or tagged objects).

All dynamic things (hero, enemies, NPCs, projectiles, pickups) are entities with components/state.

Time-step and game loop refinement

Convert loop to fixed or semi-fixed timestep for predictable movement and combat.

Separate update(dt) and render() cleanly and run updates at consistent rate.

Basic NPCs and enemies

Add simple entities that idle or patrol on waypoints.

Ensure collision rules work for them too (no walking through walls).

Melee combat system

Add an attack action (button press).

Implement attack hitboxes, damage application, a short attack animation window, and hit flash.

Health, death, and respawn

Give entities HP and flags like isAlive.

Handle death (despawn enemy, drop loot, play animation) and player death/respawn to last checkpoint.

Pickups and item entities

Add item entities on the map (coins, hearts, potions, simple gear).

Define interaction radius; on touch or button, add to inventory and remove entity.

Inventory core

Implement inventory data model: slots, stackable vs unique, max stack, hotbar vs backpack.

Provide basic UI for viewing items and selecting equipped weapon.

Equipment system

Define equipment slots (weapon, armor, accessory, etc.).

Equipping items modifies hero stats (attack, defense, movement speed, etc.).

Player stat model

Introduce core attributes (e.g., STR, DEX, INT, VIT, LUCK) and secondary stats (HP, crit, dodge).

Make damage, accuracy, and other calculations depend on these stats plus equipment.

Experience and leveling

Add XP gains for kills/quests.

Level-ups increase stats and maybe grant talent points.

Use a configurable XP curve.

Status effects framework

Build a generic buff/debuff system (duration, stacks, periodic tick).

Examples: poison, regen, haste, slow, stun, armor buff.

Interaction and trigger system

Implement map triggers: pressure plates, region triggers, “use” targets.

Trigger actions: open doors, toggle tiles, start dialogue, teleport to another map.

Dialogue system

Add text boxes with portraits, choices, and simple branching.

Expose a scriptable dialogue data format linked to NPC entities and triggers.

Quest framework

Create a quest model: objectives, states, rewards, dependencies.

Hook quests into triggers and dialogue (accept/turn-in) and update on events (kill, collect, reach area).

HUD and in-game UI

Render HP, mana/stamina, XP bar, current quest snippet, and selected item.

Add a pause menu showing inventory, equipment, and character sheet.

Game state manager

Introduce explicit states: Title, Playing, Paused, Dialogue, Inventory, GameOver.

Route input and rendering through the active state to avoid spaghetti checks everywhere.

Advanced enemy AI

Add behavior patterns: patrol, chase, flee, ranged, caster.

Use simple state machines per enemy type; use tile-based pathing (A* or simple steering).

Skills and spells system

Implement active abilities with cost (mana, stamina, cooldown).

Separate data (skill definition) from execution (effect handlers): projectiles, AoE, buffs, teleports.

Damage types and resistances

Introduce elemental/physical types (slashing, fire, cold, poison, radiant, etc.).

Give entities resistance/vulnerability tables that scale incoming damage.

Loot tables and item rarity

Create per-enemy and per-container loot tables with weighted rolls.

Introduce item tiers/rarities with implicit stat ranges or affix systems.

Level transitions and progression structure

Implement doors/stairs connecting maps (L1 grass → L2 castle).

Add gating requirements: keys, story flags, minimum level, completed quests.

Save/load system

Serialize core state (map id, hero stats, quests, inventory, flags).

Provide save slots and quick-continue; ensure versioning so you can evolve data safely.

Audio layer

Integrate sound effects for steps, hits, UI, spells.

Add background music per area with basic mixing and volume controls.

Settings and keybinding

Add an options menu with remappable controls, audio sliders, and maybe difficulty toggles.

Persist these settings separately from save games.

Refactor and performance pass

Profile hot paths (update and render).

Tighten ECS/entity structures, reduce allocations, batch draws where possible, and clean up module boundaries.

Packaging, docs, and tooling

Create production build pipeline and versioning.

Add a short “modder/dev” README describing data formats and folder layout.

Optionally wrap in Tauri/Electron for desktop and tag a v0.1 “vertical slice” release.

That list is basically your roadmap from “toy walking sim” to “coherent action-RPG framework that can absorb D&D systems without collapsing.”
