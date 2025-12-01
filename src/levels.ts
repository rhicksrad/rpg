import { AgentSpawn } from './agents';
import { ChestSpawn } from './chests';
import { ItemSpawn } from './items';

export type LevelTerrain = 'overworld' | 'village' | 'castle';

export type LevelLayer = {
  terrain: LevelTerrain;
  tiles: number[];
};

export type LevelHazard = {
  id: string;
  description: string;
  intervalMs: number;
  damage: number;
  appliesTo?: 'hero' | 'enemies' | 'all';
  safeTags?: string[];
};

export type LevelData = {
  id: string;
  levelName: string;
  musicKey: string;
  nextLevelId?: string;
  width: number;
  height: number;
  tiles: number[];
  terrain: LevelTerrain;
  layers?: LevelLayer[];
  spawns?: AgentSpawn[];
  items?: ItemSpawn[];
  chests?: ChestSpawn[];
  hazards?: LevelHazard[];
};

const VILLAGE_TILES = {
  woodWallH: 0,
  woodWallV: 1,
  brick: 2,
  altBrick: 3,
  stoneWall: 4,
  door: 5,
  doorAlt: 6,
  window: 7,
  fence: 8,
  sign: 9,
  barrel: 10,
  bush: 11,
  grass: 12,
  dirt: 13,
  gravel: 14,
  pathEdgeH: 15,
  pathEdgeV: 16,
  floorboards: 17,
  foundation: 18,
  darkBrick: 19,
  grassAlt: 20,
  dirtPacked: 21,
  barrelStack: 22,
  bushAlt: 23,
  well: 24
};

const OVERWORLD_TILES = {
  grass: 90,
  grassAlt: 91,
  path: 81,
  gravel: 110,
  brightStone: 112,
  rockRidge: 138,
  darkRock: 168,
  mossyRock: 170
};

function fillRect(
  map: number[][],
  startX: number,
  startY: number,
  rectWidth: number,
  rectHeight: number,
  tile: number
): void {
  const rows = map.length;
  const cols = map[0].length;

  for (let row = Math.max(startY, 0); row < Math.min(startY + rectHeight, rows); row += 1) {
    for (let col = Math.max(startX, 0); col < Math.min(startX + rectWidth, cols); col += 1) {
      map[row][col] = tile;
    }
  }
}

function drawHorizontalPath(map: number[][], row: number, start: number, end: number, tile: number): void {
  for (let col = start; col <= end; col += 1) {
    map[row][col] = tile;
  }
}

function drawVerticalPath(map: number[][], col: number, start: number, end: number, tile: number): void {
  for (let row = start; row <= end; row += 1) {
    map[row][col] = tile;
  }
}

function createVillageBase(width: number, height: number): number[][] {
  const grassVariants = [VILLAGE_TILES.grass, VILLAGE_TILES.grassAlt];
  const dirtVariants = [VILLAGE_TILES.dirt, VILLAGE_TILES.dirtPacked];

  return Array.from({ length: height }, (_, row) =>
    Array.from({ length: width }, (_, col) => {
      const noise = (row * 13 + col * 7) % 10;
      if (noise === 0) {
        return dirtVariants[(row + col) % dirtVariants.length];
      }
      return grassVariants[(row + col) % grassVariants.length];
    })
  );
}

function addPathCross(map: number[][], midRow: number, midCol: number): void {
  const cols = map[0].length;
  const rows = map.length;

  drawHorizontalPath(map, midRow, 2, cols - 3, VILLAGE_TILES.gravel);
  drawHorizontalPath(map, midRow - 1, 2, cols - 3, VILLAGE_TILES.pathEdgeH);
  drawHorizontalPath(map, midRow + 1, 2, cols - 3, VILLAGE_TILES.pathEdgeH);

  drawVerticalPath(map, midCol, 2, rows - 3, VILLAGE_TILES.gravel);
  drawVerticalPath(map, midCol - 1, 2, rows - 3, VILLAGE_TILES.pathEdgeV);
  drawVerticalPath(map, midCol + 1, 2, rows - 3, VILLAGE_TILES.pathEdgeV);
}

