export const TILE_SIZE = 16;

export type SpriteSheet = {
  image: HTMLImageElement;
  tileWidth: number;
  tileHeight: number;
  columns: number;
  rows: number;
};

export type Assets = {
  hero: SpriteSheet;
  terrain: {
    grass: SpriteSheet;
    castle: SpriteSheet;
  };
};

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

function resolvePublicAsset(path: string): string {
  const base = import.meta.env.BASE_URL || '/';
  const absoluteBase = new URL(base, window.location.origin);
  return new URL(path, absoluteBase).toString();
}

export async function loadAssets(): Promise<Assets> {
  const [heroImage, grassImage, castleImage] = await Promise.all([
    loadImage(resolvePublicAsset('hero_sprites_16x16.png')),
    loadImage(resolvePublicAsset('grassy.png')),
    loadImage(resolvePublicAsset('castle.png'))
  ]);

  return {
    hero: {
      image: heroImage,
      tileWidth: TILE_SIZE,
      tileHeight: TILE_SIZE,
      columns: 3,
      rows: 4
    },
    terrain: {
      grass: {
        image: grassImage,
        tileWidth: TILE_SIZE,
        tileHeight: TILE_SIZE,
        columns: 8,
        rows: 4
      },
      castle: {
        image: castleImage,
        tileWidth: TILE_SIZE,
        tileHeight: TILE_SIZE,
        columns: 8,
        rows: 4
      }
    }
  };
}
