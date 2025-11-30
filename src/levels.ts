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

const GRASS_TILES = {
  grassLight: 0,
  grassDark: 1,
  sand: 2,
  sandGrass: 3,
  dirt: 4,
  water: 5,
  borderedGrass: 6,
  sandGrassAlt: 7,
  path: 8,
  dirtGrass: 9,
  bush: 10,
  bushAlt: 11,
  tree: 12,
  pathAlt: 13,
  sandGrassBlend: 14,
  rock: 15,
  rockAlt: 16,
  rockCluster: 17,
  rockWide: 18,
  rockTall: 19,
  treeAlt: 20,
  treeDense: 21,
  fence: 22,
  shrub: 23,
  chest: 24
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

function createGrassBase(width: number, height: number): number[][] {
  const grassVariants = [GRASS_TILES.grassLight, GRASS_TILES.grassDark, GRASS_TILES.borderedGrass];

  return Array.from({ length: height }, (_, row) =>
    Array.from({ length: width }, (_, col) => grassVariants[(row + col * 2) % grassVariants.length])
  );
}

function placePerimeterTrees(map: number[][]): void {
  const rows = map.length;
  const cols = map[0].length;
  const treeVariants = [GRASS_TILES.tree, GRASS_TILES.treeAlt, GRASS_TILES.treeDense];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const isEdge = row === 0 || col === 0 || row === rows - 1 || col === cols - 1;
      const isInnerRing = row === 1 || col === 1 || row === rows - 2 || col === cols - 2;

      if (isEdge || (isInnerRing && (row + col) % 3 !== 0)) {
        map[row][col] = treeVariants[(row + col) % treeVariants.length];
      }
    }
  }
}

function addWaterFeature(map: number[][], startX: number, startY: number, width: number, height: number): void {
  fillRect(map, startX, startY, width, height, GRASS_TILES.water);
  fillRect(map, startX - 1, startY + 1, width + 2, 1, GRASS_TILES.sandGrassBlend);
  fillRect(map, startX + 1, startY + height, width - 2, 1, GRASS_TILES.sandGrass);
}

function addRiverWithBridges(map: number[][]): void {
  const rows = map.length;
  const riverStartX = 10;
  let riverX = riverStartX;

  for (let row = 3; row < rows - 3; row += 1) {
    const bend = row % 9 === 0 ? -1 : row % 7 === 0 ? 1 : 0;
    riverX = Math.max(8, Math.min(riverX + bend, 14));

    fillRect(map, riverX, row, 4, 1, GRASS_TILES.water);
    map[row][riverX - 1] = GRASS_TILES.sandGrassAlt;
    map[row][riverX + 4] = GRASS_TILES.sandGrass;
  }

  const bridges = [18, 30];
  bridges.forEach((bridgeRow) => {
    for (let col = riverStartX - 1; col <= riverStartX + 5; col += 1) {
      map[bridgeRow][col] = GRASS_TILES.path;
    }
  });
}

function addRockGarden(map: number[][], startX: number, startY: number, width: number, height: number): void {
  for (let row = startY; row < startY + height; row += 1) {
    for (let col = startX; col < startX + width; col += 1) {
      const checker = (row + col) % 4;
      if (checker === 0) map[row][col] = GRASS_TILES.rock;
      if (checker === 1) map[row][col] = GRASS_TILES.rockAlt;
      if (checker === 2) map[row][col] = GRASS_TILES.rockCluster;
    }
  }
}

function addTownBuilding(map: number[][], startX: number, startY: number, width: number, height: number, doorOffset = 0): void {
  const wallTile = GRASS_TILES.rockWide;
  fillRect(map, startX, startY, width, height, GRASS_TILES.dirtGrass);
  fillRect(map, startX, startY, width, 1, wallTile);
  fillRect(map, startX, startY + height - 1, width, 1, wallTile);
  fillRect(map, startX, startY, 1, height, wallTile);
  fillRect(map, startX + width - 1, startY, 1, height, wallTile);

  const doorX = startX + Math.floor(width / 2) + doorOffset;
  const doorY = startY + height - 1;
  map[doorY][doorX] = GRASS_TILES.path;
  map[doorY - 1][doorX] = GRASS_TILES.path;
}

