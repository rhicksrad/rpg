import './style.css';
import { Assets, TILE_SIZE, loadAssets } from './assets';
import { HeroState, createHero, getHeroPixelPosition, updateHero } from './hero';
import { Camera, drawTileMap } from './renderTiles';
import { DEFAULT_LEVEL_ID, LEVELS, LEVELS_BY_ID, LevelData } from './levels';
import { InteractTarget, getInteractionTarget, interact } from './interactions';
import {
  Entity,
  EntityRegistry,
  createEntity,
  createEntityRegistry,
  createPosition,
  createSprite,
  drawEntities
} from './entities';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement | null;

if (!canvas) {
  throw new Error('Canvas element not found');
}

const ctx = canvas.getContext('2d');

if (!ctx) {
  throw new Error('Unable to acquire 2D context');
}

ctx.imageSmoothingEnabled = false;

const keys: Record<string, boolean> = {};
let interactRequested = false;
let previousGamepadButtons: boolean[] = [];

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key)) {
    keys[key] = true;
    event.preventDefault();
  } else if (key === 'e' && !event.repeat) {
    interactRequested = true;
    event.preventDefault();
  }
});

window.addEventListener('keyup', (event) => {
  const key = event.key.toLowerCase();
  delete keys[key];
});

function levelTilesToGrid(level: LevelData): number[][] {
  if (level.tiles.length !== level.width * level.height) {
    throw new Error(`Level ${level.id} tile data is inconsistent with dimensions`);
  }

  const grid: number[][] = [];

  for (let row = 0; row < level.height; row += 1) {
    const start = row * level.width;
    grid.push(level.tiles.slice(start, start + level.width));
  }

  return grid;
}

function createLevelLoader(
  levels: LevelData[],
  onSelect: (levelId: string) => void,
  onNext: () => void
): { container: HTMLDivElement; select: HTMLSelectElement } {
  const container = document.createElement('div');
  container.className = 'level-loader';

  const label = document.createElement('label');
  label.textContent = 'Load level:';

  const select = document.createElement('select');
  select.ariaLabel = 'Select level';

  levels.forEach((level) => {
    const option = document.createElement('option');
    option.value = level.id;
    option.textContent = level.levelName;
    select.appendChild(option);
  });

  select.addEventListener('change', () => onSelect(select.value));

  const nextButton = document.createElement('button');
  nextButton.type = 'button';
  nextButton.textContent = 'Next level';
  nextButton.addEventListener('click', onNext);

  container.append(label, select, nextButton);

  return { container, select };
}

async function start() {
  const assets: Assets = await loadAssets();
  let currentLevel: LevelData = LEVELS_BY_ID[DEFAULT_LEVEL_ID];
  let map = levelTilesToGrid(currentLevel);
  let hero = createHero(map, assets.hero);
  let entities: EntityRegistry = createEntityRegistry([hero.entity]);
  let activeTerrain = assets.terrain[currentLevel.terrain];
  const camera: Camera = {
    x: 0,
    y: 0,
    width: canvas.width,
    height: canvas.height
  };

  resizeCanvasToViewport(camera, map);
  window.addEventListener('resize', () => resizeCanvasToViewport(camera, map));

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

  loaderSelect.value = currentLevel.id;

  populateLevelEntities(map, entities, assets.hero);

  function loadLevel(levelId: string) {
    const nextLevel = LEVELS_BY_ID[levelId] ?? LEVELS_BY_ID[DEFAULT_LEVEL_ID];
    currentLevel = nextLevel;
    map = levelTilesToGrid(currentLevel);
    hero = createHero(map, assets.hero);
    entities = createEntityRegistry([hero.entity]);
    populateLevelEntities(map, entities, assets.hero);
    activeTerrain = assets.terrain[currentLevel.terrain];
    camera.x = 0;
    camera.y = 0;
    resizeCanvasToViewport(camera, map);
    loaderSelect.value = currentLevel.id;
  }

  function populateLevelEntities(
    currentMap: number[][],
    registry: EntityRegistry,
    heroSheet: Assets['hero']
  ): void {
    const mapWidth = currentMap[0].length;
    const mapHeight = currentMap.length;
    const centerX = Math.floor(mapWidth / 2);
    const centerY = Math.floor(mapHeight / 2);

    const villagers: Array<{ x: number; y: number; prompt: string }> = [
      { x: Math.max(1, centerX - 3), y: centerY, prompt: 'Lovely day for a walk.' },
      {
        x: Math.min(mapWidth - 2, centerX + 4),
        y: Math.max(1, centerY + 2),
        prompt: 'Press E near folks to chat.'
      }
    ];

    villagers.forEach((villager, index) => {
      const npc: Entity = createEntity({
        kind: 'npc',
        position: createPosition(villager.x, villager.y),
        sprite: createSprite(heroSheet, 0, (index % 2) + 1),
        components: {
          collidable: { solid: true },
          interactable: {
            prompt: villager.prompt,
            onInteract: (self, actor) => {
              console.log(`${self.id} says to the ${actor.kind}: ${villager.prompt}`);
            }
          }
        },
        tags: ['villager']
      });

      registry.register(npc);
    });
  }

  let lastTime = performance.now();

  function gameLoop(timestamp: number) {
    const deltaMs = timestamp - lastTime;
    lastTime = timestamp;

    if (consumeInteractRequest() || pollGamepadInteract()) {
      const target: InteractTarget | null = getInteractionTarget(hero, map, entities);
      interact(target, hero.entity);
    }

    updateHero(hero, keys, deltaMs, map, entities);
    updateCamera(camera, hero, map);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTileMap(ctx, activeTerrain, map, camera);
    drawEntities(ctx, entities.all(), camera);

    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
}

start().catch((err) => {
  console.error('Failed to start game', err);
});

function resizeCanvasToViewport(camera: Camera, map: number[][]): void {
  const mapWidth = map[0].length * TILE_SIZE;
  const mapHeight = map.length * TILE_SIZE;
  const width = Math.min(window.innerWidth, mapWidth);
  const height = Math.min(window.innerHeight, mapHeight);

  canvas.width = width;
  canvas.height = height;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  camera.width = width;
  camera.height = height;
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

function consumeInteractRequest(): boolean {
  const shouldInteract = interactRequested;
  interactRequested = false;
  return shouldInteract;
}

function pollGamepadInteract(): boolean {
  const gamepads = navigator.getGamepads?.() ?? [];
  const primaryPad = gamepads.find((pad) => pad !== null);

  if (!primaryPad) {
    previousGamepadButtons = [];
    return false;
  }

  const pressedButtons = primaryPad.buttons.map((button) => button.pressed);
  const interactPressed = pressedButtons[0] && !previousGamepadButtons[0];
  previousGamepadButtons = pressedButtons;

  return interactPressed;
}
