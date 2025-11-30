import { SpriteSheet, TILE_SIZE } from './assets';
import {
  Direction,
  Entity,
  EntityWithComponent,
  createEntity,
  createPosition,
  createSprite,
  getEntityPixelPosition
} from './entities';
import { moveEntityWithCollision } from './movement';
import { HeroState, respawnHero } from './hero';
import { applyDamage } from './stats';

export type Waypoint = { tileX: number; tileY: number };

export type AgentBehavior = 'idle' | 'patrol';

export type AgentSpawn = {
  kind: 'npc' | 'enemy';
  tileX: number;
  tileY: number;
  facing?: Direction;
  spriteIndex?: number;
  waypoints?: Waypoint[];
  pauseDurationMs?: number;
  speedTilesPerSecond?: number;
  tags?: string[];
  drops?: string[];
  health?: number;
};

export type AgentState = {
  entity: Entity;
  behavior: AgentBehavior;
  waypoints: Waypoint[];
  currentWaypoint: number;
  pauseDurationMs: number;
  pauseTimerMs: number;
  frameTimer: number;
  speedTilesPerSecond: number;
  hitFlashMs: number;
  isAlive: boolean;
  drops?: string[];
  spriteIndex?: number;
  attackCooldownMs: number;
  attackTimerMs: number;
  detectionRangeTiles: number;
  attackRangeTiles: number;
  attackDamage: number;
};

const ENEMY_CHASE_RANGE_TILES = 6;
const ENEMY_ATTACK_RANGE_TILES = 0.9;
const ENEMY_ATTACK_DAMAGE = 3;
const ENEMY_ATTACK_COOLDOWN_MS = 750;

function mapEnemySpriteIndex(tags: string[] = [], fallback = 0): number {
  if (tags.includes('slime')) return 0;
  if (tags.includes('bat')) return 9;
  if (tags.includes('guard') || tags.includes('skeleton')) return 10;
  if (tags.includes('wolf')) return 11;
  if (tags.includes('rat')) return 7;
  if (tags.includes('spider')) return 8;
  if (tags.includes('ghost')) return 4;
  if (tags.includes('eye')) return 3;
  if (tags.includes('goblin')) return 5;
  return fallback;
}

export function createAgent(spawn: AgentSpawn, sheet: SpriteSheet): AgentState {
  const position = createPosition(spawn.tileX, spawn.tileY);
  const sprite = createSprite(sheet, spawn.facing ?? 0, 0);
  const behavior: AgentBehavior = spawn.waypoints && spawn.waypoints.length > 1 ? 'patrol' : 'idle';

  const spriteIndex =
    spawn.kind === 'enemy'
      ? spawn.spriteIndex ?? mapEnemySpriteIndex(spawn.tags)
      : spawn.spriteIndex;

  const entity = createEntity({
    kind: spawn.kind,
    position,
    sprite,
    components: {
      collidable: { solid: true },
      health: spawn.kind === 'enemy' ? { current: spawn.health ?? 6, max: spawn.health ?? 6, isAlive: true } : undefined,
      ai: {
        behavior: behavior === 'patrol' ? 'wander' : 'idle',
        state: { waypoints: spawn.waypoints }
      }
    },
    tags: spawn.tags
  });

  return {
    entity,
    behavior,
    waypoints: spawn.waypoints ?? [],
    currentWaypoint: 0,
    pauseDurationMs: spawn.pauseDurationMs ?? 650,
    pauseTimerMs: 0,
    frameTimer: 0,
    speedTilesPerSecond: spawn.speedTilesPerSecond ?? 4,
    hitFlashMs: 0,
    isAlive: true,
    drops: spawn.drops,
    spriteIndex,
    attackCooldownMs: ENEMY_ATTACK_COOLDOWN_MS,
    attackTimerMs: 0,
    detectionRangeTiles: ENEMY_CHASE_RANGE_TILES,
    attackRangeTiles: ENEMY_ATTACK_RANGE_TILES,
    attackDamage: ENEMY_ATTACK_DAMAGE
  };
}

function pickDirection(dx: number, dy: number): Direction {
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? 2 : 1;
  }
  return dy >= 0 ? 0 : 3;
}

