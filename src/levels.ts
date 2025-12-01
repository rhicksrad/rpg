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
      const noise = (row * 17 + col * 13) % 29;
      if (noise === 0 || noise === 1) return OVERWORLD_TILES.grassAlt;
      if (noise === 2) return OVERWORLD_TILES.path;
      if (noise === 3) return OVERWORLD_TILES.rockRidge;
      return OVERWORLD_TILES.grass;
    })
  );

  fillRect(map, 0, 0, width, 4, OVERWORLD_TILES.darkRock);
  fillRect(map, 0, height - 4, width, 4, OVERWORLD_TILES.darkRock);
  fillRect(map, 0, 0, 4, height, OVERWORLD_TILES.darkRock);
  fillRect(map, width - 4, 0, 4, height, OVERWORLD_TILES.darkRock);

  fillRect(map, 4, 4, width - 8, 1, OVERWORLD_TILES.rockRidge);
  fillRect(map, 4, height - 5, width - 8, 1, OVERWORLD_TILES.rockRidge);
  fillRect(map, 4, 4, 1, height - 8, OVERWORLD_TILES.rockRidge);
  fillRect(map, width - 5, 4, 1, height - 8, OVERWORLD_TILES.rockRidge);

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
        if (map[row][col] === OVERWORLD_TILES.grass && hash === 0) {
          map[row][col] = OVERWORLD_TILES.grassAlt;
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
    const startX = x - Math.floor(w / 2);
    const startY = y - Math.floor(h / 2);
    fillRect(map, startX, startY, w, h, OVERWORLD_TILES.grassAlt);
    fillRect(map, startX - 2, startY - 2, w + 4, 1, OVERWORLD_TILES.rockRidge);
    fillRect(map, startX - 2, startY + h + 1, w + 4, 1, OVERWORLD_TILES.rockRidge);
    fillRect(map, startX - 2, startY - 1, 1, h + 2, OVERWORLD_TILES.rockRidge);
    fillRect(map, startX + w + 1, startY - 1, 1, h + 2, OVERWORLD_TILES.rockRidge);
    map[startY - 1][x] = OVERWORLD_TILES.brightStone;
  });

  sprinkleWildflowers();

  const connectPaths = (points: { x: number; y: number }[]): void => {
    for (let i = 0; i < points.length - 1; i += 1) {
      const start = points[i];
      const end = points[i + 1];
      const steps = Math.max(Math.abs(end.x - start.x), Math.abs(end.y - start.y));
      for (let step = 0; step <= steps; step += 1) {
        const t = steps === 0 ? 0 : step / steps;
        const x = Math.round(start.x + (end.x - start.x) * t);
        const y = Math.round(start.y + (end.y - start.y) * t);
        const wobble = ((x * 11 + y * 5 + step) % 3) - 1;
        const variant = (step + x + y) % 7 === 0 ? OVERWORLD_TILES.brightStone : OVERWORLD_TILES.path;
        map[Math.min(height - 1, Math.max(0, y + wobble))][x] = variant;
      }
    }
  };

  connectPaths([
    { x: 8, y: midRow },
    { x: midCol - 80, y: midRow - 92 },
    { x: midCol, y: midRow },
    { x: midCol + 110, y: midRow - 6 },
    { x: width - 8, y: midRow - 12 }
  ]);
  connectPaths([
    { x: midCol - 40, y: 10 },
    { x: midCol - 6, y: midRow + 90 },
    { x: midCol + 32, y: height - 10 }
  ]);

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
  fillRect(map, plazaStartX - 2, plazaStartY - 2, plazaWidth + 4, 1, OVERWORLD_TILES.rockRidge);
  fillRect(map, plazaStartX - 2, plazaStartY + plazaHeight + 1, plazaWidth + 4, 1, OVERWORLD_TILES.rockRidge);
  fillRect(map, plazaStartX - 2, plazaStartY - 1, 1, plazaHeight + 2, OVERWORLD_TILES.rockRidge);
  fillRect(map, plazaStartX + plazaWidth + 1, plazaStartY - 1, 1, plazaHeight + 2, OVERWORLD_TILES.rockRidge);
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
  drawHorizontalPath(map, midRow - 1, 8, width - 9, stoneMarker);
  drawVerticalPath(map, midCol + 1, 8, height - 9, stoneMarker);
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
    map[y - 3][x] = OVERWORLD_TILES.brightStone;
    map[y + 2][x] = OVERWORLD_TILES.rockRidge;
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
  const base: number[][] = Array.from({ length: height }, () => Array.from({ length: width }, () => 21));
  const overlay: number[][] = Array.from({ length: height }, () => Array.from({ length: width }, () => -1));

  fillRect(base, 0, 0, width, 1, 19);
  fillRect(base, 0, height - 1, width, 1, 19);
  fillRect(base, 0, 0, 1, height, 19);
  fillRect(base, width - 1, 0, 1, height, 19);

  // Irregular chambers connected by chokepoints.
  fillRect(base, 3, 3, 14, 7, 14); // northern study
  fillRect(base, 18, 6, 10, 6, 22); // vent nexus floor
  fillRect(base, 7, 15, 20, 9, 14); // flooded promenade
  fillRect(base, 26, 10, 9, 11, 23); // brood roost
  fillRect(base, 14, 8, 4, 3, 14); // narrow throat into vents
  fillRect(base, 20, 12, 3, 7, 14); // choke leading to lower hall
  fillRect(base, 24, 17, 5, 3, 14); // boss approach channel

  // Hazards and varied castle flooring.
  fillRect(base, 12, 5, 5, 2, 25); // dripping channel
  fillRect(base, 6, 12, 4, 2, 27); // shallow vents near stairs
  fillRect(base, 19, 8, 4, 2, 28); // echo pulse vents
  fillRect(base, 9, 17, 6, 3, 27); // cleansing pools
  fillRect(base, 22, 15, 5, 3, 25); // cold water pockets
  fillRect(base, 28, 12, 4, 2, 24); // slick entry tiles

  // Cover clustered near vents and flanking routes.
  const coverPillars = [
    { x: 18, y: 9 },
    { x: 22, y: 9 },
    { x: 18, y: 14 },
    { x: 22, y: 14 },
    { x: 11, y: 17 },
    { x: 15, y: 17 },
    { x: 12, y: 20 },
    { x: 24, y: 16 },
    { x: 27, y: 16 }
  ];
  coverPillars.forEach(({ x, y }) => {
    base[y][x] = 18;
  });

  // Accent overlays for glow crystals and trims.
  const crystalClusters = [
    { x: 8, y: 6 },
    { x: 30, y: 11 },
    { x: 13, y: 19 },
    { x: 27, y: 21 }
  ];
  crystalClusters.forEach(({ x, y }) => {
    overlay[y][x] = 15;
  });
  for (let col = 5; col < width - 5; col += 4) {
    overlay[4][col] = 16;
    overlay[height - 5][col] = 16;
  }

  const spawns: AgentSpawn[] = [
    {
      kind: 'enemy',
      tileX: 10,
      tileY: 6,
      waypoints: [
        { tileX: 10, tileY: 6 },
        { tileX: 13, tileY: 6 },
        { tileX: 12, tileY: 9 }
      ],
      speedTilesPerSecond: 4.5,
      tags: ['bat'],
      drops: ['glow-crystal', 'coin']
    },
    {
      kind: 'enemy',
      tileX: 21,
      tileY: 10,
      waypoints: [
        { tileX: 21, tileY: 10 },
        { tileX: 24, tileY: 10 },
        { tileX: 21, tileY: 13 }
      ],
      tags: ['bat'],
      speedTilesPerSecond: 4.5,
      drops: ['coin']
    },
    {
      kind: 'enemy',
      tileX: 13,
      tileY: 19,
      waypoints: [
        { tileX: 13, tileY: 19 },
        { tileX: 10, tileY: 21 },
        { tileX: 17, tileY: 20 }
      ],
      tags: ['slime'],
      health: 10,
      drops: ['slime-gel']
    },
    {
      kind: 'enemy',
      tileX: 25,
      tileY: 17,
      waypoints: [
        { tileX: 25, tileY: 17 },
        { tileX: 28, tileY: 17 },
        { tileX: 26, tileY: 20 }
      ],
      tags: ['rat'],
      speedTilesPerSecond: 5,
      drops: ['coin']
    },
    {
      kind: 'enemy',
      tileX: 29,
      tileY: 15,
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
    { itemId: 'glow-crystal', tileX: 8, tileY: 6 },
    { itemId: 'glow-crystal', tileX: 27, tileY: 21 },
    { itemId: 'lantern-polish', tileX: 16, tileY: 22 }
  ];

  return {
    id: 'echoing-depths',
    levelName: 'Echoing Depths',
    musicKey: 'dungeon',
    nextLevelId: 'timber-tunnels',
    width,
    height,
    terrain: 'castle',
    tiles: base.flat(),
    layers: [
      { terrain: 'castle', tiles: base.flat() },
      { terrain: 'castle', tiles: overlay.flat() }
    ],
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
  const base: number[][] = Array.from({ length: height }, () => Array.from({ length: width }, () => 21));
  const overlay: number[][] = Array.from({ length: height }, () => Array.from({ length: width }, () => -1));

  // Frame the mine with sturdy walls.
  fillRect(base, 0, 0, width, 1, 3);
  fillRect(base, 0, height - 1, width, 1, 3);
  fillRect(base, 0, 0, 1, height, 3);
  fillRect(base, width - 1, 0, 1, height, 3);

  // Carve an irregular zig-zagging corridor and branching rooms.
  fillRect(base, 3, 3, width - 6, 5, 14);
  fillRect(base, 7, 8, width - 10, 5, 14);
  fillRect(base, 10, 13, width - 14, 4, 14);
  fillRect(base, 6, 17, 18, 5, 14);
  fillRect(base, 26, 17, 12, 6, 14);
  fillRect(base, 30, 8, 9, 6, 14);

  // Cavern alcoves and cut-ins.
  fillRect(base, 5, 6, 4, 3, 18);
  fillRect(base, width - 12, 6, 3, 4, 18);
  fillRect(base, 16, 20, 4, 3, 18);

  // Pits and water pockets that align to hazard tags.
  fillRect(base, 11, 9, 5, 3, 25);
  fillRect(base, 18, 15, 6, 3, 25);
  fillRect(base, width - 16, 12, 6, 3, 26);
  fillRect(base, width - 22, 18, 5, 3, 26);

  // Bridges and shored walkways over hazards.
  drawHorizontalPath(base, 10, 12, 15, 17);
  drawHorizontalPath(base, 18, 20, 24, 17);
  drawVerticalPath(base, width - 14, 12, 18, 17);

  // Columns marking choke points and cover around hazards.
  base[8][14] = 30;
  base[12][20] = 30;
  base[14][28] = 30;
  base[18][32] = 30;

  // Air vents and warmth pockets that line up with hazard safety tags.
  base[7][6] = 31;
  base[15][24] = 31;
  base[20][19] = 31;

  // Decorative overlays for gravel edging, banners, and water edges.
  for (let row = 4; row < height - 4; row += 3) {
    overlay[row][10] = 15;
    overlay[row][Math.floor(width / 2)] = 15;
  }
  for (let col = 12; col < width - 6; col += 4) {
    overlay[6][col] = 16;
    overlay[height - 7][col] = 16;
  }
  const waterEdges = [
    { x: 11, y: 9, w: 5, h: 3 },
    { x: 18, y: 15, w: 6, h: 3 }
  ];
  waterEdges.forEach(({ x, y, w, h }) => {
    for (let row = y - 1; row <= y + h; row += 1) {
      for (let col = x - 1; col <= x + w; col += 1) {
        if (
          overlay[row]?.[col] === -1 &&
          ![25, 26, 31].includes(base[row]?.[col] ?? -1)
        ) {
          overlay[row][col] = 14;
        }
      }
    }
  });

  const spawns: AgentSpawn[] = [
    {
      kind: 'enemy',
      tileX: 9,
      tileY: 5,
      waypoints: [
        { tileX: 9, tileY: 5 },
        { tileX: 16, tileY: 6 },
        { tileX: 16, tileY: 9 }
      ],
      tags: ['pickaxer'],
      attackDamage: 3,
      drops: ['timber-plank']
    },
    {
      kind: 'enemy',
      tileX: 22,
      tileY: 12,
      waypoints: [
        { tileX: 22, tileY: 12 },
        { tileX: 28, tileY: 12 },
        { tileX: 28, tileY: 15 }
      ],
      tags: ['foreman'],
      health: 18,
      attackDamage: 4,
      drops: ['gear-sash']
    },
    {
      kind: 'enemy',
      tileX: 18,
      tileY: 18,
      tags: ['mole'],
      waypoints: [
        { tileX: 18, tileY: 18 },
        { tileX: 14, tileY: 21 },
        { tileX: 24, tileY: 21 }
      ],
      speedTilesPerSecond: 5,
      drops: ['coin']
    },
    {
      kind: 'enemy',
      tileX: 33,
      tileY: 10,
      tags: ['warden', 'boss'],
      health: 32,
      attackDamage: 5,
      detectionRangeTiles: 7,
      attackRangeTiles: 1.3,
      drops: ['woodcutter-sash', 'timber-plank']
    }
  ];

  const items: ItemSpawn[] = [
    { itemId: 'timber-plank', tileX: 12, tileY: 8 },
    { itemId: 'gear-sash', tileX: 21, tileY: 14 },
    { itemId: 'lantern-oil', tileX: 30, tileY: 19 }
  ];

  return {
    id: 'timber-tunnels',
    levelName: 'Timber Tunnels',
    musicKey: 'dungeon',
    nextLevelId: 'river-hollow',
    width,
    height,
    terrain: 'castle',
    tiles: base.flat(),
    layers: [
      { terrain: 'castle', tiles: base.flat() },
      { terrain: 'castle', tiles: overlay.flat() }
    ],
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
  const base: number[][] = Array.from({ length: height }, () => Array.from({ length: width }, () => 13));
  const overlay: number[][] = Array.from({ length: height }, () => Array.from({ length: width }, () => -1));

  const paintDisc = (cx: number, cy: number, radius: number, tile: number) => {
    for (let row = cy - radius; row <= cy + radius; row += 1) {
      for (let col = cx - radius; col <= cx + radius; col += 1) {
        if (row >= 0 && row < height && col >= 0 && col < width) {
          const distanceSq = (row - cy) ** 2 + (col - cx) ** 2;
          if (distanceSq <= radius ** 2) {
            base[row][col] = tile;
          }
        }
      }
    }
  };

  const carveMeanderingChannel = (
    points: { x: number; y: number }[],
    radius: number,
    tile: number
  ) => {
    for (let i = 0; i < points.length - 1; i += 1) {
      const start = points[i];
      const end = points[i + 1];
      const steps = Math.max(Math.abs(end.x - start.x), Math.abs(end.y - start.y));

      for (let step = 0; step <= steps; step += 1) {
        const t = step / steps;
        const x = Math.round(start.x + (end.x - start.x) * t);
        const y = Math.round(start.y + (end.y - start.y) * t);
        paintDisc(x, y, radius, tile);
      }
    }
  };

  // Perimeter stones and carved-out basin.
  fillRect(base, 0, 0, width, 1, 18);
  fillRect(base, 0, height - 1, width, 1, 18);
  fillRect(base, 0, 0, 1, height, 18);
  fillRect(base, width - 1, 0, 1, height, 18);
  fillRect(base, 2, 2, width - 4, height - 4, 14);

  // Irregular river channels and chill pools carved with meandering curves.
  carveMeanderingChannel(
    [
      { x: 4, y: 6 },
      { x: 10, y: 4 },
      { x: 16, y: 8 },
      { x: 22, y: 7 },
      { x: 30, y: 10 },
      { x: 34, y: 14 },
      { x: 28, y: 18 },
      { x: 18, y: 20 },
      { x: 9, y: 18 }
    ],
    2,
    25
  );

  carveMeanderingChannel(
    [
      { x: 12, y: 11 },
      { x: 18, y: 13 },
      { x: 24, y: 12 },
      { x: 27, y: 15 },
      { x: 22, y: 17 },
      { x: 14, y: 16 }
    ],
    1,
    26
  );

  paintDisc(18, 12, 2, 29);
  paintDisc(30, 17, 2, 29);
  paintDisc(11, 7, 1, 26);
  paintDisc(7, 16, 1, 26);

  // Riverbanks, alcoves, bridges, and stepping stones.
  fillRect(base, 5, 9, 5, 4, 18);
  fillRect(base, width - 11, 15, 5, 4, 18);
  drawVerticalPath(base, 16, 5, 20, 17);
  drawVerticalPath(base, 24, 7, 19, 17);
  drawHorizontalPath(base, 12, 7, 18, 17);
  drawHorizontalPath(base, 20, 23, 31, 17);
  drawHorizontalPath(base, 19, 10, 15, 17);
  overlay[8][14] = 15;
  overlay[9][15] = 16;
  overlay[15][23] = 15;
  overlay[16][22] = 16;
  overlay[18][12] = 15;
  overlay[18][14] = 15;

  // Columns and markers along the main flow.
  base[7][18] = 30;
  base[12][14] = 30;
  base[12][24] = 30;
  base[18][22] = 30;

  // Warmth tiles beside braziers tucked into calm alcoves.
  [
    { x: 8, y: 10 },
    { x: 9, y: 10 },
    { x: 30, y: 17 },
    { x: 31, y: 17 },
    { x: Math.floor(width / 2), y: 21 }
  ].forEach(({ x, y }) => {
    base[y][x] = 31;
  });

  // Decorative overlay for gravel edges, banners, and water shimmer.
  for (let col = 4; col < width - 4; col += 3) {
    overlay[3][col] = 15;
    overlay[height - 4][col] = 15;
  }
  for (let row = 6; row < height - 6; row += 4) {
    overlay[row][5] = 16;
    overlay[row][width - 6] = 16;
  }
  const riverShore = [
    { x: 2, y: 3, w: 22, h: 10 },
    { x: 12, y: 10, w: 18, h: 10 },
    { x: 22, y: 5, w: 14, h: 14 }
  ];
  riverShore.forEach(({ x, y, w, h }) => {
    for (let row = y - 1; row <= y + h; row += 1) {
      for (let col = x - 1; col <= x + w; col += 1) {
        if (
          overlay[row]?.[col] === -1 &&
          ![25, 26, 29, 31].includes(base[row]?.[col] ?? -1)
        ) {
          overlay[row][col] = 14;
        }
      }
    }
  });

  const spawns: AgentSpawn[] = [
    {
      kind: 'enemy',
      tileX: 14,
      tileY: 12,
      waypoints: [
        { tileX: 14, tileY: 12 },
        { tileX: 17, tileY: 9 },
        { tileX: 12, tileY: 8 }
      ],
      tags: ['wisp'],
      attackDamage: 2,
      drops: ['spirit-charm']
    },
    {
      kind: 'enemy',
      tileX: 21,
      tileY: 15,
      tags: ['leech'],
      waypoints: [
        { tileX: 21, tileY: 15 },
        { tileX: 24, tileY: 16 },
        { tileX: 24, tileY: 12 }
      ],
      attackDamage: 2,
      speedTilesPerSecond: 4.5,
      drops: ['coin']
    },
    {
      kind: 'enemy',
      tileX: 12,
      tileY: 20,
      tags: ['bog'],
      waypoints: [
        { tileX: 12, tileY: 20 },
        { tileX: 10, tileY: 22 },
        { tileX: 15, tileY: 22 },
        { tileX: 15, tileY: 19 }
      ],
      attackDamage: 3,
      drops: ['coin']
    },
    {
      kind: 'enemy',
      tileX: 24,
      tileY: 18,
      tags: ['kelpie', 'boss'],
      health: 30,
      attackDamage: 5,
      detectionRangeTiles: 8,
      attackRangeTiles: 1.25,
      drops: ['still-water-charm', 'creek-pearl'],
      waypoints: [
        { tileX: 24, tileY: 18 },
        { tileX: 30, tileY: 17 },
        { tileX: 28, tileY: 21 }
      ]
    }
  ];

  const items: ItemSpawn[] = [
    { itemId: 'spirit-charm', tileX: 10, tileY: 5 },
    { itemId: 'warmth-salve', tileX: 20, tileY: 18 },
    { itemId: 'river-etching', tileX: 30, tileY: 12 }
  ];

  return {
    id: 'river-hollow',
    levelName: 'River Hollow',
    musicKey: 'dungeon',
    nextLevelId: 'level-1',
    width,
    height,
    terrain: 'castle',
    tiles: base.flat(),
    layers: [
      { terrain: 'castle', tiles: base.flat() },
      { terrain: 'castle', tiles: overlay.flat() }
    ],
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
