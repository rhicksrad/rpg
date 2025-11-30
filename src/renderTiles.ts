import { SpriteSheet, TILE_SIZE } from './assets';

export type Camera = {
  x: number;
  y: number;
  width: number;
  height: number;
};

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
  map: number[][],
  camera: Camera
): void {
  const startCol = Math.max(Math.floor(camera.x / TILE_SIZE), 0);
  const endCol = Math.min(Math.ceil((camera.x + camera.width) / TILE_SIZE), map[0].length);
  const startRow = Math.max(Math.floor(camera.y / TILE_SIZE), 0);
  const endRow = Math.min(Math.ceil((camera.y + camera.height) / TILE_SIZE), map.length);

  for (let row = startRow; row < endRow; row += 1) {
    for (let col = startCol; col < endCol; col += 1) {
      const tileIndex = map[row][col];
      drawTile(ctx, sheet, tileIndex, col * TILE_SIZE - camera.x, row * TILE_SIZE - camera.y);
    }
  }
}
