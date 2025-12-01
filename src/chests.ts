import { SpriteSheet, TILE_SIZE } from './assets';
import { Entity, createEntity, createPosition, createSprite } from './entities';
import { HeroState } from './hero';
import { addItemToInventory, earnCurrency } from './inventory';

export type ChestSpawn = {
  id: string;
  tileX: number;
  tileY: number;
  coins: number;
  itemId?: string;
};

export function createChestEntity(spawn: ChestSpawn, sheet: SpriteSheet, getHero: () => HeroState): Entity {
  const sprite = createSprite(sheet, 2, 9);
  const entity = createEntity({
    id: `chest-${spawn.id}`,
    kind: 'prop',
    position: createPosition(spawn.tileX, spawn.tileY),
    sprite,
    components: {
      interactable: {
        prompt: 'Open Chest',
        onInteract: () => {
          const hero = getHero();
          if (entity.metadata?.opened) return;
          earnCurrency(hero.inventory, spawn.coins);
          if (spawn.itemId) {
            addItemToInventory(hero.inventory, spawn.itemId, 1);
          }
          entity.metadata = { ...(entity.metadata ?? {}), opened: true };
          entity.components.interactable = { prompt: 'Empty' };
        }
      }
    },
    metadata: { opened: false },
    tags: ['chest']
  });

  return entity;
}

export function drawChests(
  ctx: CanvasRenderingContext2D,
  sheet: SpriteSheet,
  chests: Entity[],
  camera: { x: number; y: number }
): void {
  chests.forEach((chest) => {
    const sx = chest.sprite.frame * sheet.tileWidth;
    const sy = (chest.metadata?.opened ? chest.sprite.direction + 1 : chest.sprite.direction) * sheet.tileHeight;
    const screenX = chest.position.tileX * TILE_SIZE - camera.x;
    const screenY = chest.position.tileY * TILE_SIZE - camera.y;
    ctx.drawImage(sheet.image, sx, sy, sheet.tileWidth, sheet.tileHeight, screenX, screenY, TILE_SIZE, TILE_SIZE);
  });
}