function addPlaza(map: number[][], midRow: number, midCol: number): void {
  fillRect(map, midCol - 7, midRow - 6, 15, 13, VILLAGE_TILES.dirtPacked);
  fillRect(map, midCol - 6, midRow - 5, 13, 11, VILLAGE_TILES.gravel);
  map[midRow - 1][midCol + 1] = VILLAGE_TILES.well;
  map[midRow + 2][midCol - 2] = VILLAGE_TILES.sign;
}

function addBuilding(
  map: number[][],
  startX: number,
  startY: number,
  width: number,
  height: number,
  doorOffset = 0,
  style: 'wood' | 'brick' = 'wood'
): void {
  const horizontalWall = style === 'wood' ? VILLAGE_TILES.woodWallH : VILLAGE_TILES.darkBrick;
  const verticalWall = style === 'wood' ? VILLAGE_TILES.woodWallV : VILLAGE_TILES.brick;

  fillRect(map, startX + 1, startY + 1, width - 2, height - 2, VILLAGE_TILES.floorboards);

  for (let col = startX; col < startX + width; col += 1) {
    map[startY][col] = horizontalWall;
    map[startY + height - 1][col] = horizontalWall;
  }

  for (let row = startY; row < startY + height; row += 1) {
    map[row][startX] = verticalWall;
    map[row][startX + width - 1] = verticalWall;
  }

  map[startY][startX] = VILLAGE_TILES.foundation;
  map[startY][startX + width - 1] = VILLAGE_TILES.foundation;
  map[startY + height - 1][startX] = VILLAGE_TILES.foundation;
  map[startY + height - 1][startX + width - 1] = VILLAGE_TILES.foundation;

  const doorX = startX + Math.floor(width / 2) + doorOffset;
  const doorY = startY + height - 1;
  map[doorY][doorX] = VILLAGE_TILES.door;

  if (width > 4) {
    map[startY][startX + 2] = VILLAGE_TILES.window;
    map[startY][startX + width - 3] = VILLAGE_TILES.window;
  }
}

function addFencedGarden(
  map: number[][],
  startX: number,
  startY: number,
  width: number,
  height: number,
  gateOffset = 0
): void {
  fillRect(map, startX + 1, startY + 1, width - 2, height - 2, VILLAGE_TILES.dirt);

  for (let col = startX; col < startX + width; col += 1) {
    map[startY][col] = VILLAGE_TILES.fence;
    map[startY + height - 1][col] = VILLAGE_TILES.fence;
  }

  for (let row = startY; row < startY + height; row += 1) {
    map[row][startX] = VILLAGE_TILES.fence;
    map[row][startX + width - 1] = VILLAGE_TILES.fence;
  }

  const gateX = startX + Math.floor(width / 2) + gateOffset;
  map[startY + height - 1][gateX] = VILLAGE_TILES.doorAlt;
}

function scatterVillageDetails(map: number[][], midRow: number, midCol: number): void {
  const rows = map.length;
  const cols = map[0].length;

  for (let row = 2; row < rows - 2; row += 7) {
    for (let col = 4; col < cols - 4; col += 9) {
      const nearMainRoad = Math.abs(row - midRow) <= 2 || Math.abs(col - midCol) <= 2;
      if (nearMainRoad) continue;
      if ((row + col) % 3 === 0) {
        map[row][col] = VILLAGE_TILES.bush;
      } else if ((row + col) % 4 === 0) {
        map[row][col] = VILLAGE_TILES.barrel;
      }
    }
  }

  map[rows - 6][cols - 8] = VILLAGE_TILES.barrelStack;
  map[rows - 7][cols - 9] = VILLAGE_TILES.bushAlt;
}

function combineLayerTiles(layers: number[][][]): number[][] {
  if (!layers.length) return [];
  const base = layers[0].map((row) => [...row]);

  for (let i = 1; i < layers.length; i += 1) {
    const overlay = layers[i];
    for (let row = 0; row < base.length; row += 1) {
      for (let col = 0; col < base[0].length; col += 1) {
        if (overlay[row][col] >= 0) {
          base[row][col] = overlay[row][col];
        }
      }
    }
  }

  return base;
}

