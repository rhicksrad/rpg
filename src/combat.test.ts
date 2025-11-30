import { describe, expect, it } from 'vitest';
import { queueHeroAttack, updateCombat } from './combat';
import { Direction, EntityWithComponent, createEntityRegistry } from './entities';
import { createInventory } from './inventory';
import { AgentState } from './agents';
import { HeroState } from './hero';
import { SpriteSheet } from './assets';
import { applyDamage, heal } from './stats';

const dummySheet: SpriteSheet = {
  image: {} as HTMLImageElement,
  tileWidth: 16,
  tileHeight: 16,
  columns: 1,
  rows: 1
};

function createHeroState(): HeroState {
  return {
    entity: {
      id: 'hero',
      kind: 'player',
      position: { tileX: 0, tileY: 0, offsetX: 0, offsetY: 0 },
      sprite: { sheet: dummySheet, direction: 0, frame: 0 },
      components: {
        collidable: { solid: true },
        health: { current: 20, max: 20, isAlive: true }
      }
    },
    frameTimer: 0,
    speedTilesPerSecond: 7,
    isAlive: true,
    inventory: createInventory(),
    stats: { str: 5, dex: 5, int: 5, vit: 5, luck: 5 },
    secondary: {
      attack: 6,
      defense: 0,
      speed: 1,
      critChance: 0,
      dodge: 0,
      maxHp: 20,
      xpGain: 1
    },
    attackTimerMs: 0,
    attackCooldownMs: 450,
    attackActiveMs: 150,
    attackWindupMs: 120,
    attackQueued: false,
    xp: 0,
    level: 1,
    statusEffects: [],
    respawnPoint: { x: 0, y: 0 },
    hurtCooldownMs: 0
  };
}

function createEnemyAgent(
  tileX: number,
  tileY: number,
  options: { health?: number; drops?: string[]; armor?: number; id?: string; direction?: Direction } = {}
): AgentState {
  const health = options.health ?? 5;
  return {
    entity: {
      id: options.id ?? `enemy-${tileX}-${tileY}`,
      kind: 'enemy',
      position: { tileX, tileY, offsetX: 0, offsetY: 0 },
      sprite: { sheet: dummySheet, direction: options.direction ?? 0, frame: 0 },
      components: {
        collidable: { solid: true },
        health: { current: health, max: health, isAlive: true, armor: options.armor }
      }
    },
    behavior: 'idle',
    waypoints: [],
    currentWaypoint: 0,
    pauseDurationMs: 0,
    pauseTimerMs: 0,
    frameTimer: 0,
    speedTilesPerSecond: 0,
    hitFlashMs: 0,
    isAlive: true,
    drops: options.drops,
    spriteIndex: 0,
    attackCooldownMs: 0,
    attackTimerMs: 0,
    detectionRangeTiles: 0,
    attackRangeTiles: 0,
    attackDamage: 0
  };
}

describe('queueHeroAttack', () => {
  it('queues an attack when the hero is ready', () => {
    const hero = createHeroState();
    queueHeroAttack(hero);
    expect(hero.attackQueued).toBe(true);
    expect(hero.attackTimerMs).toBe(hero.attackWindupMs + hero.attackActiveMs);
  });

  it("doesn't queue an attack during an existing swing", () => {
    const hero = createHeroState();
    hero.attackTimerMs = 10;
    queueHeroAttack(hero);
    expect(hero.attackQueued).toBe(false);
    expect(hero.attackTimerMs).toBe(10);
  });
});

describe('updateCombat', () => {
  it('applies damage to targets in range during the active window', () => {
    const hero = createHeroState();
    const frontEnemy = createEnemyAgent(0, 1, { health: 3, drops: ['coin'] });
    const rearEnemy = createEnemyAgent(0, -1, { health: 5, id: 'backline' });
    const registry = createEntityRegistry([hero.entity, frontEnemy.entity, rearEnemy.entity]);

    queueHeroAttack(hero);
    const result = updateCombat(hero, [frontEnemy, rearEnemy], registry, hero.attackActiveMs + 10);

    expect(result).toEqual({ targetsHit: 1, totalDamage: 6 });
    expect(frontEnemy.entity.components.health?.isAlive).toBe(false);
    expect(frontEnemy.isAlive).toBe(false);
    expect(registry.get(frontEnemy.entity.id)).toBeUndefined();
    expect(hero.xp).toBe(10);
    expect(hero.inventory.hotbar).toContainEqual({ itemId: 'coin', quantity: 1 });
    expect(hero.attackQueued).toBe(false);
    expect(rearEnemy.entity.components.health?.isAlive).toBe(true);
  });

  it('waits for the active window before applying hits', () => {
    const hero = createHeroState();
    const frontEnemy = createEnemyAgent(0, 1, { health: 5 });
    const registry = createEntityRegistry([hero.entity, frontEnemy.entity]);

    queueHeroAttack(hero);
    const earlyResult = updateCombat(hero, [frontEnemy], registry, 50);

    expect(earlyResult).toEqual({ targetsHit: 0, totalDamage: 0 });
    expect(frontEnemy.entity.components.health?.current).toBe(5);
    expect(hero.attackQueued).toBe(true);
  });

  it('ignores targets outside the swing arc or range', () => {
    const hero = createHeroState();
    const outOfRangeEnemy = createEnemyAgent(0, 3, { health: 5, id: 'distant' });
    const behindEnemy = createEnemyAgent(0, -1, { health: 5, id: 'behind' });
    const registry = createEntityRegistry([hero.entity, outOfRangeEnemy.entity, behindEnemy.entity]);

    queueHeroAttack(hero);
    const result = updateCombat(hero, [outOfRangeEnemy, behindEnemy], registry, hero.attackActiveMs + 10);

    expect(result).toEqual({ targetsHit: 0, totalDamage: 0 });
    expect(outOfRangeEnemy.entity.components.health?.current).toBe(5);
    expect(behindEnemy.entity.components.health?.current).toBe(5);
  });
});

describe('health helpers', () => {
  it('applies armor mitigation with a minimum of 1 damage and updates alive state', () => {
    const target: EntityWithComponent<'health'> = {
      id: 'dummy',
      kind: 'enemy',
      position: { tileX: 0, tileY: 0, offsetX: 0, offsetY: 0 },
      sprite: { sheet: dummySheet, direction: 0, frame: 0 },
      components: {
        health: { current: 10, max: 10, isAlive: true, armor: 5 }
      }
    };

    const firstHit = applyDamage(target, 3);
    expect(firstHit).toBe(1);
    expect(target.components.health.current).toBe(9);
    const secondHit = applyDamage(target, 20);
    expect(secondHit).toBe(15);
    expect(target.components.health.current).toBe(0);
    expect(target.components.health.isAlive).toBe(false);
  });

  it('heals up to the max health and revives targets', () => {
    const target: EntityWithComponent<'health'> = {
      id: 'dummy',
      kind: 'enemy',
      position: { tileX: 0, tileY: 0, offsetX: 0, offsetY: 0 },
      sprite: { sheet: dummySheet, direction: 0, frame: 0 },
      components: {
        health: { current: 0, max: 10, isAlive: false }
      }
    };

    const healed = heal(target, 6);
    expect(healed).toBe(6);
    expect(target.components.health.current).toBe(6);
    expect(target.components.health.isAlive).toBe(true);
    const overheal = heal(target, 10);
    expect(overheal).toBe(4);
    expect(target.components.health.current).toBe(10);
  });
});
