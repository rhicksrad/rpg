import './style.css';
import { Assets, TILE_SIZE, loadAssets } from './assets';
import { HeroState, createHero, drawHero, getHeroPixelPosition, updateHero } from './hero';
import { Camera, drawTileMap } from './renderTiles';

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

function createMap(): number[][] {
  const cols = Math.ceil(canvas.width / TILE_SIZE) * 3;
  const rows = Math.ceil(canvas.height / TILE_SIZE) * 3;
  const centerCol = Math.floor(cols / 2);
  const centerRow = Math.floor(rows / 2);

  const wallTileIndex = 18;
  const waterTileIndex = 22;
  const pitTileIndex = 27;

  const map: number[][] = Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0));

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const isBorder = row === 0 || col === 0 || row === rows - 1 || col === cols - 1;
      const isMainPath = row === centerRow || col === centerCol;
      const isAccent = (row + col) % 11 === 0;
      const isWater = row >= Math.floor(rows / 3) && row <= Math.floor(rows / 3) + 1 && col >= 2 && col <= 4;
      const isPit = row >= Math.floor((rows * 2) / 3) && row <= Math.floor((rows * 2) / 3) + 1 && col >= cols - 6 && col <= cols - 4;

      if (isBorder) {
        map[row][col] = wallTileIndex;
      } else if (isWater) {
        map[row][col] = waterTileIndex;
      } else if (isPit) {
        map[row][col] = pitTileIndex;
      } else if (isMainPath) {
        map[row][col] = 9; // path tile
      } else if (isAccent) {
        map[row][col] = 2; // accent tile
      }
    }
  }

  return map;
}

async function start() {
  const assets: Assets = await loadAssets();
  const map = createMap();
  const hero = createHero(map);
  const camera: Camera = {
    x: 0,
    y: 0,
    width: canvas.width,
    height: canvas.height
  };

  let lastTime = performance.now();

  function gameLoop(timestamp: number) {
    const deltaMs = timestamp - lastTime;
    lastTime = timestamp;

    updateHero(hero, keys, deltaMs, map);
    updateCamera(camera, hero, map);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTileMap(ctx, assets.terrain.grass, map, camera);
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