function createGrasslandLevel(): LevelData {
  const width = 200;
  const height = 150;
  const overworld = createOverworldBase(width, height);
  const structures = createOverworldStructures(width, height);
  const collision = combineLayerTiles([overworld, structures]);

  const midRow = Math.floor(height / 2);
  const midCol = Math.floor(width / 2);

  const subAreas = {
    north: { x: midCol, y: midRow - 50 },
    east: { x: midCol + 65, y: midRow + 8 },
    west: { x: midCol - 68, y: midRow - 12 }
  } as const;

  connectTownToSubAreas(overworld, midCol, midRow, subAreas);

  const spawns: AgentSpawn[] = [
    { kind: 'npc', tileX: midCol - 3, tileY: midRow + 2, facing: 1, tags: ['villager'] },
    { kind: 'npc', tileX: midCol + 10, tileY: midRow - 3, facing: 2, tags: ['scout'] },
    { kind: 'npc', tileX: midCol + 5, tileY: midRow + 4, facing: 2, tags: ['merchant'], spriteIndex: 8 },
    {
      kind: 'npc',
      tileX: midCol,
      tileY: midRow - 5,
      facing: 0,
      spriteIndex: 12,
      tags: ['quest-giver', 'old-man']
    },
    // Outskirts patrols
    {
      kind: 'enemy',
      tileX: midCol - 24,
      tileY: midRow + 24,
      waypoints: [
        { tileX: midCol - 24, tileY: midRow + 24 },
        { tileX: midCol - 30, tileY: midRow + 30 },
        { tileX: midCol - 16, tileY: midRow + 32 }
      ],
      pauseDurationMs: 420,
      speedTilesPerSecond: 3.4,
      tags: ['slime']
    },
    {
      kind: 'enemy',
      tileX: midCol + 30,
      tileY: midRow + 26,
      waypoints: [
        { tileX: midCol + 30, tileY: midRow + 26 },
        { tileX: midCol + 40, tileY: midRow + 28 },
        { tileX: midCol + 30, tileY: midRow + 34 }
      ],
      pauseDurationMs: 480,
      tags: ['bat']
    },
    // Quest approach: north wilds
    {
      kind: 'enemy',
      tileX: subAreas.north.x,
      tileY: subAreas.north.y - 6,
      waypoints: [
        { tileX: subAreas.north.x, tileY: subAreas.north.y - 6 },
        { tileX: subAreas.north.x - 6, tileY: subAreas.north.y - 2 },
        { tileX: subAreas.north.x + 6, tileY: subAreas.north.y - 2 }
      ],
      speedTilesPerSecond: 4.2,
      tags: ['rat'],
      drops: ['coin']
    },
    {
      kind: 'enemy',
      tileX: subAreas.north.x,
      tileY: subAreas.north.y - 12,
      tags: ['warden', 'boss'],
      health: 32,
      attackDamage: 5,
      detectionRangeTiles: 8,
      attackRangeTiles: 1.35,
      drops: ['gear-sash', 'coin-pouch']
    },
    // Quest approach: east stones
    {
      kind: 'enemy',
      tileX: subAreas.east.x - 4,
      tileY: subAreas.east.y + 6,
      waypoints: [
        { tileX: subAreas.east.x - 4, tileY: subAreas.east.y + 6 },
        { tileX: subAreas.east.x + 8, tileY: subAreas.east.y + 6 },
        { tileX: subAreas.east.x + 4, tileY: subAreas.east.y + 12 }
      ],
      speedTilesPerSecond: 4.5,
      tags: ['pickaxer'],
      attackDamage: 3,
      drops: ['timber-plank']
    },
    {
      kind: 'enemy',
      tileX: subAreas.east.x + 10,
      tileY: subAreas.east.y + 10,
      tags: ['foreman'],
      health: 24,
      attackDamage: 4,
      detectionRangeTiles: 7,
      drops: ['gear-sash']
    },
    // Quest approach: western marsh
    {
      kind: 'enemy',
      tileX: subAreas.west.x - 6,
      tileY: subAreas.west.y,
      waypoints: [
        { tileX: subAreas.west.x - 6, tileY: subAreas.west.y },
        { tileX: subAreas.west.x - 12, tileY: subAreas.west.y + 4 },
        { tileX: subAreas.west.x, tileY: subAreas.west.y + 6 }
      ],
      attackDamage: 2,
      tags: ['wisp']
    },
    {
      kind: 'enemy',
      tileX: subAreas.west.x - 2,
      tileY: subAreas.west.y + 10,
      tags: ['bog', 'boss'],
      health: 30,
      attackDamage: 4,
      detectionRangeTiles: 7,
      speedTilesPerSecond: 4.2,
      drops: ['creek-pearl']
    }
  ];

  const items: ItemSpawn[] = [
    { itemId: 'coin', tileX: midCol, tileY: midRow + 6 },
    { itemId: 'heart', tileX: midCol + 6, tileY: midRow + 4 },
    { itemId: 'sword', tileX: midCol - 10, tileY: midRow - 8 },
    { itemId: 'lantern-oil', tileX: subAreas.east.x, tileY: subAreas.east.y + 4 },
    { itemId: 'warmth-salve', tileX: subAreas.west.x - 4, tileY: subAreas.west.y + 8 }
  ];

  const chests: ChestSpawn[] = [
    { id: 'plaza-cache', tileX: midCol + 2, tileY: midRow + 10, coins: 18, itemId: 'potion' },
    { id: 'northern-stash', tileX: subAreas.north.x + 3, tileY: subAreas.north.y - 4, coins: 22 },
    { id: 'western-rations', tileX: subAreas.west.x - 5, tileY: subAreas.west.y + 4, coins: 14 }
  ];

  return {
    id: 'level-1',
    levelName: 'Verdant Lowlands',
    musicKey: 'overworld',
    nextLevelId: 'echoing-depths',
    width,
    height,
    terrain: 'overworld',
    tiles: collision.flat(),
    layers: [
      { terrain: 'overworld', tiles: overworld.flat() },
      { terrain: 'village', tiles: structures.flat() }
    ],
    spawns,
    items,
    chests
  };
}