function addOrchard(map: number[][], startX: number, startY: number, rows: number, cols: number): void {
  const spacing = 3;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const x = startX + c * spacing;
      const y = startY + r * spacing;
      map[y][x] = (r + c) % 2 === 0 ? GRASS_TILES.tree : GRASS_TILES.treeAlt;
      map[y + 1][x] = GRASS_TILES.shrub;
    }
  }
}

function addFields(map: number[][], startX: number, startY: number, width: number, height: number): void {
  for (let row = 0; row < height; row += 1) {
    const tile = row % 2 === 0 ? GRASS_TILES.dirt : GRASS_TILES.dirtGrass;
    drawHorizontalPath(map, startY + row, startX, startX + width - 1, tile);
  }
}

function createGrasslandLevel(): LevelData {
  const width = 64;
  const height = 48;
  const map = createGrassBase(width, height);

  placePerimeterTrees(map);
  addRiverWithBridges(map);
  addWaterFeature(map, width - 16, 6, 9, 6);
  addWaterFeature(map, 6, height - 14, 7, 5);

  // Main roads linking the plaza to every edge
  const midRow = Math.floor(height / 2);
  const midCol = Math.floor(width / 2);
  drawHorizontalPath(map, midRow, 6, width - 7, GRASS_TILES.path);
  drawHorizontalPath(map, midRow + 1, 6, width - 7, GRASS_TILES.dirtGrass);
  drawVerticalPath(map, midCol, 6, height - 7, GRASS_TILES.path);
  drawVerticalPath(map, midCol + 1, 6, height - 7, GRASS_TILES.dirt);

  // Plaza and quest center
  fillRect(map, midCol - 7, midRow - 6, 15, 13, GRASS_TILES.dirtGrass);
  fillRect(map, midCol - 6, midRow - 5, 13, 11, GRASS_TILES.path);
  addTownBuilding(map, midCol - 4, midRow - 8, 9, 6);
  addTownBuilding(map, midCol - 13, midRow - 2, 8, 6, -1);
  addTownBuilding(map, midCol + 6, midRow - 2, 8, 6, 1);

  // Market stalls and notice board
  map[midRow][midCol] = GRASS_TILES.chest;
  map[midRow - 1][midCol - 2] = GRASS_TILES.bush;
  map[midRow - 1][midCol + 2] = GRASS_TILES.bushAlt;

  // Agricultural belt south of town
  addFields(map, midCol - 12, midRow + 6, 24, 8);
  addOrchard(map, midCol + 14, midRow + 7, 3, 3);
  addOrchard(map, midCol - 20, midRow + 7, 3, 3);

  // Training yard and ruins to explore
  fillRect(map, midCol + 15, midRow - 10, 12, 8, GRASS_TILES.sandGrass);
  addRockGarden(map, midCol + 15, midRow - 10, 12, 8);
  fillRect(map, midCol - 25, midRow - 14, 10, 6, GRASS_TILES.sandGrassBlend);
  addRockGarden(map, midCol - 25, midRow - 14, 10, 6);

  // Wild groves guarding the outskirts
  addOrchard(map, 20, 8, 2, 3);
  addOrchard(map, width - 26, 10, 2, 3);

  // Reinforce the river banks with footpaths
  drawHorizontalPath(map, 18, 6, 18, GRASS_TILES.path);
  drawHorizontalPath(map, 30, 6, 18, GRASS_TILES.path);

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
    { itemId: 'coin', tileX: midCol, tileY: midRow },
    { itemId: 'heart', tileX: midCol + 3, tileY: midRow + 2 },
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
    waterTile: 20,
    pitTile: 23
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
