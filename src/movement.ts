import { TILE_SIZE } from './assets';
import { Entity, EntityWithComponent, getEntityPixelPosition, setEntityPixelPosition } from './entities';
import { isTileCollidable } from './tiles';

function isCollidingWithMap(x: number, y: number, map: number[][]): boolean {
  const mapWidth = map[0].length * TILE_SIZE;
  const mapHeight = map.length * TILE_SIZE;

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
}

function isCollidingWithEntities(
  x: number,
  y: number,
  collidables: EntityWithComponent<'collidable'>[],
  selfId: string
): boolean {
  const size = TILE_SIZE;
  for (const other of collidables) {
    if (!other.components.collidable?.solid || other.id === selfId) continue;
    const { x: ox, y: oy } = getEntityPixelPosition(other);
    const overlapX = ox < x + size && ox + size > x;
    const overlapY = oy < y + size && oy + size > y;
    if (overlapX && overlapY) {
      return true;
    }
  }

  return false;
}

export function moveEntityWithCollision(
  entity: Entity,
  dx: number,
  dy: number,
  speedPixelsPerSecond: number,
  deltaMs: number,
  map: number[][],
  collidables: EntityWithComponent<'collidable'>[] = []
): { moved: boolean; position: { x: number; y: number } } {
  const start = getEntityPixelPosition(entity);
  const length = Math.hypot(dx, dy) || 1;
  const normalizedDx = dx / length;
  const normalizedDy = dy / length;
  const stepPixels = speedPixelsPerSecond * (deltaMs / 1000);

  const attemptMove = (x: number, y: number): boolean => {
    if (isCollidingWithMap(x, y, map)) return false;
    if (isCollidingWithEntities(x, y, collidables, entity.id)) return false;
    return true;
  };

  let currentX = start.x;
  let currentY = start.y;

  const attemptedX = currentX + normalizedDx * stepPixels;
  if (attemptMove(attemptedX, currentY)) {
    currentX = attemptedX;
  }

  const attemptedY = currentY + normalizedDy * stepPixels;
  if (attemptMove(currentX, attemptedY)) {
    currentY = attemptedY;
  }

  const moved = currentX !== start.x || currentY !== start.y;

  if (moved) {
    setEntityPixelPosition(entity, currentX, currentY);
  }

  return { moved, position: { x: currentX, y: currentY } };
}