function createOverworldBase(width: number, height: number): number[][] {
  const map = Array.from({ length: height }, (_, row) =>
    Array.from({ length: width }, (_, col) => {
      const noise = (row * 17 + col * 13) % 11;
      if (noise === 0) return OVERWORLD_TILES.grassAlt;
      if (noise === 1) return OVERWORLD_TILES.gravel;
      return OVERWORLD_TILES.grass;
    })
  );

  // Rocky borders to keep players centered while the camera follows.
  fillRect(map, 0, 0, width, 4, OVERWORLD_TILES.darkRock);
  fillRect(map, 0, height - 4, width, 4, OVERWORLD_TILES.darkRock);
  fillRect(map, 0, 0, 4, height, OVERWORLD_TILES.darkRock);
  fillRect(map, width - 4, 0, 4, height, OVERWORLD_TILES.darkRock);

  for (let row = 6; row < height - 6; row += 9) {
    for (let col = 8; col < width - 8; col += 12) {
      if ((row + col) % 3 === 0) {
        map[row][col] = OVERWORLD_TILES.rockRidge;
      } else if ((row + col) % 5 === 0) {
        map[row][col] = OVERWORLD_TILES.mossyRock;
      }
    }
  }

  // Clearings for the town and sub-areas.
  const midRow = Math.floor(height / 2);
  const midCol = Math.floor(width / 2);
  fillRect(map, midCol - 18, midRow - 18, 36, 36, OVERWORLD_TILES.grassAlt);
  fillRect(map, midCol - 4, midRow - 4, 8, 8, OVERWORLD_TILES.gravel);

  const subAreas = [
    { x: midCol, y: midRow - 50 },
    { x: midCol + 65, y: midRow + 8 },
    { x: midCol - 68, y: midRow - 12 }
  ];
  subAreas.forEach(({ x, y }) => {
    fillRect(map, x - 10, y - 8, 20, 16, OVERWORLD_TILES.grassAlt);
    fillRect(map, x - 8, y - 6, 16, 12, OVERWORLD_TILES.gravel);
  });

  return map;
}

