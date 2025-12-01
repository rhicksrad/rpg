import { HeroState } from './hero';
import { getCurrencyBalance, ITEM_DEFINITIONS } from './inventory';
import { QuestLog } from './quests';

export type HudElements = {
  container: HTMLElement;
  bars: { hp: HTMLElement; xp: HTMLElement };
  inventory: HTMLElement;
  quest: HTMLElement;
};

export function createHud(): HudElements {
  const container = document.createElement('div');
  container.className = 'hud-overlay';

  const panel = document.createElement('div');
  panel.className = 'hud-panel';

  const statusHeader = document.createElement('div');
  statusHeader.className = 'hud-section-title';
  statusHeader.textContent = 'Status';

  const hpBar = document.createElement('div');
  hpBar.className = 'hud-bar hp';

  const xpBar = document.createElement('div');
  xpBar.className = 'hud-bar xp';

  const barWrapper = document.createElement('div');
  barWrapper.className = 'hud-row hud-bars';
  barWrapper.appendChild(hpBar);
  barWrapper.appendChild(xpBar);

  const inventoryHeader = document.createElement('div');
  inventoryHeader.className = 'hud-section-title';
  inventoryHeader.textContent = 'Inventory';

  const inventory = document.createElement('div');
  inventory.className = 'hud-inventory';

  const questHeader = document.createElement('div');
  questHeader.className = 'hud-section-title';
  questHeader.textContent = 'Quest';

  const quest = document.createElement('div');
  quest.className = 'hud-quest';

  panel.appendChild(statusHeader);
  panel.appendChild(barWrapper);
  panel.appendChild(inventoryHeader);
  panel.appendChild(inventory);
  panel.appendChild(questHeader);
  panel.appendChild(quest);
  container.appendChild(panel);

  return {
    container,
    bars: { hp: hpBar, xp: xpBar },
    inventory,
    quest
  };
}

export function updateHud(hud: HudElements, hero: HeroState, questLog?: QuestLog): void {
  const health = hero.entity.components.health;
  const hpPercent = health ? Math.max(0, (health.current / health.max) * 100) : 0;
  hud.bars.hp.textContent = `HP ${health?.current ?? 0}/${health?.max ?? 0}`;
  hud.bars.hp.style.setProperty('--value', `${hpPercent}%`);

  const xpPercent = Math.min(100, (hero.xp / Math.max(1, Math.round(50 * hero.level * 1.25))) * 100);
  hud.bars.xp.textContent = `XP ${hero.xp} (Lv ${hero.level})`;
  hud.bars.xp.style.setProperty('--value', `${xpPercent}%`);

  const inventoryItems = hero.inventory.slots
    .map((slot) => `${ITEM_DEFINITIONS[slot.itemId]?.name ?? slot.itemId} x${slot.quantity}`)
    .join(' | ');
  const equipped = Object.entries(hero.inventory.equipped)
    .map(([slot, item]) => `${slot}: ${item ? ITEM_DEFINITIONS[item.itemId]?.name ?? item.itemId : 'None'}`)
    .join(' | ');

  const coins = getCurrencyBalance(hero.inventory);
  hud.inventory.textContent = `Purse: ${coins} coins | Inventory: ${inventoryItems || 'Empty'} | Equipped: ${equipped || 'None'}`;

  const activeQuest = questLog?.active;
  hud.quest.textContent = activeQuest
    ? `Active quest: ${activeQuest.title} — ${activeQuest.summary} (Head toward ${activeQuest.location}. Reward: ${activeQuest.rewardHint})`
    : 'No active quest. Speak with the old man in the town square to pick a path.';
}
