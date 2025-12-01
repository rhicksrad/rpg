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
  const width = 400;
  const height = 300;
  const overworld = createOverworldBase(width, height);
  const structures = createOverworldStructures(width, height);
  const collision = combineLayerTiles([overworld, structures]);

  const midRow = Math.floor(height / 2);
  const midCol = Math.floor(width / 2);

  const questEntrances = {
    echoingDepths: { x: midCol - 6, y: midRow + 90 },
    timberTunnels: { x: midCol - 70, y: midRow - 92 },
    riverHollow: { x: midCol + 110, y: midRow - 6 }
  } as const;

  const spawns: AgentSpawn[] = [
    { kind: 'npc', tileX: midCol - 18, tileY: midRow + 4, facing: 1, tags: ['villager'] },
    { kind: 'npc', tileX: midCol - 8, tileY: midRow - 6, facing: 2, tags: ['scout'] },
    { kind: 'npc', tileX: midCol + 14, tileY: midRow + 14, facing: 2, tags: ['merchant'], spriteIndex: 8 },
    {
      kind: 'npc',
      tileX: midCol + 10,
      tileY: midRow - 14,
      facing: 2,
      spriteIndex: 12,
      tags: ['quest-giver', 'old-man']
    },
    { kind: 'npc', tileX: midCol - 24, tileY: midRow + 18, facing: 1, tags: ['villager'], spriteIndex: 9 },
    // Echoing Depths approach
    {
      kind: 'enemy',
      tileX: questEntrances.echoingDepths.x - 8,
      tileY: questEntrances.echoingDepths.y + 6,
      waypoints: [
        { tileX: questEntrances.echoingDepths.x - 8, tileY: questEntrances.echoingDepths.y + 6 },
        { tileX: questEntrances.echoingDepths.x - 2, tileY: questEntrances.echoingDepths.y + 12 },
        { tileX: questEntrances.echoingDepths.x + 6, tileY: questEntrances.echoingDepths.y + 8 }
      ],
      pauseDurationMs: 420,
      speedTilesPerSecond: 3.6,
      tags: ['slime']
    },
    {
      kind: 'enemy',
      tileX: questEntrances.echoingDepths.x + 10,
      tileY: questEntrances.echoingDepths.y + 2,
      tags: ['bat'],
      speedTilesPerSecond: 4,
      drops: ['coin']
    },
    // Timber Tunnels approach
    {
      kind: 'enemy',
      tileX: questEntrances.timberTunnels.x - 10,
      tileY: questEntrances.timberTunnels.y - 10,
      waypoints: [
        { tileX: questEntrances.timberTunnels.x - 10, tileY: questEntrances.timberTunnels.y - 10 },
        { tileX: questEntrances.timberTunnels.x - 4, tileY: questEntrances.timberTunnels.y - 4 },
        { tileX: questEntrances.timberTunnels.x + 6, tileY: questEntrances.timberTunnels.y - 8 }
      ],
      speedTilesPerSecond: 4.2,
      tags: ['pickaxer'],
      attackDamage: 3
    },
    {
      kind: 'enemy',
      tileX: questEntrances.timberTunnels.x + 12,
      tileY: questEntrances.timberTunnels.y - 6,
      tags: ['warden', 'boss'],
      health: 32,
      attackDamage: 5,
      detectionRangeTiles: 8,
      attackRangeTiles: 1.35,
      drops: ['gear-sash', 'coin-pouch']
    },
    // River Hollow approach
    {
      kind: 'enemy',
      tileX: questEntrances.riverHollow.x + 10,
      tileY: questEntrances.riverHollow.y + 12,
      waypoints: [
        { tileX: questEntrances.riverHollow.x + 10, tileY: questEntrances.riverHollow.y + 12 },
        { tileX: questEntrances.riverHollow.x + 16, tileY: questEntrances.riverHollow.y + 6 },
        { tileX: questEntrances.riverHollow.x + 4, tileY: questEntrances.riverHollow.y + 6 }
      ],
      attackDamage: 2,
      speedTilesPerSecond: 4.4,
      tags: ['wisp']
    },
    {
      kind: 'enemy',
      tileX: questEntrances.riverHollow.x + 2,
      tileY: questEntrances.riverHollow.y - 12,
      tags: ['bog', 'boss'],
      health: 30,
      attackDamage: 4,
      detectionRangeTiles: 7,
      speedTilesPerSecond: 4.2,
      drops: ['creek-pearl']
    }
  ];

  const items: ItemSpawn[] = [
    { itemId: 'coin', tileX: midCol - 12, tileY: midRow + 10 },
    { itemId: 'heart', tileX: midCol + 6, tileY: midRow + 6 },
    { itemId: 'sword', tileX: midCol - 30, tileY: midRow - 12 },
    { itemId: 'lantern-oil', tileX: questEntrances.timberTunnels.x - 2, tileY: questEntrances.timberTunnels.y - 14 },
    { itemId: 'warmth-salve', tileX: questEntrances.riverHollow.x + 14, tileY: questEntrances.riverHollow.y + 4 },
    { itemId: 'potion', tileX: questEntrances.echoingDepths.x + 4, tileY: questEntrances.echoingDepths.y + 10 }
  ];

  const chests: ChestSpawn[] = [
    { id: 'plaza-cache', tileX: midCol + 4, tileY: midRow + 16, coins: 24, itemId: 'potion' },
    { id: 'northern-stash', tileX: questEntrances.timberTunnels.x + 6, tileY: questEntrances.timberTunnels.y - 2, coins: 28 },
    { id: 'western-rations', tileX: questEntrances.echoingDepths.x - 6, tileY: questEntrances.echoingDepths.y + 4, coins: 16 },
    { id: 'creek-satchel', tileX: questEntrances.riverHollow.x + 8, tileY: questEntrances.riverHollow.y + 14, coins: 18, itemId: 'gear-sash' }
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
      const noise = (row * 17 + col * 13) % 23;
      if (noise === 0) return VILLAGE_TILES.grassAlt;
      if (noise === 1) return VILLAGE_TILES.grassAlt;
      if (noise === 2) return VILLAGE_TILES.bush;
      if (noise === 3) return VILLAGE_TILES.bushAlt;
      return VILLAGE_TILES.grass;
    })
  );

  fillRect(map, 0, 0, width, 4, OVERWORLD_TILES.darkRock);
  fillRect(map, 0, height - 4, width, 4, OVERWORLD_TILES.darkRock);
  fillRect(map, 0, 0, 4, height, OVERWORLD_TILES.darkRock);
  fillRect(map, width - 4, 0, 4, height, OVERWORLD_TILES.darkRock);

  const addWaterPocket = (cx: number, cy: number, radius: number): void => {
    for (let row = Math.max(0, cy - radius); row < Math.min(height, cy + radius); row += 1) {
      for (let col = Math.max(0, cx - radius); col < Math.min(width, cx + radius); col += 1) {
        const distance = Math.sqrt((row - cy) ** 2 + (col - cx) ** 2);
        if (distance < radius) {
          map[row][col] = distance < radius - 1 ? 27 : 25;
        }
      }
    }
  };

  const carveRiver = (points: { x: number; y: number }[], baseWidth: number): void => {
    for (let i = 0; i < points.length - 1; i += 1) {
      const start = points[i];
      const end = points[i + 1];
      const steps = Math.max(Math.abs(end.x - start.x), Math.abs(end.y - start.y));
      for (let step = 0; step <= steps; step += 1) {
        const t = steps === 0 ? 0 : step / steps;
        const x = Math.round(start.x + (end.x - start.x) * t);
        const y = Math.round(start.y + (end.y - start.y) * t);
        const wobble = ((x * 7 + y * 13) % 3) - 1;
        const widthOffset = (step % 5) - 2;
        const riverWidth = baseWidth + wobble;
        addWaterPocket(x + widthOffset, y, riverWidth);
      }
    }
  };

  carveRiver(
    [
      { x: 30, y: 40 },
      { x: Math.floor(width * 0.28), y: Math.floor(height * 0.32) },
      { x: Math.floor(width * 0.48), y: Math.floor(height * 0.55) },
      { x: Math.floor(width * 0.72), y: Math.floor(height * 0.62) },
      { x: width - 18, y: height - 30 }
    ],
    4
  );

  addWaterPocket(Math.floor(width * 0.3), Math.floor(height * 0.65), 10);
  addWaterPocket(Math.floor(width * 0.7), Math.floor(height * 0.28), 12);
  addWaterPocket(Math.floor(width * 0.52), Math.floor(height * 0.42), 8);

  const sprinkleWildflowers = (): void => {
    for (let row = 0; row < height; row += 1) {
      for (let col = 0; col < width; col += 1) {
        const hash = (row * 31 + col * 17 + (row % 7) * (col % 5)) % 97;
        if (map[row][col] === VILLAGE_TILES.grass && hash === 0) {
          map[row][col] = VILLAGE_TILES.grassAlt;
        }
      }
    }
  };

  const midRow = Math.floor(height / 2);
  const midCol = Math.floor(width / 2);

  const clearings = [
    { x: midCol, y: midRow, w: 70, h: 56 },
    { x: midCol - 70, y: midRow - 92, w: 50, h: 36 },
    { x: midCol + 110, y: midRow - 6, w: 56, h: 42 },
    { x: midCol - 6, y: midRow + 90, w: 52, h: 44 }
  ];

  clearings.forEach(({ x, y, w, h }) => {
    fillRect(map, x - Math.floor(w / 2), y - Math.floor(h / 2), w, h, VILLAGE_TILES.grassAlt);
  });

  sprinkleWildflowers();

  for (let row = 12; row < height - 12; row += 11) {
    for (let col = 10; col < width - 10; col += 14) {
      if ((row + col) % 9 === 0) {
        map[row][col] = OVERWORLD_TILES.rockRidge;
      } else if ((row + col) % 11 === 0) {
        map[row][col] = OVERWORLD_TILES.mossyRock;
      }
    }
  }

  return map;
}

