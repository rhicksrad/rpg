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
  enemies: SpriteSheet;
  items: SpriteSheet;
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
  const resolvedBase = new URL(base, window.location.href);
  return new URL(path, resolvedBase).toString();
}

export async function loadAssets(): Promise<Assets> {
  const [heroImage, enemyImage, villageImage, castleImage] = await Promise.all([
    loadImage(resolvePublicAsset('hero_sprites_16x16.png')),
    loadImage(resolvePublicAsset('enemies_level1_5x5_16px.png')),
    loadImage(resolvePublicAsset('village_tiles_5x5_16px.png')),
    loadImage(resolvePublicAsset('castle.png'))
  ]);

  return {
    hero: {
      image: heroImage,
      tileWidth: 64,
      tileHeight: 64,
      columns: 16,
      rows: 16
    },
    enemies: {
      image: enemyImage,
      tileWidth: 16,
      tileHeight: 16,
      columns: 5,
      rows: 5
    },
    items: {
      image: heroImage,
      tileWidth: 64,
      tileHeight: 64,
      columns: 16,
      rows: 16
    },
    terrain: {
      grass: {
        image: villageImage,
        tileWidth: villageImage.width / 5,
        tileHeight: villageImage.height / 5,
        columns: 5,
        rows: 5
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
