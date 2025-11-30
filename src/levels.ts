import { AgentSpawn } from './agents';
import { ItemSpawn } from './items';

export type LevelTerrain = 'grass' | 'castle';

export type LevelData = {
  id: string;
  levelName: string;
  musicKey: string;
  nextLevelId?: string;
  width: number;
  height: number;
  tiles: number[];
  terrain: LevelTerrain;
  spawns?: AgentSpawn[];
  items?: ItemSpawn[];
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

function createGrasslandLevel(): LevelData {
  const width = 64;
  const height = 48;
  const map = createVillageBase(width, height);

  const midRow = Math.floor(height / 2);
  const midCol = Math.floor(width / 2);

  addPathCross(map, midRow, midCol);
  addPlaza(map, midRow, midCol);

  addBuilding(map, midCol - 12, midRow - 11, 10, 8, 0, 'wood');
  addBuilding(map, midCol + 4, midRow - 12, 9, 8, 0, 'brick');
  addBuilding(map, midCol - 18, midRow + 2, 11, 8, 1, 'brick');
  addBuilding(map, midCol + 8, midRow + 3, 10, 8, -1, 'wood');

  addFencedGarden(map, midCol - 22, midRow + 12, 12, 8, -1);
  addFencedGarden(map, midCol + 12, midRow + 13, 11, 8, 1);
  fillRect(map, midCol - 4, midRow + 13, 8, 6, VILLAGE_TILES.dirtPacked);

  scatterVillageDetails(map, midRow, midCol);

  const spawns: AgentSpawn[] = [
    {
      kind: 'npc',
      tileX: midCol - 2,
      tileY: midRow,
      facing: 1,
      tags: ['villager']
    },
    {
      kind: 'npc',
      tileX: midCol + 8,
      tileY: midRow - 1,
      facing: 2,
      tags: ['scout']
    },
    {
      kind: 'enemy',
      tileX: 14,
      tileY: midRow + 4,
      waypoints: [
        { tileX: 14, tileY: midRow + 4 },
        { tileX: 6, tileY: midRow + 10 },
        { tileX: 20, tileY: midRow + 8 }
      ],
      pauseDurationMs: 480,
      speedTilesPerSecond: 3,
      tags: ['slime']
    },
    {
      kind: 'enemy',
      tileX: midCol + 18,
      tileY: 12,
      waypoints: [
        { tileX: midCol + 18, tileY: 12 },
        { tileX: midCol + 18, tileY: 6 },
        { tileX: midCol + 10, tileY: 12 }
      ],
      pauseDurationMs: 520,
      tags: ['bat']
    }
  ];

  const items: ItemSpawn[] = [
    { itemId: 'coin', tileX: midCol, tileY: midRow + 2 },
    { itemId: 'heart', tileX: midCol + 3, tileY: midRow + 3 },
    { itemId: 'sword', tileX: midCol - 6, tileY: midRow - 4 }
  ];

  return {
    id: 'level-1',
    levelName: 'Verdant Lowlands',
    musicKey: 'overworld',
    nextLevelId: 'level-2',
    width,
    height,
    terrain: 'grass',
    tiles: map.flat(),
    spawns,
    items
  };
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

const grassLevel = createGrasslandLevel();

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

export const LEVELS: LevelData[] = [grassLevel, castleLevel];

export const LEVELS_BY_ID: Record<string, LevelData> = LEVELS.reduce(
  (acc, level) => ({ ...acc, [level.id]: level }),
  {} as Record<string, LevelData>
);

export const DEFAULT_LEVEL_ID = grassLevel.id;
