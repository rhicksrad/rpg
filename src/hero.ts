import { SpriteSheet, TILE_SIZE } from './assets';
import {
  Direction,
  Entity,
  createEntity,
  createPosition,
  createSprite,
  getEntityPixelPosition,
  EntityWithComponent
} from './entities';
import { moveEntityWithCollision } from './movement';

export type HeroState = {
  entity: Entity;
  frameTimer: number;
  speedTilesPerSecond: number;
  speedPixelsPerSecond?: number;
};

const FRAME_DURATION_MS = 150;

export function createHero(map: number[][], heroSheet: SpriteSheet): HeroState {
  const tileX = Math.floor(map[0].length / 2);
  const tileY = Math.floor(map.length / 2);
  const position = createPosition(tileX, tileY);
  const sprite = createSprite(heroSheet, 0, 1);

  const heroEntity = createEntity({
    kind: 'player',
    position,
    sprite,
    components: {
      collidable: { solid: true },
      health: { current: 5, max: 5 },
      interactable: { prompt: 'Hero' }
    }
  });

  return {
    entity: heroEntity,
    frameTimer: 0,
    speedTilesPerSecond: 7.5
  };
}

export function updateHero(
  hero: HeroState,
  keys: Record<string, boolean>,
  deltaMs: number,
  map: number[][],
  collidables: EntityWithComponent<'collidable'>[]
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

  const inputIsActive = dx !== 0 || dy !== 0;

  if (inputIsActive) {
    const length = Math.hypot(dx, dy) || 1;
    const normalizedDx = dx / length;
    const normalizedDy = dy / length;
    const stepPixels = (hero.speedPixelsPerSecond ?? hero.speedTilesPerSecond * TILE_SIZE) * deltaSeconds;

    const direction: Direction | null = (() => {
      if (normalizedDy > 0) return 0;
      if (normalizedDy < 0) return 3;
      if (normalizedDx < 0) return 1;
      if (normalizedDx > 0) return 2;
      return null;
    })();

    if (direction !== null) {
      hero.entity.sprite.direction = direction;
    }

    const { moved } = moveEntityWithCollision(
      hero.entity,
      normalizedDx,
      normalizedDy,
      hero.speedPixelsPerSecond ?? hero.speedTilesPerSecond * TILE_SIZE,
      deltaMs,
      map,
      collidables
    );

    if (moved) {
      hero.frameTimer += deltaMs;
      if (hero.frameTimer >= FRAME_DURATION_MS) {
        hero.entity.sprite.frame = hero.entity.sprite.frame % 2 === 0 ? 1 : 2;
        hero.frameTimer = 0;
      }
      if (hero.entity.sprite.frame === 0) {
        hero.entity.sprite.frame = 1;
      }
    } else {
      hero.entity.sprite.frame = 1;
      hero.frameTimer = 0;
    }
  } else {
    hero.entity.sprite.frame = 1;
    hero.frameTimer = 0;
  }
}

export function drawHero(
  ctx: CanvasRenderingContext2D,
  sheet: SpriteSheet,
  hero: HeroState,
  camera: { x: number; y: number }
): void {
  const sx = hero.entity.sprite.frame * sheet.tileWidth;
  const sy = hero.entity.sprite.direction * sheet.tileHeight;
  const { x, y } = getHeroPixelPosition(hero);
  const screenX = x - camera.x;
  const screenY = y - camera.y;

  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.ellipse(
    screenX + TILE_SIZE / 2,
    screenY + TILE_SIZE * 0.85,
    TILE_SIZE * 0.38,
    TILE_SIZE * 0.2,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.restore();

  ctx.drawImage(
    sheet.image,
    sx,
    sy,
    sheet.tileWidth,
    sheet.tileHeight,
    screenX,
    screenY,
    TILE_SIZE,
    TILE_SIZE
  );
}

export function getHeroPixelPosition(hero: HeroState): { x: number; y: number } {
  return getEntityPixelPosition(hero.entity);
}

export function getTileInFront(hero: HeroState): { tileX: number; tileY: number } {
  const offsets: Record<Direction, { dx: number; dy: number }> = {
    0: { dx: 0, dy: 1 },
    1: { dx: -1, dy: 0 },
    2: { dx: 1, dy: 0 },
    3: { dx: 0, dy: -1 }
  };

  const { dx, dy } = offsets[hero.entity.sprite.direction];

  return {
    tileX: hero.entity.position.tileX + dx,
    tileY: hero.entity.position.tileY + dy
  };
}
