import './style.css';
import { Assets, TILE_SIZE, loadAssets } from './assets';
import { HeroState, createHero, drawHero, getHeroPixelPosition, updateHero } from './hero';
import { Camera, drawTileMap } from './renderTiles';
import { DEFAULT_LEVEL_ID, LEVELS, LEVELS_BY_ID, LevelData } from './levels';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement | null;

if (!canvas) {
  throw new Error('Canvas element not found');
}

const ctx = canvas.getContext('2d');

if (!ctx) {
  throw new Error('Unable to acquire 2D context');
}

const keys: Record<string, boolean> = {};

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key)) {
    keys[key] = true;
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
  let hero = createHero(map);
  let activeTerrain = assets.terrain[currentLevel.terrain];
  const camera: Camera = {
    x: 0,
    y: 0,
    width: canvas.width,
    height: canvas.height
  };

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

  function loadLevel(levelId: string) {
    const nextLevel = LEVELS_BY_ID[levelId] ?? LEVELS_BY_ID[DEFAULT_LEVEL_ID];
    currentLevel = nextLevel;
    map = levelTilesToGrid(currentLevel);
    hero = createHero(map);
    activeTerrain = assets.terrain[currentLevel.terrain];
    camera.x = 0;
    camera.y = 0;
    loaderSelect.value = currentLevel.id;
  }

  let lastTime = performance.now();

  function gameLoop(timestamp: number) {
    const deltaMs = timestamp - lastTime;
    lastTime = timestamp;

    updateHero(hero, keys, deltaMs, map);
    updateCamera(camera, hero, map);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTileMap(ctx, activeTerrain, map, camera);
    drawHero(ctx, assets.hero, hero, camera);

    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
}

start().catch((err) => {
  console.error('Failed to start game', err);
});

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
