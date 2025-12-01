import { TILE_SIZE } from './assets';
import { HeroState, getHeroPixelPosition } from './hero';
import { Inventory, ITEM_DEFINITIONS } from './inventory';

const RARITY_COLORS: Record<string, string> = {
  common: '#f2f2f2',
  uncommon: '#8de0a6',
  rare: '#7bd0ff',
  epic: '#ffb347'
};

export function getEquippedWeaponId(inventory: Inventory): string | null {
  return inventory.equipped.weapon?.itemId ?? null;
}

export function computeWeaponDamage(hero: HeroState): number {
  const weaponId = getEquippedWeaponId(hero.inventory);
  const weaponBonus = weaponId ? ITEM_DEFINITIONS[weaponId]?.modifiers?.attack ?? 0 : 0;
  return Math.max(1, hero.secondary.attack + weaponBonus);
}

export function drawWeaponSwing(
  ctx: CanvasRenderingContext2D,
  hero: HeroState,
  camera: { x: number; y: number }
): void {
  if (hero.attackTimerMs <= 0) return;

  const totalSwingMs = hero.attackWindupMs + hero.attackActiveMs;
  const elapsed = totalSwingMs - hero.attackTimerMs;
  const normalized = Math.min(Math.max(elapsed / totalSwingMs, 0), 1);
  const isActive = hero.attackTimerMs <= hero.attackWindupMs;
  const alpha = isActive ? 0.9 : 0.55;

  const weaponId = getEquippedWeaponId(hero.inventory);
  const weaponRarity = weaponId ? ITEM_DEFINITIONS[weaponId]?.rarity ?? 'common' : 'common';
  const color = RARITY_COLORS[weaponRarity] ?? '#f2f2f2';

  const { x, y } = getHeroPixelPosition(hero);
  const centerX = x - camera.x + TILE_SIZE / 2;
  const centerY = y - camera.y + TILE_SIZE / 2;

  const reach = TILE_SIZE * 1.2;
  const arcWidth = TILE_SIZE * 0.38;
  const angleLookup: Record<number, number> = {
    0: Math.PI / 2,
    1: Math.PI,
    2: 0,
    3: -Math.PI / 2
  };
  const baseAngle = angleLookup[hero.entity.sprite.direction] ?? 0;
  const sweep = Math.PI * 0.85 * normalized;
  const startAngle = baseAngle - sweep / 2;
  const endAngle = baseAngle + sweep / 2;

  ctx.save();
  ctx.lineWidth = arcWidth;
  ctx.lineCap = 'round';
  ctx.strokeStyle = color;
  ctx.globalAlpha = alpha;
  ctx.shadowBlur = 8;
  ctx.shadowColor = color;
  ctx.beginPath();
  ctx.arc(centerX, centerY, reach, startAngle, endAngle);
  ctx.stroke();
  ctx.restore();
}
