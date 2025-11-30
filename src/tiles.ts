export type TileType = 'floor' | 'wall' | 'water' | 'pit' | 'decor';

export type TileMetadata = {
  type: TileType;
  collidable: boolean;
  moveCost?: number;
  damagePerSecond?: number;
};

const DEFAULT_TILE: TileMetadata = { type: 'floor', collidable: false, moveCost: 1 };

const TILE_METADATA: Record<number, TileMetadata> = {
  0: { type: 'floor', collidable: false, moveCost: 1 },
  1: { type: 'floor', collidable: false, moveCost: 1 },
  2: { type: 'decor', collidable: false, moveCost: 1 },
  3: { type: 'floor', collidable: false, moveCost: 1 },
  4: { type: 'floor', collidable: false, moveCost: 1 },
  5: { type: 'floor', collidable: false, moveCost: 1 },
  6: { type: 'floor', collidable: false, moveCost: 1 },
  7: { type: 'decor', collidable: false, moveCost: 1 },
  8: { type: 'floor', collidable: false, moveCost: 1 },
  9: { type: 'floor', collidable: false, moveCost: 1 },
  10: { type: 'floor', collidable: false, moveCost: 1 },
  11: { type: 'decor', collidable: false, moveCost: 1 },
  12: { type: 'wall', collidable: true },
  13: { type: 'wall', collidable: true },
  14: { type: 'water', collidable: true, moveCost: 2 },
  15: { type: 'pit', collidable: true, damagePerSecond: 10 },
  16: { type: 'floor', collidable: false, moveCost: 1 },
  17: { type: 'floor', collidable: false, moveCost: 1 },
  18: { type: 'wall', collidable: true },
  19: { type: 'wall', collidable: true },
  20: { type: 'water', collidable: true, moveCost: 2 },
  21: { type: 'water', collidable: true, moveCost: 2 },
  22: { type: 'water', collidable: true, moveCost: 2 },
  23: { type: 'pit', collidable: true, damagePerSecond: 10 },
  24: { type: 'floor', collidable: false, moveCost: 1 },
  25: { type: 'floor', collidable: false, moveCost: 1 },
  26: { type: 'decor', collidable: false, moveCost: 1 },
  27: { type: 'pit', collidable: true, damagePerSecond: 10 },
  28: { type: 'decor', collidable: false, moveCost: 1 },
  29: { type: 'decor', collidable: false, moveCost: 1 },
  30: { type: 'wall', collidable: true },
  31: { type: 'wall', collidable: true }
};

export function getTileMetadata(tileIndex: number): TileMetadata {
  return TILE_METADATA[tileIndex] ?? DEFAULT_TILE;
}

export function isTileCollidable(tileIndex: number): boolean {
  return getTileMetadata(tileIndex).collidable;
}
