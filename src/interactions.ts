import { HeroState, getTileInFront } from './hero';
import { Entity, EntityRegistry } from './entities';

export type TileInteractTarget = {
  kind: 'tile';
  tileX: number;
  tileY: number;
  tileIndex: number;
};

export type EntityInteractTarget = {
  kind: 'entity';
  entity: Entity;
};

export type InteractTarget = TileInteractTarget | EntityInteractTarget;

export function getInteractionTarget(
  hero: HeroState,
  map: number[][],
  entities: EntityRegistry
): InteractTarget | null {
  const { tileX, tileY } = getTileInFront(hero);

  if (tileY < 0 || tileY >= map.length || tileX < 0 || tileX >= map[0].length) {
    return null;
  }

  const entityTarget = entities
    .findAtTile(tileX, tileY)
    .find((entity) => Boolean(entity.components.interactable));

  if (entityTarget) {
    return { kind: 'entity', entity: entityTarget };
  }

  return {
    kind: 'tile',
    tileX,
    tileY,
    tileIndex: map[tileY][tileX]
  };
}

export function interact(target: InteractTarget | null, actor: Entity): void {
  if (!target) return;

  switch (target.kind) {
    case 'entity': {
      const { interactable } = target.entity.components;
      if (interactable?.onInteract) {
        interactable.onInteract(target.entity, actor);
      } else if (interactable?.prompt) {
        console.log(`Interacting with ${interactable.prompt}`);
      }
      break;
    }
    case 'tile':
      console.log(`Interacting with tile (${target.tileX}, ${target.tileY}) index ${target.tileIndex}`);
      break;
  }
}
