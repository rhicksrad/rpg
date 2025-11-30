export type TileType = 'floor' | 'wall' | 'water' | 'pit' | 'decor';

export type TileMetadata = {
  type: TileType;
  collidable: boolean;
  moveCost?: number;
  damagePerSecond?: number;
  tags?: string[];
};

const DEFAULT_TILE: TileMetadata = { type: 'floor', collidable: false, moveCost: 1 };

const TILE_METADATA: Record<number, TileMetadata> = {
  0: { type: 'wall', collidable: true, tags: ['cover'] }, // horizontal wood wall
  1: { type: 'wall', collidable: true, tags: ['cover'] }, // vertical wood wall
  2: { type: 'wall', collidable: true, tags: ['cover'] }, // red brick
  3: { type: 'wall', collidable: true, tags: ['cover'] }, // alternate brick
  4: { type: 'floor', collidable: false, moveCost: 1 }, // stone wall
  5: { type: 'floor', collidable: false, moveCost: 1 }, // small door
  6: { type: 'floor', collidable: false, moveCost: 1 }, // variant door
  7: { type: 'decor', collidable: true }, // window
  8: { type: 'wall', collidable: true, tags: ['cover'] }, // fence
  9: { type: 'decor', collidable: true }, // signpost
  10: { type: 'decor', collidable: true }, // barrel
  11: { type: 'decor', collidable: true }, // bush
  12: { type: 'floor', collidable: false, moveCost: 1 }, // grass tile
  13: { type: 'floor', collidable: false, moveCost: 1 }, // dirt tile
  14: { type: 'floor', collidable: false, moveCost: 1 }, // gravel/cobble
  15: { type: 'floor', collidable: false, moveCost: 1, tags: ['cover'] }, // path edge horizontal
  16: { type: 'floor', collidable: false, moveCost: 1, tags: ['cover'] }, // path edge vertical
  17: { type: 'floor', collidable: false, moveCost: 1 }, // floorboards
  18: { type: 'wall', collidable: true, tags: ['cover'] }, // foundation stone
  19: { type: 'wall', collidable: true, tags: ['cover'] }, // dark brick
  20: { type: 'floor', collidable: false, moveCost: 1 }, // alternate grass
  21: { type: 'floor', collidable: false, moveCost: 1 }, // compact dirt
  22: { type: 'decor', collidable: true }, // stacked barrel-ish
  23: { type: 'decor', collidable: true }, // second bush
  24: { type: 'decor', collidable: true }, // well top
  25: { type: 'water', collidable: false, moveCost: 1.5, tags: ['slow', 'cold'] },
  26: { type: 'pit', collidable: false, damagePerSecond: 8, moveCost: 1.3, tags: ['hazard'] },
  27: { type: 'water', collidable: false, moveCost: 1.4, tags: ['slow', 'cleanse'] },
  28: { type: 'pit', collidable: false, damagePerSecond: 4, moveCost: 1.2, tags: ['pulse'] },
  29: { type: 'water', collidable: false, damagePerSecond: 2, moveCost: 1.3, tags: ['chill'] },
  30: { type: 'wall', collidable: true, tags: ['cover'] },
  31: { type: 'floor', collidable: false, moveCost: 0.8, tags: ['air', 'warmth'] },
  90: { type: 'floor', collidable: false, moveCost: 1 }, // overworld grass
  91: { type: 'floor', collidable: false, moveCost: 1 }, // overworld grass alt
  81: { type: 'floor', collidable: false, moveCost: 1 }, // overworld path
  110: { type: 'floor', collidable: false, moveCost: 0.95 }, // gravel clearing
  112: { type: 'floor', collidable: false, moveCost: 1 }, // bright stone markers
  138: { type: 'wall', collidable: true, tags: ['cover'] }, // rocky ridge
  168: { type: 'wall', collidable: true, tags: ['cover'] }, // dark rock walling
  170: { type: 'wall', collidable: true, tags: ['cover'] } // mossy rock walling
};

export function getTileMetadata(tileIndex: number): TileMetadata {
  return TILE_METADATA[tileIndex] ?? DEFAULT_TILE;
}

export function isTileCollidable(tileIndex: number): boolean {
  return getTileMetadata(tileIndex).collidable;
}