function createOverworldStructures(width: number, height: number): number[][] {
  const map = Array.from({ length: height }, () => Array.from({ length: width }, () => -1));
  const midRow = Math.floor(height / 2);
  const midCol = Math.floor(width / 2);

  const plazaWidth = 38;
  const plazaHeight = 30;
  const plazaStartX = midCol - Math.floor(plazaWidth / 2);
  const plazaStartY = midRow - Math.floor(plazaHeight / 2);

  fillRect(map, plazaStartX, plazaStartY, plazaWidth, plazaHeight, VILLAGE_TILES.grassAlt);
  fillRect(map, plazaStartX + 2, plazaStartY + 2, plazaWidth - 4, plazaHeight - 4, VILLAGE_TILES.gravel);
  fillRect(map, plazaStartX + 6, plazaStartY + 5, plazaWidth - 12, plazaHeight - 10, VILLAGE_TILES.grassAlt);
  fillRect(map, plazaStartX + 14, plazaStartY + 10, plazaWidth - 28, plazaHeight - 20, VILLAGE_TILES.grass);
  map[midRow][midCol] = VILLAGE_TILES.well;

  const decorateTownPond = (): void => {
    fillRect(map, midCol - 8, midRow + 10, 16, 10, 27);
    map[midRow + 8][midCol - 10] = VILLAGE_TILES.sign;
    map[midRow + 8][midCol + 10] = VILLAGE_TILES.sign;
  };

  decorateTownPond();

  const pathTile = OVERWORLD_TILES.path;
  const stoneMarker = OVERWORLD_TILES.brightStone;

  drawHorizontalPath(map, midRow, 6, width - 7, pathTile);
  drawVerticalPath(map, midCol, 6, height - 7, pathTile);
  drawHorizontalPath(map, midRow - 12, midCol - 80, midCol + 80, stoneMarker);
  drawVerticalPath(map, midCol + 32, midRow - 64, midRow + 96, stoneMarker);

  const addBridge = (x: number, y: number): void => {
    fillRect(map, x - 2, y - 1, 4, 3, OVERWORLD_TILES.brightStone);
  };

  addBridge(Math.floor(width * 0.48), Math.floor(height * 0.55));
  addBridge(Math.floor(width * 0.3), Math.floor(height * 0.65));
  addBridge(Math.floor(width * 0.7), Math.floor(height * 0.28));

  const placeBuilding = (
    startX: number,
    startY: number,
    widthTiles: number,
    heightTiles: number,
    doorOffset: number,
    style: 'wood' | 'brick',
    signOffsetX: number,
    signOffsetY: number
  ): void => {
    addBuilding(map, startX, startY, widthTiles, heightTiles, doorOffset, style);
    const signX = startX + Math.floor(widthTiles / 2) + signOffsetX;
    const signY = startY + heightTiles + signOffsetY;
    if (map[signY]?.[signX] !== undefined) {
      map[signY][signX] = VILLAGE_TILES.sign;
    }
  };

  placeBuilding(midCol - 22, midRow - 16, 16, 12, 0, 'brick', 0, 1);
  placeBuilding(midCol + 6, midRow - 18, 18, 14, 0, 'wood', -2, 1);
  placeBuilding(midCol - 28, midRow + 10, 15, 11, 1, 'wood', -1, 1);
  placeBuilding(midCol + 16, midRow + 9, 14, 11, -1, 'brick', 1, 1);

  fillRect(map, midCol - 8, midRow - 34, 16, 10, VILLAGE_TILES.dirtPacked);
  fillRect(map, midCol - 10, midRow - 36, 20, 2, VILLAGE_TILES.fence);
  map[midRow - 34][midCol] = VILLAGE_TILES.doorAlt;

  scatterVillageDetails(map, midRow, midCol);

  const questEntrances = [
    { x: midCol - 6, y: midRow + 90, labelLeft: true },
    { x: midCol - 70, y: midRow - 92, labelLeft: false },
    { x: midCol + 110, y: midRow - 6, labelLeft: false }
  ];

  questEntrances.forEach(({ x, y, labelLeft }) => {
    fillRect(map, x - 3, y - 2, 7, 5, VILLAGE_TILES.dirtPacked);
    fillRect(map, x - 2, y - 1, 5, 4, VILLAGE_TILES.gravel);
    map[y - 2][labelLeft ? x - 2 : x + 2] = VILLAGE_TILES.sign;
    map[y - 1][x] = VILLAGE_TILES.doorAlt;
    map[y + 1][x] = VILLAGE_TILES.pathEdgeV;
  });

  drawVerticalPath(map, midCol - 6, midRow + 16, midRow + 90, VILLAGE_TILES.gravel);
  drawHorizontalPath(map, midRow + 90, midCol - 26, midCol + 14, VILLAGE_TILES.gravel);

  drawVerticalPath(map, midCol - 70, midRow - 60, midRow - 92, VILLAGE_TILES.gravel);
  drawHorizontalPath(map, midRow - 60, midCol - 90, midCol - 50, VILLAGE_TILES.gravel);

  drawHorizontalPath(map, midRow - 6, midCol + 16, midCol + 110, VILLAGE_TILES.gravel);
  drawVerticalPath(map, midCol + 110, midRow - 28, midRow + 12, VILLAGE_TILES.gravel);

  return map;
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
