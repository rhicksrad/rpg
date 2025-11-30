import './style.css';
import { Assets, TILE_SIZE, loadAssets } from './assets';
import { initializeCanvas, resizeCanvasToViewport } from './canvas';
import { ControlState, setupControls } from './controls';
import { HeroState, createHero, drawHero, getHeroPixelPosition, respawnHero, updateHero } from './hero';
import { Entity, EntityRegistry, createEntityRegistry } from './entities';
import { InteractTarget, getInteractionTarget, interact } from './interactions';
import { DEFAULT_LEVEL_ID, LEVELS, LEVELS_BY_ID, LevelData } from './levels';
import { Camera, drawTileMap } from './renderTiles';
import { createLevelLoader, levelTilesToGrid } from './levelLoader';
import { AgentState, createAgent, drawAgents, updateAgents } from './agents';
import { createItemEntity, ItemSpawn, pickupNearbyItems } from './items';
import { createHud, updateHud } from './hud';
import { queueHeroAttack, updateCombat } from './combat';
import { createGameState, toggleInventory, togglePause } from './gameState';

const { canvas, ctx } = initializeCanvas('game-canvas');
const controls: ControlState = setupControls();

async function start() {
  const assets: Assets = await loadAssets();
  let currentLevel: LevelData = LEVELS_BY_ID[DEFAULT_LEVEL_ID];
  let map = levelTilesToGrid(currentLevel);
  let hero = createHero(map, assets.hero);
  let agents: AgentState[] = createLevelAgents(currentLevel, assets);
  let itemEntities: Entity[] = createLevelItems(currentLevel, assets);
  let entityRegistry: EntityRegistry = createEntityRegistry([
    hero.entity,
    ...agents.map((agent) => agent.entity),
    ...itemEntities
  ]);
  let activeTerrain = assets.terrain[currentLevel.terrain];
  const gameState = createGameState();
  const hud = createHud();
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
  }

  loaderSelect.value = currentLevel.id;

  function loadLevel(levelId: string) {
    const nextLevel = LEVELS_BY_ID[levelId] ?? LEVELS_BY_ID[DEFAULT_LEVEL_ID];
    currentLevel = nextLevel;
    map = levelTilesToGrid(currentLevel);
    hero = createHero(map, assets.hero);
    agents = createLevelAgents(currentLevel, assets);
    itemEntities = createLevelItems(currentLevel, assets);
    entityRegistry = createEntityRegistry([hero.entity, ...agents.map((agent) => agent.entity), ...itemEntities]);
    activeTerrain = assets.terrain[currentLevel.terrain];
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

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTileMap(ctx, activeTerrain, map, camera);
    drawItems(ctx, assets.items, itemEntities, camera);
    drawAgents(ctx, assets.enemies, agents, camera);
    drawHero(ctx, assets.hero, hero, camera);
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

function createLevelAgents(level: LevelData, assets: Assets): AgentState[] {
  const spawns = level.spawns ?? [];
  return spawns.map((spawn) => createAgent(spawn, assets.enemies));
}

function createLevelItems(level: LevelData, assets: Assets): Entity[] {
  const spawns: ItemSpawn[] = level.items ?? [];
  return spawns.map((spawn) => createItemEntity(spawn, assets.items));
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
