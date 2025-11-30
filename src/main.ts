import './style.css';
import { Assets, TILE_SIZE, loadAssets } from './assets';
import { initializeCanvas, resizeCanvasToViewport } from './canvas';
import { ControlState, setupControls } from './controls';
import { HeroState, createHero, drawHero, getHeroPixelPosition, respawnHero, updateHero } from './hero';
import { Entity, EntityRegistry, EntityWithComponent, createEntityRegistry } from './entities';
import { InteractTarget, getInteractionTarget, interact } from './interactions';
import { DEFAULT_LEVEL_ID, LEVELS, LEVELS_BY_ID, LevelData, LevelLayer } from './levels';
import { Camera, drawTileLayers } from './renderTiles';
import { createLevelLoader, tilesToGrid } from './levelLoader';
import { AgentState, createAgent, drawAgents, updateAgents } from './agents';
import { createItemEntity, ItemSpawn, pickupNearbyItems } from './items';
import { createHud, updateHud } from './hud';
import { queueHeroAttack, updateCombat } from './combat';
import { createGameState, toggleInventory, togglePause } from './gameState';
import { QUESTS, createQuestOverlay } from './quests';
import { applyDamage } from './stats';
import { getTileMetadata } from './tiles';

const { canvas, ctx } = initializeCanvas('game-canvas');
const controls: ControlState = setupControls();

