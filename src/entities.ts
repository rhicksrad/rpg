import { SpriteSheet, TILE_SIZE } from './assets';

export type Direction = 0 | 1 | 2 | 3; // down, left, right, up

export type PositionComponent = {
  tileX: number;
  tileY: number;
  offsetX: number;
  offsetY: number;
};

export type SpriteComponent = {
  sheet: SpriteSheet;
  direction: Direction;
  frame: number;
};

export type CollidableComponent = {
  solid: boolean;
};

export type HealthComponent = {
  current: number;
  max: number;
};

export type AIComponent = {
  behavior: 'idle' | 'wander' | 'aggressive';
  state?: Record<string, unknown>;
};

export type InteractableComponent = {
  prompt?: string;
  onInteract?: (self: Entity, actor: Entity) => void;
};

export type EntityKind = 'player' | 'npc' | 'enemy' | 'prop' | 'projectile';

export type Entity = {
  id: string;
  kind: EntityKind;
  position: PositionComponent;
  sprite: SpriteComponent;
  components: {
    collidable?: CollidableComponent;
    health?: HealthComponent;
    ai?: AIComponent;
    interactable?: InteractableComponent;
  };
  tags?: string[];
};

let nextEntityId = 1;

export function createPosition(
  tileX: number,
  tileY: number,
  offsetX: number = 0,
  offsetY: number = 0
): PositionComponent {
  return { tileX, tileY, offsetX, offsetY };
}

export function createSprite(
  sheet: SpriteSheet,
  direction: Direction = 0,
  frame: number = 0
): SpriteComponent {
  return { sheet, direction, frame };
}

export function createEntity(options: {
  kind: EntityKind;
  position: PositionComponent;
  sprite: SpriteComponent;
  components?: Partial<Entity['components']>;
  tags?: string[];
}): Entity {
  return {
    id: `entity-${nextEntityId++}`,
    kind: options.kind,
    position: options.position,
    sprite: options.sprite,
    components: options.components ?? {},
    tags: options.tags
  };
}

export function getEntityPixelPosition(entity: Entity): { x: number; y: number } {
  return {
    x: entity.position.tileX * TILE_SIZE + entity.position.offsetX,
    y: entity.position.tileY * TILE_SIZE + entity.position.offsetY
  };
}

export function setEntityPixelPosition(entity: Entity, x: number, y: number): void {
  const tileX = Math.floor(x / TILE_SIZE);
  const tileY = Math.floor(y / TILE_SIZE);

  entity.position.tileX = tileX;
  entity.position.tileY = tileY;
  entity.position.offsetX = x - tileX * TILE_SIZE;
  entity.position.offsetY = y - tileY * TILE_SIZE;
}

export type EntityStore = {
  add: (entity: Entity) => Entity;
  remove: (id: string) => boolean;
  get: (id: string) => Entity | undefined;
  all: () => Entity[];
  findByKind: (kind: EntityKind) => Entity[];
};

export function createEntityStore(initialEntities: Entity[] = []): EntityStore {
  const entities = new Map(initialEntities.map((entity) => [entity.id, entity]));

  return {
    add: (entity: Entity) => {
      entities.set(entity.id, entity);
      return entity;
    },
    remove: (id: string) => entities.delete(id),
    get: (id: string) => entities.get(id),
    all: () => Array.from(entities.values()),
    findByKind: (kind: EntityKind) => Array.from(entities.values()).filter((entity) => entity.kind === kind)
  };
}
