import { SpriteSheet, TILE_SIZE } from './assets';

export function drawTile(
  ctx: CanvasRenderingContext2D,
  sheet: SpriteSheet,
  tileIndex: number,
  x: number,
  y: number
): void {
  const col = tileIndex % sheet.columns;
  const row = Math.floor(tileIndex / sheet.columns);
  const sx = col * sheet.tileWidth;
  const sy = row * sheet.tileHeight;

  ctx.drawImage(
    sheet.image,
    sx,
    sy,
    sheet.tileWidth,
    sheet.tileHeight,
    x,
    y,
    TILE_SIZE,
    TILE_SIZE
  );
}

export function drawTileMap(
  ctx: CanvasRenderingContext2D,
  sheet: SpriteSheet,
  map: number[][]
): void {
  for (let row = 0; row < map.length; row += 1) {
    for (let col = 0; col < map[row].length; col += 1) {
      const tileIndex = map[row][col];
      drawTile(ctx, sheet, tileIndex, col * TILE_SIZE, row * TILE_SIZE);
    }
  }
}