function createOverworldStructures(width: number, height: number): number[][] {
  const map = Array.from({ length: height }, () => Array.from({ length: width }, () => -1));
  const midRow = Math.floor(height / 2);
  const midCol = Math.floor(width / 2);

  addPathCross(map, midRow, midCol);
  addPlaza(map, midRow, midCol);

  addBuilding(map, midCol - 20, midRow - 12, 12, 9, 0, 'wood');
  addBuilding(map, midCol + 6, midRow - 14, 11, 9, 0, 'brick');
  addBuilding(map, midCol - 26, midRow + 6, 12, 9, 1, 'brick');
  addBuilding(map, midCol + 10, midRow + 7, 11, 9, -1, 'wood');

  const buildingDoors = [
    { x: midCol - 14, y: midRow - 4 },
    { x: midCol + 11, y: midRow - 6 },
    { x: midCol - 19, y: midRow + 14 },
    { x: midCol + 14, y: midRow + 15 }
  ];

  buildingDoors.forEach(({ x, y }) => {
    if (map[y + 1]?.[x] !== undefined) {
      map[y + 1][x] = VILLAGE_TILES.gravel;
      map[y + 2][x] = VILLAGE_TILES.pathEdgeV;
    }
  });

  const merchantStorefront = { x: midCol + 14, y: midRow + 15 };
  if (map[merchantStorefront.y + 1]?.[merchantStorefront.x] !== undefined) {
    map[merchantStorefront.y][merchantStorefront.x] = VILLAGE_TILES.door;
    map[merchantStorefront.y + 1][merchantStorefront.x] = VILLAGE_TILES.gravel;
    map[merchantStorefront.y + 1][merchantStorefront.x - 1] = VILLAGE_TILES.sign;
    map[merchantStorefront.y + 1][merchantStorefront.x + 1] = VILLAGE_TILES.pathEdgeV;
  }

  addFencedGarden(map, midCol - 30, midRow + 18, 14, 9, -1);
  addFencedGarden(map, midCol + 18, midRow + 18, 13, 9, 1);
  fillRect(map, midCol - 5, midRow + 18, 10, 6, VILLAGE_TILES.dirtPacked);

  scatterVillageDetails(map, midRow, midCol);

  const entrances = [
    { x: midCol, y: midRow - 42 },
    { x: midCol + 65, y: midRow + 2 },
    { x: midCol - 68, y: midRow - 18 }
  ];

  entrances.forEach(({ x, y }) => {
    fillRect(map, x - 3, y - 2, 6, 5, VILLAGE_TILES.dirtPacked);
    fillRect(map, x - 2, y - 1, 4, 4, VILLAGE_TILES.gravel);
    map[y - 2][x - 1] = VILLAGE_TILES.sign;
    map[y - 2][x + 1] = VILLAGE_TILES.sign;
    map[y - 1][x] = VILLAGE_TILES.doorAlt;
    map[y + 1][x] = VILLAGE_TILES.pathEdgeV;
  });

  return map;
}

function connectTownToSubAreas(
  overworld: number[][],
  midCol: number,
  midRow: number,
  subAreas: { north: { x: number; y: number }; east: { x: number; y: number }; west: { x: number; y: number } }
): void {
  drawVerticalPath(overworld, midCol, subAreas.north.y, midRow, OVERWORLD_TILES.path);
  drawHorizontalPath(overworld, subAreas.north.y, midCol - 4, midCol + 4, OVERWORLD_TILES.brightStone);

  drawHorizontalPath(overworld, midRow + 6, midCol, subAreas.east.x, OVERWORLD_TILES.path);
  drawVerticalPath(overworld, subAreas.east.x, midRow + 6, subAreas.east.y, OVERWORLD_TILES.brightStone);

  drawHorizontalPath(overworld, midRow - 8, subAreas.west.x, midCol, OVERWORLD_TILES.path);
  drawVerticalPath(overworld, subAreas.west.x, subAreas.west.y, midRow - 8, OVERWORLD_TILES.brightStone);
}

