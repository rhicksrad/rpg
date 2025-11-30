import { SpriteSheet, TILE_SIZE } from './assets';

export type HeroState = {
  x: number;
  y: number;
  direction: 0 | 1 | 2 | 3; // down, left, right, up
  frame: 0 | 1 | 2; // idle/walk frames
  frameTimer: number;
  speed: number; // pixels per second
};

const FRAME_DURATION_MS = 150;

export function createHero(canvas: HTMLCanvasElement): HeroState {
  return {
    x: (canvas.width - TILE_SIZE) / 2,
    y: (canvas.height - TILE_SIZE) / 2,
    direction: 0,
    frame: 0,
    frameTimer: 0,
    speed: 120
  };
}

export function updateHero(
  hero: HeroState,
  keys: Record<string, boolean>,
  deltaMs: number,
  canvas: HTMLCanvasElement
): void {
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

  const isMoving = dx !== 0 || dy !== 0;

  if (isMoving) {
    const length = Math.hypot(dx, dy) || 1;
    dx /= length;
    dy /= length;

    hero.x += dx * hero.speed * deltaSeconds;
    hero.y += dy * hero.speed * deltaSeconds;

    if (dy > 0) hero.direction = 0;
    else if (dy < 0) hero.direction = 3;
    else if (dx < 0) hero.direction = 1;
    else if (dx > 0) hero.direction = 2;

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

  const maxX = canvas.width - TILE_SIZE;
  const maxY = canvas.height - TILE_SIZE;

  hero.x = Math.min(Math.max(hero.x, 0), maxX);
  hero.y = Math.min(Math.max(hero.y, 0), maxY);
}

export function drawHero(
  ctx: CanvasRenderingContext2D,
  sheet: SpriteSheet,
  hero: HeroState
): void {
  const sx = hero.frame * sheet.tileWidth;
  const sy = hero.direction * sheet.tileHeight;

  ctx.drawImage(
    sheet.image,
    sx,
    sy,
    sheet.tileWidth,
    sheet.tileHeight,
    hero.x,
    hero.y,
    TILE_SIZE,
    TILE_SIZE
  );
}