async function start() {
    const assets: Assets = await loadAssets();
    const gameState = createGameState();
    const hud = createHud();
    const questOverlay = createQuestOverlay(QUESTS, () => {
      gameState.mode = 'playing';
    });
    let currentLevel: LevelData = LEVELS_BY_ID[DEFAULT_LEVEL_ID];
    let layers = resolveLevelLayers(currentLevel);
    let map = composeCollisionMap(layers, currentLevel.width, currentLevel.height);
    let renderLayers = buildRenderLayers(layers, assets, currentLevel.width, currentLevel.height);
    let explored = createExploredGrid(currentLevel.width, currentLevel.height);
    let hero = createHero(map, assets.hero);
    revealExplored(explored, hero, 9, 4);
    let agents: AgentState[] = createLevelAgents(currentLevel, assets);
    attachQuestGiverInteraction(agents, gameState, questOverlay);
    let itemEntities: Entity[] = createLevelItems(currentLevel, assets);
    let entityRegistry: EntityRegistry = createEntityRegistry([
      hero.entity,
      ...agents.map((agent) => agent.entity),
      ...itemEntities
    ]);
    let hazardTimers: Record<string, number> = {};
    const camera: Camera = {
      x: 0,
      y: 0,
      width: canvas.width,
      height: canvas.height
    };

    resizeCanvasToViewport(canvas, camera, map);
    window.addEventListener('resize', () => resizeCanvasToViewport(canvas, camera, map));

    const { container: loaderContainer, select: loaderSelect } = createLevelLoader(
      LEVELS,
      (levelId) => loadLevel(levelId),
      () => {
        const nextId = currentLevel.nextLevelId ?? DEFAULT_LEVEL_ID;
        loadLevel(nextId);
      }
    );

    const app = document.getElementById('app');
    if (app && app.firstChild) {
      app.insertBefore(loaderContainer, app.firstChild);
    } else if (app) {
      app.appendChild(loaderContainer);
    }

    if (app) {
      app.appendChild(hud.container);
      app.appendChild(questOverlay.container);
    }

    loaderSelect.value = currentLevel.id;

    function loadLevel(levelId: string) {
      const nextLevel = LEVELS_BY_ID[levelId] ?? LEVELS_BY_ID[DEFAULT_LEVEL_ID];
      currentLevel = nextLevel;
      layers = resolveLevelLayers(currentLevel);
      map = composeCollisionMap(layers, currentLevel.width, currentLevel.height);
      renderLayers = buildRenderLayers(layers, assets, currentLevel.width, currentLevel.height);
      explored = createExploredGrid(currentLevel.width, currentLevel.height);
      hero = createHero(map, assets.hero);
      agents = createLevelAgents(currentLevel, assets);
      attachQuestGiverInteraction(agents, gameState, questOverlay);
      itemEntities = createLevelItems(currentLevel, assets);
      entityRegistry = createEntityRegistry([hero.entity, ...agents.map((agent) => agent.entity), ...itemEntities]);
      hazardTimers = {};
      camera.x = 0;
      camera.y = 0;
      resizeCanvasToViewport(canvas, camera, map);
      loaderSelect.value = currentLevel.id;
    }

    const FIXED_TIME_STEP_MS = 1000 / 60;
    const MAX_STEPS_PER_FRAME = 5;
    const MAX_ACCUMULATED_MS = 250;
    let accumulator = 0;
    let lastTime = performance.now();

    function update(deltaMs: number) {
      if (controls.consumePauseToggle()) togglePause(gameState);
      if (controls.consumeInventoryToggle()) toggleInventory(gameState);

      if (controls.consumeAttackRequest() && gameState.mode === 'playing') {
        queueHeroAttack(hero);
      }

      if (controls.consumeInteractRequest() || controls.pollGamepadInteract()) {
        if (gameState.mode === 'dialogue') {
          questOverlay.close();
          gameState.mode = 'playing';
          return;
        }
        const target: InteractTarget | null = getInteractionTarget(hero, map, entityRegistry);
        interact(target, hero);
      }

      if (gameState.mode !== 'playing' && gameState.mode !== 'inventory') {
        updateHud(hud, hero);
        return;
      }

      const collidables = entityRegistry.withComponent('collidable');

      updateHero(hero, controls.keys, deltaMs, map, collidables);
      updateAgents(agents, hero, deltaMs, map, collidables);
      updateCombat(hero, agents, entityRegistry, deltaMs);
      applyLevelHazards(deltaMs);
      revealExplored(explored, hero, 9, 4);
      agents = agents.filter((agent) => agent.isAlive);

      if (hero.hurtCooldownMs && hero.hurtCooldownMs > 0) {
        hero.hurtCooldownMs = Math.max(hero.hurtCooldownMs - deltaMs, 0);
      }

      const remainingItems = pickupNearbyItems(hero, itemEntities);
      itemEntities
        .filter((entity) => !remainingItems.includes(entity))
        .forEach((entity) => entityRegistry.remove(entity.id));
      itemEntities = remainingItems;

      updateCamera(camera, hero, map);
      updateHud(hud, hero);
    }

  function applyLevelHazards(deltaMs: number) {
    const hazards = currentLevel.hazards ?? [];
    hazards.forEach((hazard) => {
      hazardTimers[hazard.id] = (hazardTimers[hazard.id] ?? 0) + deltaMs;
      if (hazardTimers[hazard.id] < hazard.intervalMs) return;
      hazardTimers[hazard.id] = 0;

      if (hazard.appliesTo !== 'enemies') {
        const heroEntity = hero.entity as EntityWithComponent<'health'>;
        const safe = entityOnSafeTile(hero.entity, map, hazard.safeTags);
        if (!safe) {
          applyDamage(heroEntity, hazard.damage);
          hero.isAlive = Boolean(heroEntity.components.health?.isAlive);
          if (!hero.isAlive) {
            respawnHero(hero);
          }
        }
      }

      if (hazard.appliesTo !== 'hero') {
        agents.forEach((agent) => {
          if (agent.entity.kind !== 'enemy' || !agent.entity.components.health?.isAlive) return;
          const safe = entityOnSafeTile(agent.entity, map, hazard.safeTags);
          if (!safe) {
            applyDamage(agent.entity as EntityWithComponent<'health'>, hazard.damage);
            agent.isAlive = Boolean(agent.entity.components.health?.isAlive);
            if (!agent.isAlive) {
              entityRegistry.remove(agent.entity.id);
            }
          }
        });
      }
    });
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTileLayers(ctx, renderLayers, camera);
    drawItems(ctx, assets.items, itemEntities, camera);
    drawAgents(ctx, assets.enemies, agents, camera);
    drawHero(ctx, assets.hero, hero, camera);
    drawFogOfWar(ctx, camera, explored, hero);
  }

  function gameLoop(timestamp: number) {
    const frameDelta = Math.min(timestamp - lastTime, MAX_ACCUMULATED_MS);
    lastTime = timestamp;
    accumulator += frameDelta;

    let steps = 0;
    while (accumulator >= FIXED_TIME_STEP_MS && steps < MAX_STEPS_PER_FRAME) {
      update(FIXED_TIME_STEP_MS);
      accumulator -= FIXED_TIME_STEP_MS;
      steps += 1;
    }

    if (steps === MAX_STEPS_PER_FRAME) {
      accumulator = 0;
    }

    render();
    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
}

start().catch((err) => {
  console.error('Failed to start game', err);
});

function resolveLevelLayers(level: LevelData): LevelLayer[] {
  if (level.layers && level.layers.length > 0) return level.layers;
  return [{ terrain: level.terrain, tiles: level.tiles }];
}

function buildRenderLayers(
  layers: LevelLayer[],
  assets: Assets,
  width: number,
  height: number
): { sheet: Assets['terrain'][keyof Assets['terrain']]; map: number[][] }[] {
  return layers.map((layer) => ({
    sheet: assets.terrain[layer.terrain],
    map: tilesToGrid(layer.tiles, width, height)
  }));
}

function composeCollisionMap(layers: LevelLayer[], width: number, height: number): number[][] {
  if (!layers.length) return [];
  const base = tilesToGrid(layers[0].tiles, width, height);
  const collisionMap = base.map((row) => [...row]);

  for (let i = 1; i < layers.length; i += 1) {
    const overlay = tilesToGrid(layers[i].tiles, width, height);
    for (let row = 0; row < height; row += 1) {
      for (let col = 0; col < width; col += 1) {
        if (overlay[row][col] >= 0) {
          collisionMap[row][col] = overlay[row][col];
        }
      }
    }
  }

  return collisionMap;
}

function createExploredGrid(width: number, height: number): boolean[][] {
  return Array.from({ length: height }, () => Array.from({ length: width }, () => false));
}

function revealExplored(explored: boolean[][], hero: HeroState, radius: number, softEdge: number): void {
  const { tileX, tileY } = hero.entity.position;
  const startRow = Math.max(tileY - radius, 0);
  const endRow = Math.min(tileY + radius, explored.length - 1);
  const startCol = Math.max(tileX - radius, 0);
  const endCol = Math.min(tileX + radius, explored[0].length - 1);

  for (let row = startRow; row <= endRow; row += 1) {
    for (let col = startCol; col <= endCol; col += 1) {
      const distance = Math.hypot(col - tileX, row - tileY);
      if (distance <= radius + softEdge) {
        explored[row][col] = true;
      }
    }
  }
}

function drawFogOfWar(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  explored: boolean[][],
  hero: HeroState
): void {
  const startCol = Math.max(Math.floor(camera.x / TILE_SIZE), 0);
  const endCol = Math.min(Math.ceil((camera.x + camera.width) / TILE_SIZE), explored[0].length);
  const startRow = Math.max(Math.floor(camera.y / TILE_SIZE), 0);
  const endRow = Math.min(Math.ceil((camera.y + camera.height) / TILE_SIZE), explored.length);

  const { tileX, tileY } = hero.entity.position;
  const visibility = 8;
  const softEdge = 4;
  ctx.save();
  for (let row = startRow; row < endRow; row += 1) {
    for (let col = startCol; col < endCol; col += 1) {
      const distance = Math.hypot(col - tileX, row - tileY);
      let alpha = explored[row][col] ? 0.4 : 0.78;
      if (distance < visibility) {
        const falloff = Math.max(distance - (visibility - softEdge), 0) / softEdge;
        alpha = Math.min(alpha, falloff * 0.8);
      }
      if (alpha <= 0) continue;

      ctx.fillStyle = `rgba(5, 8, 12, ${alpha.toFixed(2)})`;
      ctx.fillRect(col * TILE_SIZE - camera.x, row * TILE_SIZE - camera.y, TILE_SIZE, TILE_SIZE);
    }
  }
  ctx.restore();
}

function createLevelAgents(level: LevelData, assets: Assets): AgentState[] {
  const spawns = level.spawns ?? [];
  return spawns.map((spawn) => createAgent(spawn, assets.enemies));
}

function attachQuestGiverInteraction(
  agents: AgentState[],
  gameState: ReturnType<typeof createGameState>,
  questOverlay: ReturnType<typeof createQuestOverlay>
): void {
  const questNpc = agents.find((agent) => agent.entity.kind === 'npc' && agent.entity.tags?.includes('quest-giver'));
  if (!questNpc) return;

  questNpc.entity.components.interactable = {
    prompt: 'Talk',
    onInteract: () => {
      gameState.mode = 'dialogue';
      questOverlay.open();
    }
  };
}

function createLevelItems(level: LevelData, assets: Assets): Entity[] {
  const spawns: ItemSpawn[] = level.items ?? [];
  return spawns.map((spawn) => createItemEntity(spawn, assets.items));
}

function entityOnSafeTile(
  entity: Entity,
  map: number[][],
  safeTags: string[] | undefined
): boolean {
  const tile = map[entity.position.tileY]?.[entity.position.tileX] ?? 0;
  const tileMeta = getTileMetadata(tile);
  if (!safeTags?.length) return false;
  return safeTags.some((tag) => tileMeta.tags?.includes(tag));
}

function drawItems(
  ctx: CanvasRenderingContext2D,
  sheet: Assets['items'],
  items: Entity[],
  camera: { x: number; y: number }
): void {
  items.forEach((item) => {
    const sx = item.sprite.frame * sheet.tileWidth;
    const sy = item.sprite.direction * sheet.tileHeight;
    const screenX = item.position.tileX * TILE_SIZE - camera.x;
    const screenY = item.position.tileY * TILE_SIZE - camera.y;
    ctx.drawImage(sheet.image, sx, sy, sheet.tileWidth, sheet.tileHeight, screenX, screenY, TILE_SIZE, TILE_SIZE);
  });
}

function updateCamera(camera: Camera, hero: HeroState, map: number[][]): void {
  const mapWidth = map[0].length * TILE_SIZE;
  const mapHeight = map.length * TILE_SIZE;
  const heroPos = getHeroPixelPosition(hero);
  const heroCenterX = heroPos.x + TILE_SIZE / 2;
  const heroCenterY = heroPos.y + TILE_SIZE / 2;

  const maxCameraX = Math.max(mapWidth - camera.width, 0);
  const maxCameraY = Math.max(mapHeight - camera.height, 0);

  camera.x = clamp(heroCenterX - camera.width / 2, 0, maxCameraX);
  camera.y = clamp(heroCenterY - camera.height / 2, 0, maxCameraY);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