function generateTiles(
  width: number,
  height: number,
  {
    floorTile = 0,
    pathTile = 9,
    accentTile = 2,
    borderTile = 18,
    waterTile = 22,
    pitTile = 27
  }: {
    floorTile?: number;
    pathTile?: number;
    accentTile?: number;
    borderTile?: number;
    waterTile?: number;
    pitTile?: number;
  }
): number[] {
  const cols = Math.max(width, 8);
  const rows = Math.max(height, 8);
  const centerCol = Math.floor(cols / 2);
  const centerRow = Math.floor(rows / 2);

  const map: number[][] = Array.from({ length: rows }, () => Array.from({ length: cols }, () => floorTile));

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const isBorder = row === 0 || col === 0 || row === rows - 1 || col === cols - 1;
      const isMainPath = row === centerRow || col === centerCol;
      const isAccent = (row + col) % 9 === 0;
      const isWater = row === Math.floor(rows / 3) && col >= 2 && col <= cols - 3;
      const isPit = row === Math.floor((rows * 2) / 3) && col >= 2 && col <= cols - 3;

      if (isBorder) {
        map[row][col] = borderTile;
      } else if (isWater) {
        map[row][col] = waterTile;
      } else if (isPit) {
        map[row][col] = pitTile;
      } else if (isMainPath) {
        map[row][col] = pathTile;
      } else if (isAccent) {
        map[row][col] = accentTile;
      }
    }
  }

  return map.flat();
}

function createEchoingDepthsLevel(): LevelData {
  const width = 38;
  const height = 28;
  const map: number[][] = Array.from({ length: height }, () => Array.from({ length: width }, () => 21));

  fillRect(map, 0, 0, width, 1, 19);
  fillRect(map, 0, height - 1, width, 1, 19);
  fillRect(map, 0, 0, 1, height, 19);
  fillRect(map, width - 1, 0, 1, height, 19);

  fillRect(map, 4, 3, width - 8, height - 6, 14);
  fillRect(map, 6, 6, 8, 6, 27); // cleansing pools
  fillRect(map, width - 14, 8, 10, 5, 25); // cold water pockets
  fillRect(map, 16, 14, 6, 4, 28); // echo pulse vents

  for (let row = 8; row < height - 8; row += 4) {
    for (let col = 10; col < width - 10; col += 6) {
      map[row][col] = 18; // pillar cover
    }
  }

  const spawns: AgentSpawn[] = [
    {
      kind: 'enemy',
      tileX: 9,
      tileY: 9,
      waypoints: [
        { tileX: 9, tileY: 9 },
        { tileX: 14, tileY: 7 },
        { tileX: 12, tileY: 12 }
      ],
      speedTilesPerSecond: 4.5,
      tags: ['bat'],
      drops: ['glow-crystal', 'coin']
    },
    {
      kind: 'enemy',
      tileX: 20,
      tileY: 10,
      waypoints: [
        { tileX: 20, tileY: 10 },
        { tileX: 26, tileY: 9 },
        { tileX: 24, tileY: 12 }
      ],
      tags: ['bat'],
      speedTilesPerSecond: 4.5,
      drops: ['coin']
    },
    {
      kind: 'enemy',
      tileX: 14,
      tileY: 18,
      waypoints: [
        { tileX: 14, tileY: 18 },
        { tileX: 10, tileY: 20 },
        { tileX: 18, tileY: 19 }
      ],
      tags: ['slime'],
      health: 10,
      drops: ['slime-gel']
    },
    {
      kind: 'enemy',
      tileX: 28,
      tileY: 16,
      waypoints: [
        { tileX: 28, tileY: 16 },
        { tileX: 30, tileY: 13 },
        { tileX: 32, tileY: 18 }
      ],
      tags: ['rat'],
      speedTilesPerSecond: 5,
      drops: ['coin']
    },
    {
      kind: 'enemy',
      tileX: 24,
      tileY: 22,
      tags: ['broodmother', 'boss', 'bat'],
      health: 28,
      attackDamage: 4,
      attackRangeTiles: 1.2,
      detectionRangeTiles: 8,
      speedTilesPerSecond: 4,
      drops: ['broodmother-lamp', 'coin-pouch']
    }
  ];

  const items: ItemSpawn[] = [
    { itemId: 'glow-crystal', tileX: 8, tileY: 7 },
    { itemId: 'glow-crystal', tileX: 30, tileY: 9 },
    { itemId: 'lantern-polish', tileX: 12, tileY: 21 }
  ];

  return {
    id: 'echoing-depths',
    levelName: 'Echoing Depths',
    musicKey: 'dungeon',
    nextLevelId: 'timber-tunnels',
    width,
    height,
    terrain: 'castle',
    tiles: map.flat(),
    spawns,
    items,
    hazards: [
      {
        id: 'echo-pulse',
        description: 'Echo pulses ring out, punishing anyone away from cover.',
        intervalMs: 12000,
        damage: 2,
        appliesTo: 'all',
        safeTags: ['cover']
      }
    ]
  };
}

