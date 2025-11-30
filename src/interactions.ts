import { HeroState, getTileInFront } from './hero';

export type TileInteractTarget = {
  kind: 'tile';
  tileX: number;
  tileY: number;
  tileIndex: number;
};

export type InteractTarget = TileInteractTarget;

export function getInteractionTarget(hero: HeroState, map: number[][]): InteractTarget | null {
  const { tileX, tileY } = getTileInFront(hero);

  if (tileY < 0 || tileY >= map.length || tileX < 0 || tileX >= map[0].length) {
    return null;
  }

  return {
    kind: 'tile',
    tileX,
    tileY,
    tileIndex: map[tileY][tileX]
  };
}

export function interact(target: InteractTarget | null): void {
  if (!target) return;

  switch (target.kind) {
    case 'tile':
      console.log(`Interacting with tile (${target.tileX}, ${target.tileY}) index ${target.tileIndex}`);
      break;
  }
}