export function updateAgents(
  agents: AgentState[],
  hero: HeroState,
  deltaMs: number,
  map: number[][],
  collidables: EntityWithComponent<'collidable'>[]
): void {
  agents.forEach((agent) => {
    if (!agent.isAlive) return;
    if (agent.hitFlashMs > 0) {
      agent.hitFlashMs = Math.max(0, agent.hitFlashMs - deltaMs);
    }
    const isEnemy = agent.entity.kind === 'enemy';
    const heroEntity = hero.entity as EntityWithComponent<'health'>;
    const heroHealth = heroEntity.components.health;
    if (isEnemy && agent.attackTimerMs > 0) {
      agent.attackTimerMs = Math.max(agent.attackTimerMs - deltaMs, 0);
    }

    const heroTarget = getEntityPixelPosition(hero.entity);
    const { x, y } = getEntityPixelPosition(agent.entity);
    const dxHero = heroTarget.x - x;
    const dyHero = heroTarget.y - y;
    const distanceToHero = Math.hypot(dxHero, dyHero) / TILE_SIZE;
    const shouldChaseHero = isEnemy && distanceToHero <= agent.detectionRangeTiles;

    if (!shouldChaseHero && (agent.behavior === 'idle' || agent.waypoints.length < 2)) {
      agent.entity.sprite.frame = 0;
      agent.frameTimer = 0;
      return;
    }

    if (!shouldChaseHero && agent.pauseTimerMs > 0) {
      agent.pauseTimerMs = Math.max(agent.pauseTimerMs - deltaMs, 0);
      agent.entity.sprite.frame = 0;
      return;
    }

    const target = shouldChaseHero ? heroTarget : agent.waypoints[agent.currentWaypoint];
    const targetX = shouldChaseHero ? target.x : target.tileX * TILE_SIZE;
    const targetY = shouldChaseHero ? target.y : target.tileY * TILE_SIZE;
    const dx = targetX - x;
    const dy = targetY - y;

    const distance = Math.hypot(dx, dy);
    if (!shouldChaseHero && distance < 2) {
      agent.currentWaypoint = (agent.currentWaypoint + 1) % agent.waypoints.length;
      agent.pauseTimerMs = agent.pauseDurationMs;
      agent.entity.sprite.frame = 0;
      return;
    }

    const direction = pickDirection(dx, dy);
    agent.entity.sprite.direction = direction;

    moveEntityWithCollision(agent.entity, dx, dy, agent.speedTilesPerSecond * TILE_SIZE, deltaMs, map, collidables);

    if (shouldChaseHero && heroHealth?.isAlive && distanceToHero <= agent.attackRangeTiles) {
      if (agent.attackTimerMs <= 0 && (!hero.hurtCooldownMs || hero.hurtCooldownMs <= 0)) {
        applyDamage(heroEntity, agent.attackDamage);
        hero.hurtCooldownMs = agent.attackCooldownMs;
        hero.isAlive = Boolean(heroHealth?.isAlive);
        if (!hero.isAlive) {
          respawnHero(hero);
        }
        agent.attackTimerMs = agent.attackCooldownMs;
        return;
      }
    }
  });
}

export function drawAgents(
  ctx: CanvasRenderingContext2D,
  sheet: SpriteSheet,
  agents: AgentState[],
  camera: { x: number; y: number }
): void {
  agents.forEach((agent) => {
    if (!agent.isAlive) return;
    const { x, y } = getEntityPixelPosition(agent.entity);
    const screenX = x - camera.x;
    const screenY = y - camera.y;
    const spriteIndex = agent.spriteIndex;

    const column = spriteIndex !== undefined ? spriteIndex % sheet.columns : agent.entity.sprite.frame;
    const row = spriteIndex !== undefined ? Math.floor(spriteIndex / sheet.columns) : agent.entity.sprite.direction;
    const sx = column * sheet.tileWidth;
    const sy = row * sheet.tileHeight;

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

    if (agent.hitFlashMs > 0) {
      ctx.save();
      ctx.globalAlpha = 0.6 * (agent.hitFlashMs / 180);
      ctx.fillStyle = '#ffaaaa';
      ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
      ctx.restore();
    }
  });
}
