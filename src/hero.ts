import { SpriteSheet, TILE_SIZE } from './assets';
import { isTileCollidable } from './tiles';

export type HeroState = {
  tileX: number;
  tileY: number;
  offsetX: number;
  offsetY: number;
  direction: 0 | 1 | 2 | 3; // down, left, right, up
  frame: 0 | 1 | 2; // idle/walk frames
  frameTimer: number;
  speedTilesPerSecond: number;
  speedPixelsPerSecond?: number;
};

const FRAME_DURATION_MS = 150;

export function createHero(map: number[][]): HeroState {
  const tileX = Math.floor(map[0].length / 2);
  const tileY = Math.floor(map.length / 2);

  return {
    tileX,
    tileY,
    offsetX: 0,
    offsetY: 0,
    direction: 0,
    frame: 0,
    frameTimer: 0,
    speedTilesPerSecond: 7.5
  };
}

export function updateHero(
  hero: HeroState,
  keys: Record<string, boolean>,
  deltaMs: number,
  map: number[][]
): void {
  const start = getHeroPixelPosition(hero);
  const deltaSeconds = deltaMs / 1000;
  let dx = 0;
  let dy = 0;

  const up = keys['arrowup'] || keys['w'];
  const down = keys['arrowdown'] || keys['s'];
  const left = keys['arrowleft'] || keys['a'];
  const right = keys['arrowright'] || keys['d'];

  if (up) dy -= 1;
  if (down) dy += 1;
  if (left) dx -= 1;
  if (right) dx += 1;

  const inputIsActive = dx !== 0 || dy !== 0;

  const mapWidth = map[0].length * TILE_SIZE;
  const mapHeight = map.length * TILE_SIZE;

  const isCollidingWithMap = (x: number, y: number): boolean => {
    if (x < 0 || y < 0 || x + TILE_SIZE > mapWidth || y + TILE_SIZE > mapHeight) {
      return true;
    }

    const minCol = Math.floor(x / TILE_SIZE);
    const maxCol = Math.floor((x + TILE_SIZE - 1) / TILE_SIZE);
    const minRow = Math.floor(y / TILE_SIZE);
    const maxRow = Math.floor((y + TILE_SIZE - 1) / TILE_SIZE);

    for (let row = minRow; row <= maxRow; row += 1) {
      for (let col = minCol; col <= maxCol; col += 1) {
        if (isTileCollidable(map[row][col])) {
          return true;
        }
      }
    }

    return false;
  };

  if (inputIsActive) {
    const length = Math.hypot(dx, dy) || 1;
    const normalizedDx = dx / length;
    const normalizedDy = dy / length;
    const stepPixels = (hero.speedPixelsPerSecond ?? hero.speedTilesPerSecond * TILE_SIZE) * deltaSeconds;

    if (normalizedDy > 0) hero.direction = 0;
    else if (normalizedDy < 0) hero.direction = 3;
    else if (normalizedDx < 0) hero.direction = 1;
    else if (normalizedDx > 0) hero.direction = 2;

    let currentX = start.x;
    let currentY = start.y;

    const attemptedX = currentX + normalizedDx * stepPixels;
    if (!isCollidingWithMap(attemptedX, currentY)) {
      currentX = attemptedX;
    }

    const attemptedY = currentY + normalizedDy * stepPixels;
    if (!isCollidingWithMap(currentX, attemptedY)) {
      currentY = attemptedY;
    }

    const moved = currentX !== start.x || currentY !== start.y;

    if (moved) {
      setHeroPixelPosition(hero, currentX, currentY);
      hero.frameTimer += deltaMs;
      if (hero.frameTimer >= FRAME_DURATION_MS) {
        hero.frame = (hero.frame % 2 === 0 ? 1 : 2) as 1 | 2;
        hero.frameTimer = 0;
      }
      if (hero.frame === 0) {
        hero.frame = 1;
      }
    } else {
      hero.frame = 0;
      hero.frameTimer = 0;
    }
  } else {
    hero.frame = 0;
    hero.frameTimer = 0;
  }
}

export function drawHero(
  ctx: CanvasRenderingContext2D,
  sheet: SpriteSheet,
  hero: HeroState
): void {
  const sx = hero.frame * sheet.tileWidth;
  const sy = hero.direction * sheet.tileHeight;
  const { x, y } = getHeroPixelPosition(hero);

  ctx.drawImage(
    sheet.image,
    sx,
    sy,
    sheet.tileWidth,
    sheet.tileHeight,
    x,
    y,
    TILE_SIZE,
    TILE_SIZE
  );
}

function getHeroPixelPosition(hero: HeroState): { x: number; y: number } {
  return {
    x: hero.tileX * TILE_SIZE + hero.offsetX,
    y: hero.tileY * TILE_SIZE + hero.offsetY
  };
}

function setHeroPixelPosition(hero: HeroState, x: number, y: number): void {
  const tileX = Math.floor(x / TILE_SIZE);
  const tileY = Math.floor(y / TILE_SIZE);

  hero.tileX = tileX;
  hero.tileY = tileY;
  hero.offsetX = x - tileX * TILE_SIZE;
  hero.offsetY = y - tileY * TILE_SIZE;
}
