export type TileType = 'floor' | 'wall' | 'water' | 'pit' | 'decor';

export type TileMetadata = {
  type: TileType;
  collidable: boolean;
  moveCost?: number;
  damagePerSecond?: number;
};

const DEFAULT_TILE: TileMetadata = { type: 'floor', collidable: false, moveCost: 1 };

const TILE_METADATA: Record<number, TileMetadata> = {
  0: { type: 'wall', collidable: true }, // horizontal wood wall
  1: { type: 'wall', collidable: true }, // vertical wood wall
  2: { type: 'wall', collidable: true }, // red brick
  3: { type: 'wall', collidable: true }, // alternate brick
  4: { type: 'floor', collidable: false, moveCost: 1 }, // stone wall
  5: { type: 'floor', collidable: false, moveCost: 1 }, // small door
  6: { type: 'floor', collidable: false, moveCost: 1 }, // variant door
  7: { type: 'decor', collidable: true }, // window
  8: { type: 'wall', collidable: true }, // fence
  9: { type: 'decor', collidable: true }, // signpost
  10: { type: 'decor', collidable: true }, // barrel
  11: { type: 'decor', collidable: true }, // bush
  12: { type: 'floor', collidable: false, moveCost: 1 }, // grass tile
  13: { type: 'floor', collidable: false, moveCost: 1 }, // dirt tile
  14: { type: 'floor', collidable: false, moveCost: 1 }, // gravel/cobble
  15: { type: 'floor', collidable: false, moveCost: 1 }, // path edge horizontal
  16: { type: 'floor', collidable: false, moveCost: 1 }, // path edge vertical
  17: { type: 'floor', collidable: false, moveCost: 1 }, // floorboards
  18: { type: 'wall', collidable: true }, // foundation stone
  19: { type: 'wall', collidable: true }, // dark brick
  20: { type: 'floor', collidable: false, moveCost: 1 }, // alternate grass
  21: { type: 'floor', collidable: false, moveCost: 1 }, // compact dirt
  22: { type: 'decor', collidable: true }, // stacked barrel-ish
  23: { type: 'decor', collidable: true }, // second bush
  24: { type: 'decor', collidable: true }, // well top
  25: { type: 'water', collidable: true, moveCost: 2 },
  26: { type: 'pit', collidable: true, damagePerSecond: 10 },
  27: { type: 'decor', collidable: false, moveCost: 1 },
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
