# Agents

This repo is meant to be worked on by multiple “agents” (humans or tools).  
Each agent owns a slice of the game and avoids stepping on the others’ toes.

---

## PLAN_AGENT

- Owns the high-level roadmap and milestone definitions.
- Decides which big feature comes next and how deep to take it.
- Keeps a short, current checklist in this file or a separate `PLANS.md`.
- Ensures that changes to systems are additive and backwards compatible when possible.

---

## ENGINE_AGENT

- Owns build tooling and runtime skeleton:
  - Vite config, TypeScript config, GitHub Actions, Node/pnpm versions.
- Guards the folder structure and naming conventions.
- Keeps `pnpm run build` and CI green at all times.
- Coordinates breaking refactors (e.g., entity system changes, render loop changes).

---

## GAMEPLAY_AGENT

- Owns the feel of movement, combat, and moment-to-moment play.
- Works primarily in:
  - `src/main.ts` (bootstrap and loop)
  - `src/hero.ts` (player behavior)
  - `src/entities/*` (per-entity behavior)
- Responsibilities now that steps 1–5 are in place:
  - Tune movement speed, acceleration, and animation timing.
  - Ensure hero interacts correctly with collision, camera, and tile map.
  - Prototype new verbs (dash, charge attack, interact, etc.).

---

## SYSTEMS_AGENT

- Owns numerical systems and rules:
  - Stats, damage formulas, resistances, status effects, XP and level curves.
- Reads from:
  - The entity model (`src/entities/*`),
  - Tile metadata (`src/tiles/*` or `src/maps/*`),
  - Shared types in `src/core/*`.
- Writes small, testable functions (pure where possible) for:
  - Hit resolution,
  - Movement costs,
  - Environmental effects (spikes, lava, slow terrain).
- Ensures config is data-driven (TS data or JSON) instead of hard-coded in behaviors.

---

## CONTENT_AGENT

- Owns maps, encounters, NPCs, and progression pacing.
- Works mostly in:
  - `src/maps/` (level definitions and metadata),
  - Data defining which entities spawn where and when.
- Uses the existing systems rather than adding logic to content files.
- With steps 1–5 done:
  - Builds level-1 grass maps and early castle maps using the tile metadata.
  - Uses the entity system to drop enemies, chests, and environmental props.

---

## MAPS_AND_CAMERA_AGENT

(Subset of ENGINE + CONTENT responsibilities, but explicit because world layout matters.)

- Owns:
  - Tile metadata (walkable, blocking, hazardous, cost),
  - Camera behavior and scrolling rules,
  - Level transition hooks (doors, exits, spawn points).
- Ensures that:
  - The camera feels smooth and predictable.
  - Collision boundaries match visuals.
  - Large maps scroll cleanly without jitter or tearing.

---

## ASSETS_AGENT

- Manages art/audio assets and how they are wired into the engine.
- Responsible for:
  - Sprite sheet conventions (tile size, grid layout, naming).
  - Asset loading in `src/assets.ts` (hero, enemies, terrain, UI).
  - Keeping a simple “contract” between sprite layout and render helpers.
- Documents how to add a new sprite sheet or tileset.

---

## QA_AGENT

- Owns reproducible bug reports and smoke tests.
- Before merging any non-trivial change, verifies at least:
  - Game boots with `pnpm dev` and `pnpm run build`.
  - Hero loads with a visible sprite on a valid map.
  - Collision with walls behaves as expected (no walking through blocks, no getting stuck).
  - Camera tracks the hero correctly across map boundaries.
- Maintains a small checklist in this file or `QA.md` for manual testing.

---

## DOCS_AGENT

- Keeps `README.md`, `AGENTS.md`, and any architecture notes aligned with reality.
- Updates diagrams and text whenever the map/engine/entity architecture changes.
- Writes concise, practical docs aimed at future contributors and future-you.

---

## Working agreements

- Use `pnpm` as the package manager.
- Target Node 20+ (see `.nvmrc`).
- Prefer incremental, small PRs that keep the game playable at all times.
- Centralize rules in one place (systems modules + data) and reuse them.
- When you add a new subsystem (e.g., quests, dialogue), add a short section here
  describing which agent owns it and which files are involved.
- Keep entrypoints (like `src/main.ts`) lean: prefer extracting new helpers/modules
  instead of growing a single "main" file.
