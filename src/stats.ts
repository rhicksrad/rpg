import { EntityWithComponent } from './entities';

export type PrimaryStatKey = 'str' | 'dex' | 'int' | 'vit' | 'luck';
export type SecondaryStatKey = 'attack' | 'defense' | 'speed' | 'critChance' | 'dodge' | 'maxHp' | 'xpGain';

export type StatBlock = Record<PrimaryStatKey, number>;

export type SecondaryStats = Record<SecondaryStatKey, number>;

export function createDefaultStats(): StatBlock {
  return {
    str: 5,
    dex: 5,
    int: 5,
    vit: 5,
    luck: 5
  };
}

export function deriveSecondaryStats(stats: StatBlock, modifiers: Partial<SecondaryStats> = {}): SecondaryStats {
  const base: SecondaryStats = {
    attack: Math.round(stats.str * 2 + stats.dex * 0.5),
    defense: Math.round(stats.vit * 1.5 + stats.dex * 0.25),
    speed: 1 + stats.dex * 0.01,
    critChance: stats.luck * 0.005,
    dodge: stats.dex * 0.003,
    maxHp: 20 + stats.vit * 3,
    xpGain: 1
  };

  return {
    ...base,
    ...modifiers,
    attack: (base.attack + (modifiers.attack ?? 0)),
    defense: (base.defense + (modifiers.defense ?? 0)),
    speed: (base.speed + (modifiers.speed ?? 0)),
    critChance: base.critChance + (modifiers.critChance ?? 0),
    dodge: base.dodge + (modifiers.dodge ?? 0),
    maxHp: base.maxHp + (modifiers.maxHp ?? 0),
    xpGain: base.xpGain + (modifiers.xpGain ?? 0)
  };
}

export function applyDamage(target: EntityWithComponent<'health'>, rawDamage: number): number {
  const current = target.components.health.current;
  const mitigated = Math.max(1, Math.round(rawDamage - (target.components.health.armor ?? 0)));
  target.components.health.current = Math.max(0, current - mitigated);
  target.components.health.isAlive = target.components.health.current > 0;
  return mitigated;
}

export function heal(target: EntityWithComponent<'health'>, amount: number): number {
  const health = target.components.health;
  const before = health.current;
  health.current = Math.min(health.max, health.current + amount);
  health.isAlive = health.current > 0;
  return health.current - before;
}
