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

export type Waypoint = { tileX: number; tileY: number };

export type AgentBehavior = 'idle' | 'patrol';

export type AgentSpawn = {
  kind: 'npc' | 'enemy';
  tileX: number;
  tileY: number;
  facing?: Direction;
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
};

const FRAME_DURATION_MS = 180;

export function createAgent(spawn: AgentSpawn, sheet: SpriteSheet): AgentState {
  const position = createPosition(spawn.tileX, spawn.tileY);
  const sprite = createSprite(sheet, spawn.facing ?? 0, 0);
  const behavior: AgentBehavior = spawn.waypoints && spawn.waypoints.length > 1 ? 'patrol' : 'idle';

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
    drops: spawn.drops
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
  deltaMs: number,
  map: number[][],
  collidables: EntityWithComponent<'collidable'>[]
): void {
  agents.forEach((agent) => {
    if (!agent.isAlive) return;
    if (agent.hitFlashMs > 0) {
      agent.hitFlashMs = Math.max(0, agent.hitFlashMs - deltaMs);
    }
    if (agent.behavior === 'idle' || agent.waypoints.length < 2) {
      agent.entity.sprite.frame = 0;
      agent.frameTimer = 0;
      return;
    }

    if (agent.pauseTimerMs > 0) {
      agent.pauseTimerMs = Math.max(agent.pauseTimerMs - deltaMs, 0);
      agent.entity.sprite.frame = 0;
      return;
    }

    const target = agent.waypoints[agent.currentWaypoint];
    const { x, y } = getEntityPixelPosition(agent.entity);
    const targetX = target.tileX * TILE_SIZE;
    const targetY = target.tileY * TILE_SIZE;
    const dx = targetX - x;
    const dy = targetY - y;

    const distance = Math.hypot(dx, dy);
    if (distance < 2) {
      agent.currentWaypoint = (agent.currentWaypoint + 1) % agent.waypoints.length;
      agent.pauseTimerMs = agent.pauseDurationMs;
      agent.entity.sprite.frame = 0;
      return;
    }

    const direction = pickDirection(dx, dy);
    agent.entity.sprite.direction = direction;

    const { moved } = moveEntityWithCollision(
      agent.entity,
      dx,
      dy,
      agent.speedTilesPerSecond * TILE_SIZE,
      deltaMs,
      map,
      collidables
    );

    if (moved) {
      agent.frameTimer += deltaMs;
      if (agent.frameTimer >= FRAME_DURATION_MS) {
        agent.entity.sprite.frame = agent.entity.sprite.frame === 0 ? 1 : 0;
        agent.frameTimer = 0;
      }
    } else {
      agent.entity.sprite.frame = 0;
      agent.frameTimer = 0;
      agent.pauseTimerMs = agent.pauseDurationMs;
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
    const sx = agent.entity.sprite.frame * sheet.tileWidth;
    const sy = agent.entity.sprite.direction * sheet.tileHeight;

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
