import { AgentState } from './agents';
import { EntityRegistry, EntityWithComponent } from './entities';
import { gainExperience, HeroState } from './hero';
import { ITEM_DEFINITIONS } from './inventory';
import { applyDamage } from './stats';

export type AttackResult = {
  targetsHit: number;
  totalDamage: number;
};

export const ATTACK_RANGE_TILES = 1.1;

export function queueHeroAttack(hero: HeroState): void {
  if (hero.attackTimerMs <= 0) {
    hero.attackTimerMs = hero.attackWindupMs + hero.attackActiveMs;
    hero.attackQueued = true;
  }
}

export function updateCombat(
  hero: HeroState,
  agents: AgentState[],
  registry: EntityRegistry,
  deltaMs: number
): AttackResult {
  let result: AttackResult = { targetsHit: 0, totalDamage: 0 };

  if (hero.attackTimerMs > 0) {
    hero.attackTimerMs -= deltaMs;
    const activeWindowStart = hero.attackWindupMs;
    const inActiveWindow = hero.attackTimerMs <= activeWindowStart;

    if (inActiveWindow && hero.attackQueued) {
      const heroPos = hero.entity.position;
      const facing = hero.entity.sprite.direction;
      agents.forEach((agent) => {
        if (agent.entity.kind !== 'enemy' || !agent.entity.components.health?.isAlive) return;
        const dx = agent.entity.position.tileX - heroPos.tileX;
        const dy = agent.entity.position.tileY - heroPos.tileY;
        const distance = Math.hypot(dx, dy);
        if (distance <= ATTACK_RANGE_TILES && isInFront(facing, dx, dy)) {
          const damage = Math.max(1, hero.secondary.attack);
          const hitDamage = applyDamage(agent.entity as EntityWithComponent<'health'>, damage);
          agent.hitFlashMs = 180;
          result.targetsHit += 1;
          result.totalDamage += hitDamage;
          if (!agent.entity.components.health.isAlive) {
            agent.isAlive = false;
            registry.remove(agent.entity.id);
            gainExperience(hero, 10);
            agent.drops?.forEach((drop) => {
              const def = ITEM_DEFINITIONS[drop];
              if (def) {
                hero.inventory.hotbar.push({ itemId: drop, quantity: 1 });
              }
            });
          }
        }
      });
      hero.attackQueued = false;
    }
  }

  return result;
}

function isInFront(direction: number, dx: number, dy: number): boolean {
  switch (direction) {
    case 0:
      return dy >= 0 && Math.abs(dx) <= Math.abs(dy);
    case 3:
      return dy <= 0 && Math.abs(dx) <= Math.abs(dy);
    case 1:
      return dx <= 0 && Math.abs(dy) <= Math.abs(dx);
    case 2:
      return dx >= 0 && Math.abs(dy) <= Math.abs(dx);
    default:
      return true;
  }
}
