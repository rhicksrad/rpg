import { HeroState, getTileInFront } from './hero';
import { EntityRegistry, EntityWithComponent } from './entities';

export type TileInteractTarget = {
  kind: 'tile';
  tileX: number;
  tileY: number;
  tileIndex: number;
};

export type EntityInteractTarget = {
  kind: 'entity';
  entity: EntityWithComponent<'interactable'>;
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

  const interactableEntity = entities
    .withComponent('interactable')
    .find((entity) => entity.position.tileX === tileX && entity.position.tileY === tileY);

  if (interactableEntity) {
    return { kind: 'entity', entity: interactableEntity };
  }

  return {
    kind: 'tile',
    tileX,
    tileY,
    tileIndex: map[tileY][tileX]
  };
}

export function interact(target: InteractTarget | null, actor: HeroState): void {
  if (!target) return;

  switch (target.kind) {
    case 'entity': {
      const interactable = target.entity.components.interactable;

      if (interactable?.onInteract) {
        interactable.onInteract(target.entity, actor.entity);
      } else {
        console.log(`Interacting with entity ${target.entity.id}`);
      }
      break;
    }
    case 'tile':
      console.log(`Interacting with tile (${target.tileX}, ${target.tileY}) index ${target.tileIndex}`);
      break;
  }
}
