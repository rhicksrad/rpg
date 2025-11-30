import { TILE_SIZE } from './assets';
import type { Camera } from './renderTiles';

export function initializeCanvas(
  elementId: string
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.getElementById(elementId) as HTMLCanvasElement | null;

  if (!canvas) {
    throw new Error('Canvas element not found');
  }

  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Unable to acquire 2D context');
  }

  ctx.imageSmoothingEnabled = false;

  return { canvas, ctx };
}

export function resizeCanvasToViewport(
  canvas: HTMLCanvasElement,
  camera: Camera,
  map: number[][]
): void {
  const mapWidth = map[0].length * TILE_SIZE;
  const mapHeight = map.length * TILE_SIZE;
  const width = Math.min(window.innerWidth, mapWidth);
  const height = Math.min(window.innerHeight, mapHeight);

  canvas.width = width;
  canvas.height = height;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  camera.width = width;
  camera.height = height;
}