function createTimberTunnelsLevel(): LevelData {
  const width = 44;
  const height = 26;
  const map: number[][] = Array.from({ length: height }, () => Array.from({ length: width }, () => 21));

  fillRect(map, 0, 0, width, 1, 3);
  fillRect(map, 0, height - 1, width, 1, 3);
  fillRect(map, 0, 0, 1, height, 3);
  fillRect(map, width - 1, 0, 1, height, 3);

  fillRect(map, 4, 4, width - 8, 4, 14);
  fillRect(map, 6, 10, width - 12, 3, 14);
  fillRect(map, 8, 16, width - 16, 3, 14);
  fillRect(map, 10, 7, 6, 4, 25); // water pockets
  fillRect(map, width - 18, 12, 8, 4, 26); // cave-in pits

  for (let col = 6; col < width - 6; col += 6) {
    map[9][col] = 30;
    map[15][col + 2] = 30;
  }

  map[12][6] = 31;
  map[18][20] = 31;
  map[6][width - 10] = 31;

  const spawns: AgentSpawn[] = [
    {
      kind: 'enemy',
      tileX: 12,
      tileY: 5,
      waypoints: [
        { tileX: 12, tileY: 5 },
        { tileX: 18, tileY: 5 },
        { tileX: 18, tileY: 8 }
      ],
      tags: ['pickaxer'],
      attackDamage: 3,
      drops: ['timber-plank']
    },
    {
      kind: 'enemy',
      tileX: 22,
      tileY: 11,
      waypoints: [
        { tileX: 22, tileY: 11 },
        { tileX: 30, tileY: 11 },
        { tileX: 30, tileY: 14 }
      ],
      tags: ['foreman'],
      health: 18,
      attackDamage: 4,
      drops: ['gear-sash']
    },
    {
      kind: 'enemy',
      tileX: 16,
      tileY: 17,
      tags: ['mole'],
      waypoints: [
        { tileX: 16, tileY: 17 },
        { tileX: 12, tileY: 20 },
        { tileX: 22, tileY: 20 }
      ],
      speedTilesPerSecond: 5,
      drops: ['coin']
    },
    {
      kind: 'enemy',
      tileX: 32,
      tileY: 18,
      tags: ['warden', 'boss'],
      health: 32,
      attackDamage: 5,
      detectionRangeTiles: 7,
      attackRangeTiles: 1.3,
      drops: ['woodcutter-sash', 'timber-plank']
    }
  ];

  const items: ItemSpawn[] = [
    { itemId: 'timber-plank', tileX: 14, tileY: 6 },
    { itemId: 'gear-sash', tileX: 24, tileY: 9 },
    { itemId: 'lantern-oil', tileX: 30, tileY: 17 }
  ];

  return {
    id: 'timber-tunnels',
    levelName: 'Timber Tunnels',
    musicKey: 'dungeon',
    nextLevelId: 'river-hollow',
    width,
    height,
    terrain: 'castle',
    tiles: map.flat(),
    spawns,
    items,
    hazards: [
      {
        id: 'dust-choke',
        description: 'Dust clouds strain lungs until you find an air pocket.',
        intervalMs: 8000,
        damage: 1,
        appliesTo: 'hero',
        safeTags: ['air']
      }
    ]
  };
}

