import { Entity, createEntity, createPosition, createSprite } from './entities';
import { SpriteSheet } from './assets';
import { addItemToInventory, ITEM_DEFINITIONS } from './inventory';
import { HeroState } from './hero';

export type ItemSpawn = {
  itemId: string;
  tileX: number;
  tileY: number;
};

export function createItemEntity(spawn: ItemSpawn, sheet: SpriteSheet): Entity {
  const definition = ITEM_DEFINITIONS[spawn.itemId];
  const spriteIndex = Object.keys(ITEM_DEFINITIONS).indexOf(spawn.itemId) % 4;
  const sprite = createSprite(sheet, 0, spriteIndex);
  return createEntity({
    id: `item-${spawn.itemId}-${spawn.tileX}-${spawn.tileY}`,
    kind: 'prop',
    position: createPosition(spawn.tileX, spawn.tileY),
    sprite,
    metadata: { itemId: spawn.itemId },
    components: {
      interactable: { prompt: definition?.name ?? 'Item' }
    },
    tags: ['item']
  });
}

export function canPickup(hero: HeroState, item: Entity): boolean {
  const dx = Math.abs(hero.entity.position.tileX - item.position.tileX);
  const dy = Math.abs(hero.entity.position.tileY - item.position.tileY);
  return dx <= 1 && dy <= 1;
}

export function pickupNearbyItems(hero: HeroState, items: Entity[]): Entity[] {
  const remaining: Entity[] = [];
  items.forEach((item) => {
    if (canPickup(hero, item)) {
      const inventory = hero.inventory;
      if (inventory) {
        const itemId = (item.metadata?.itemId as string) ?? 'coin';
        const picked = addItemToInventory(inventory, itemId, 1);
        if (!picked) {
          remaining.push(item);
        }
      }
    } else {
      remaining.push(item);
    }
  });
  return remaining;
}
