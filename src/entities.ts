import { SpriteSheet, TILE_SIZE } from './assets';
import type { Camera } from './renderTiles';

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

export type EntityComponents = Entity['components'];
export type ComponentKind = keyof EntityComponents;

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
  register: (entity: Entity) => Entity;
  unregister: (id: string) => boolean;
  get: (id: string) => Entity | undefined;
  all: () => Entity[];
  findByKind: (kind: EntityKind) => Entity[];
  withComponent: (component: ComponentKind) => Entity[];
  withComponents: (components: ComponentKind[]) => Entity[];
  withTag: (tag: string) => Entity[];
  findAtTile: (tileX: number, tileY: number) => Entity[];
  addComponent: <K extends ComponentKind>(
    id: string,
    componentKey: K,
    component: NonNullable<EntityComponents[K]>
  ) => Entity | undefined;
  removeComponent: <K extends ComponentKind>(id: string, componentKey: K) => Entity | undefined;
};

export type EntityRegistry = EntityStore;

export function createEntityRegistry(initialEntities: Entity[] = []): EntityRegistry {
  const entities = new Map(initialEntities.map((entity) => [entity.id, entity]));
  const componentIndex: Record<ComponentKind, Set<string>> = {
    collidable: new Set(),
    health: new Set(),
    ai: new Set(),
    interactable: new Set()
  };
  const tagIndex = new Map<string, Set<string>>();
  const kindIndex = new Map<EntityKind, Set<string>>();

  const indexEntity = (entity: Entity): void => {
    entities.set(entity.id, entity);
    const kindBucket = kindIndex.get(entity.kind) ?? new Set<string>();
    kindBucket.add(entity.id);
    kindIndex.set(entity.kind, kindBucket);

    entity.tags?.forEach((tag) => {
      const bucket = tagIndex.get(tag) ?? new Set<string>();
      bucket.add(entity.id);
      tagIndex.set(tag, bucket);
    });

    (Object.keys(componentIndex) as ComponentKind[]).forEach((component) => {
      if (entity.components[component]) {
        componentIndex[component].add(entity.id);
      }
    });
  };

  const unindexEntity = (entity: Entity): void => {
    (Object.keys(componentIndex) as ComponentKind[]).forEach((component) => {
      componentIndex[component].delete(entity.id);
    });

    entity.tags?.forEach((tag) => {
      const bucket = tagIndex.get(tag);
      bucket?.delete(entity.id);
      if (bucket && bucket.size === 0) {
        tagIndex.delete(tag);
      }
    });

    const kindBucket = kindIndex.get(entity.kind);
    kindBucket?.delete(entity.id);
    if (kindBucket && kindBucket.size === 0) {
      kindIndex.delete(entity.kind);
    }
  };

  initialEntities.forEach(indexEntity);

  const resolveEntities = (ids: Iterable<string>): Entity[] =>
    Array.from(ids)
      .map((id) => entities.get(id))
      .filter((entity): entity is Entity => Boolean(entity));

  return {
    register: (entity: Entity) => {
      indexEntity(entity);
      return entity;
    },
    unregister: (id: string) => {
      const entity = entities.get(id);
      if (!entity) return false;
      unindexEntity(entity);
      return entities.delete(id);
    },
    get: (id: string) => entities.get(id),
    all: () => Array.from(entities.values()),
    findByKind: (kind: EntityKind) => resolveEntities(kindIndex.get(kind) ?? []),
    withComponent: (component: ComponentKind) => resolveEntities(componentIndex[component] ?? new Set()),
    withComponents: (components: ComponentKind[]) => {
      if (components.length === 0) return Array.from(entities.values());
      const [first, ...rest] = components;
      const initial = new Set(componentIndex[first] ?? []);

      rest.forEach((component) => {
        for (const id of Array.from(initial)) {
          if (!componentIndex[component]?.has(id)) {
            initial.delete(id);
          }
        }
      });

      return resolveEntities(initial);
    },
    withTag: (tag: string) => resolveEntities(tagIndex.get(tag) ?? []),
    findAtTile: (tileX: number, tileY: number) =>
      Array.from(entities.values()).filter(
        (entity) => entity.position.tileX === tileX && entity.position.tileY === tileY
      ),
    addComponent: <K extends ComponentKind>(
      id: string,
      componentKey: K,
      component: NonNullable<EntityComponents[K]>
    ) => {
      const entity = entities.get(id);
      if (!entity) return undefined;
      entity.components[componentKey] = component as EntityComponents[K];
      componentIndex[componentKey]?.add(id);
      return entity;
    },
    removeComponent: <K extends ComponentKind>(id: string, componentKey: K) => {
      const entity = entities.get(id);
      if (!entity) return undefined;
      delete entity.components[componentKey];
      componentIndex[componentKey]?.delete(id);
      return entity;
    }
  };
}

export const createEntityStore = createEntityRegistry;

export function drawEntity(
  ctx: CanvasRenderingContext2D,
  entity: Entity,
  camera: Pick<Camera, 'x' | 'y'>
): void {
  const { sheet, direction, frame } = entity.sprite;
  const sx = frame * sheet.tileWidth;
  const sy = direction * sheet.tileHeight;
  const { x, y } = getEntityPixelPosition(entity);
  const screenX = x - camera.x;
  const screenY = y - camera.y;

  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.ellipse(
    screenX + TILE_SIZE / 2,
    screenY + TILE_SIZE * 0.85,
    TILE_SIZE * 0.38,
    TILE_SIZE * 0.2,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.restore();

  ctx.drawImage(
    sheet.image,
    sx,
    sy,
    sheet.tileWidth,
    sheet.tileHeight,
    screenX,
    screenY,
    TILE_SIZE,
    TILE_SIZE
  );
}

export function drawEntities(
  ctx: CanvasRenderingContext2D,
  entities: Entity[],
  camera: Pick<Camera, 'x' | 'y'>
): void {
  const sorted = [...entities].sort((a, b) => a.position.tileY - b.position.tileY);
  sorted.forEach((entity) => drawEntity(ctx, entity, camera));
}
