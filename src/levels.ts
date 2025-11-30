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
};

const GRASS_TILES = {
  grass: 0,
  flower: 2,
  path: 9,
  accent: 24,
  wall: 18,
  water: 22,
  pit: 27,
  orchard: 29,
  crops: 26,
  tree: 11
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function createGrid(width: number, height: number, fill: number): number[][] {
  return Array.from({ length: height }, () => Array.from({ length: width }, () => fill));
}

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

function addBorder(map: number[][], tile: number): void {
  const rows = map.length;
  const cols = map[0].length;

  for (let row = 0; row < rows; row += 1) {
    map[row][0] = tile;
    map[row][cols - 1] = tile;
  }

  for (let col = 0; col < cols; col += 1) {
    map[0][col] = tile;
    map[rows - 1][col] = tile;
  }
}

function scatterDecor(map: number[][]): void {
  const rows = map.length;
  const cols = map[0].length;

  for (let row = 1; row < rows - 1; row += 1) {
    for (let col = 1; col < cols - 1; col += 1) {
      if ((row * 3 + col * 7) % 23 === 0) {
        map[row][col] = GRASS_TILES.flower;
      } else if ((row + col * 11) % 41 === 0) {
        map[row][col] = GRASS_TILES.accent;
      }
    }
  }
}

function carveRiver(map: number[][]): { start: number; end: number }[] {
  const rows = map.length;
  const cols = map[0].length;
  const spans: { start: number; end: number }[] = Array.from({ length: rows }, () => ({ start: 0, end: 0 }));

  let riverCenter = Math.floor(cols * 0.22);

  for (let row = 1; row < rows - 1; row += 1) {
    const riverWidth = 3 + (row % 7 === 0 ? 1 : 0) + (row % 13 === 0 ? 1 : 0);
    const start = clamp(riverCenter - 1, 1, cols - 4);
    const end = clamp(start + riverWidth, 2, cols - 3);

    for (let col = start; col <= end; col += 1) {
      map[row][col] = GRASS_TILES.water;
    }

    spans[row] = { start, end };

    if (row % 6 === 0) {
      riverCenter += 1;
    } else if (row % 5 === 0) {
      riverCenter -= 1;
    }

    riverCenter = clamp(riverCenter, 4, cols - 6);
  }

  return spans;
}

function addBridges(map: number[][], riverSpans: { start: number; end: number }[], rows: number[]): void {
  rows.forEach((bridgeRow) => {
    const span = riverSpans[bridgeRow];
    if (!span) return;

    for (let col = span.start; col <= span.end; col += 1) {
      map[bridgeRow][col] = GRASS_TILES.path;
    }
  });
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

function placeTown(
  map: number[][],
  originX: number,
  originY: number,
  width: number,
  height: number,
  { addFieldsBelow = true }: { addFieldsBelow?: boolean } = {}
): void {
  fillRect(map, originX, originY, width, height, GRASS_TILES.path);
  fillRect(map, originX + 1, originY + 1, width - 2, height - 2, GRASS_TILES.accent);

  // Houses
  fillRect(map, originX + 1, originY + 1, 3, 2, GRASS_TILES.wall);
  fillRect(map, originX + width - 4, originY + height - 3, 3, 2, GRASS_TILES.wall);
  fillRect(map, originX + Math.floor(width / 2) - 1, originY + 1, 3, 2, GRASS_TILES.wall);

  // Centerpiece
  map[originY + Math.floor(height / 2)][originX + Math.floor(width / 2)] = GRASS_TILES.tree;

  if (addFieldsBelow) {
    fillRect(map, originX - 1, originY + height, width + 2, 4, GRASS_TILES.crops);
    fillRect(map, originX + width + 1, originY + height - 1, 4, 3, GRASS_TILES.orchard);
  }
}

function addFields(map: number[][], startX: number, startY: number, width: number, height: number): void {
  for (let row = 0; row < height; row += 1) {
    const tile = row % 2 === 0 ? GRASS_TILES.crops : GRASS_TILES.orchard;
    drawHorizontalPath(map, startY + row, startX, startX + width - 1, tile);
  }
}

function addLakes(map: number[][]): void {
  fillRect(map, map[0].length - 18, 4, 10, 6, GRASS_TILES.water);
  fillRect(map, map[0].length - 16, 8, 6, 4, GRASS_TILES.water);
  fillRect(map, 6, map.length - 12, 8, 5, GRASS_TILES.water);
}

function createGrasslandLevel(): LevelData {
  const width = 64;
  const height = 48;
  const map = createGrid(width, height, GRASS_TILES.grass);

  scatterDecor(map);
  addBorder(map, GRASS_TILES.wall);

  const riverSpans = carveRiver(map);
  addBridges(map, riverSpans, [12, 28, 40]);

  const midRow = Math.floor(height / 2);
  drawHorizontalPath(map, midRow, 2, width - 3, GRASS_TILES.path);
  drawHorizontalPath(map, 10, 3, width - 4, GRASS_TILES.path);
  drawVerticalPath(map, Math.floor(width / 2), 2, height - 3, GRASS_TILES.path);
  drawVerticalPath(map, 8, 3, height - 4, GRASS_TILES.path);

  placeTown(map, 12, 13, 14, 10);
  placeTown(map, 40, 30, 16, 11, { addFieldsBelow: false });

  addFields(map, 20, midRow + 2, 18, 6);
  addFields(map, width - 26, midRow - 10, 20, 6);

  addLakes(map);

  return {
    id: 'level-1',
    levelName: 'Verdant Lowlands',
    musicKey: 'overworld',
    nextLevelId: 'level-2',
    width,
    height,
    terrain: 'grass',
    tiles: map.flat()
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
  })
};

export const LEVELS: LevelData[] = [grassLevel, castleLevel];

export const LEVELS_BY_ID: Record<string, LevelData> = LEVELS.reduce(
  (acc, level) => ({ ...acc, [level.id]: level }),
  {} as Record<string, LevelData>
);

export const DEFAULT_LEVEL_ID = grassLevel.id;