function createRiverHollowLevel(): LevelData {
  const width = 40;
  const height = 26;
  const map: number[][] = Array.from({ length: height }, () => Array.from({ length: width }, () => 13));

  fillRect(map, 0, 0, width, 1, 18);
  fillRect(map, 0, height - 1, width, 1, 18);
  fillRect(map, 0, 0, 1, height, 18);
  fillRect(map, width - 1, 0, 1, height, 18);

  fillRect(map, 4, 4, width - 8, height - 8, 14);
  fillRect(map, 6, 6, width - 12, 3, 25);
  fillRect(map, 8, 10, width - 16, 4, 29);
  fillRect(map, 10, 18, width - 20, 3, 25);
  map[12][10] = 31;
  map[12][width - 11] = 31;
  map[20][Math.floor(width / 2)] = 31;

  const spawns: AgentSpawn[] = [
    {
      kind: 'enemy',
      tileX: 10,
      tileY: 7,
      waypoints: [
        { tileX: 10, tileY: 7 },
        { tileX: 18, tileY: 7 },
        { tileX: 18, tileY: 9 }
      ],
      tags: ['wisp'],
      attackDamage: 2,
      drops: ['spirit-charm']
    },
    {
      kind: 'enemy',
      tileX: 22,
      tileY: 12,
      tags: ['leech'],
      waypoints: [
        { tileX: 22, tileY: 12 },
        { tileX: 26, tileY: 12 },
        { tileX: 26, tileY: 15 }
      ],
      attackDamage: 2,
      speedTilesPerSecond: 4.5,
      drops: ['coin']
    },
    {
      kind: 'enemy',
      tileX: 14,
      tileY: 18,
      tags: ['bog'],
      waypoints: [
        { tileX: 14, tileY: 18 },
        { tileX: 12, tileY: 21 },
        { tileX: 18, tileY: 21 }
      ],
      attackDamage: 3,
      drops: ['coin']
    },
    {
      kind: 'enemy',
      tileX: 28,
      tileY: 20,
      tags: ['kelpie', 'boss'],
      health: 30,
      attackDamage: 5,
      detectionRangeTiles: 8,
      attackRangeTiles: 1.25,
      drops: ['still-water-charm', 'creek-pearl']
    }
  ];

  const items: ItemSpawn[] = [
    { itemId: 'spirit-charm', tileX: 11, tileY: 6 },
    { itemId: 'warmth-salve', tileX: 20, tileY: 19 },
    { itemId: 'river-etching', tileX: 30, tileY: 10 }
  ];

  return {
    id: 'river-hollow',
    levelName: 'River Hollow',
    musicKey: 'dungeon',
    nextLevelId: 'level-1',
    width,
    height,
    terrain: 'castle',
    tiles: map.flat(),
    spawns,
    items,
    hazards: [
      {
        id: 'deep-chill',
        description: 'Cold mist drains warmth unless you hug braziers.',
        intervalMs: 6000,
        damage: 1,
        appliesTo: 'hero',
        safeTags: ['warmth']
      }
    ]
  };
}

const grassLevel = createGrasslandLevel();
const echoLevel = createEchoingDepthsLevel();
const timberLevel = createTimberTunnelsLevel();
const riverLevel = createRiverHollowLevel();

const castleLevel: LevelData = {
  id: 'level-2',
  levelName: 'Level 2 castle',
  musicKey: 'dungeon',
  nextLevelId: 'level-1',
  width: 32,
  height: 22,
  terrain: 'castle',
  tiles: generateTiles(32, 22, {
    floorTile: 4,
    pathTile: 5,
    accentTile: 7,
    borderTile: 30,
    waterTile: 25,
    pitTile: 26
  }),
  spawns: [
    {
      kind: 'enemy',
      tileX: 8,
      tileY: 11,
      waypoints: [
        { tileX: 8, tileY: 11 },
        { tileX: 24, tileY: 11 }
      ],
      pauseDurationMs: 450,
      speedTilesPerSecond: 3.25,
      tags: ['guard']
    }
  ],
  items: [
    { itemId: 'potion', tileX: 6, tileY: 6 },
    { itemId: 'boots', tileX: 16, tileY: 14 }
  ]
};

export const LEVELS: LevelData[] = [grassLevel, echoLevel, timberLevel, riverLevel, castleLevel];

export const LEVELS_BY_ID: Record<string, LevelData> = LEVELS.reduce(
  (acc, level) => ({ ...acc, [level.id]: level }),
  {} as Record<string, LevelData>
);

export const DEFAULT_LEVEL_ID = grassLevel.id;
