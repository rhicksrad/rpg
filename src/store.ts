import { addItemToInventory, getCurrencyBalance, ITEM_DEFINITIONS, spendCurrency } from './inventory';
import type { HeroState } from './hero';

export type StoreItem = {
  itemId: string;
  price: number;
  blurb: string;
};

export const STORE_STOCK: StoreItem[] = [
  { itemId: 'potion', price: 8, blurb: 'Restores vitality mid-run.' },
  { itemId: 'warmth-salve', price: 12, blurb: 'Keeps chill at bay underground.' },
  { itemId: 'boots', price: 18, blurb: 'Add a spring to your step.' },
  { itemId: 'sword', price: 20, blurb: 'Reliable steel for new adventurers.' },
  { itemId: 'gear-sash', price: 28, blurb: 'Stitched to weather rough swings.' }
];

export function createStorefront(options: { getHero: () => HeroState; onClose?: () => void }) {
  const container = document.createElement('div');
  container.className = 'store-overlay hidden';

  const panel = document.createElement('div');
  panel.className = 'store-panel';

  const heading = document.createElement('div');
  heading.className = 'store-heading';
  heading.innerHTML = `<p class="store-title">Town Provisioner</p><p class="store-subtitle">Gear up before the trail.</p>`;

  const purse = document.createElement('div');
  purse.className = 'store-purse';

  const list = document.createElement('div');
  list.className = 'store-items';

  const message = document.createElement('div');
  message.className = 'store-message';

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'store-close';
  closeButton.textContent = 'Close shop';
  closeButton.addEventListener('click', () => close());

  function renderItems() {
    const hero = options.getHero();
    const coins = getCurrencyBalance(hero.inventory);
    purse.textContent = `Purse: ${coins} coins`;

    list.innerHTML = '';
    STORE_STOCK.forEach((item) => {
      const def = ITEM_DEFINITIONS[item.itemId];
      const card = document.createElement('div');
      card.className = 'store-item';

      const name = document.createElement('div');
      name.className = 'store-item-name';
      name.textContent = def?.name ?? item.itemId;

      const cost = document.createElement('div');
      cost.className = 'store-item-cost';
      cost.textContent = `${item.price} coins`;

      const desc = document.createElement('div');
      desc.className = 'store-item-blurb';
      desc.textContent = item.blurb;

      const buy = document.createElement('button');
      buy.type = 'button';
      buy.className = 'store-buy';
      buy.textContent = 'Purchase';
      buy.disabled = coins < item.price;
      buy.addEventListener('click', () => {
        const currentHero = options.getHero();
        const success = spendCurrency(currentHero.inventory, item.price);
        if (!success) {
          message.textContent = 'You need more coin for that.';
          return;
        }
        addItemToInventory(currentHero.inventory, item.itemId, 1);
        message.textContent = `Purchased ${def?.name ?? item.itemId}!`;
        renderItems();
      });

      card.appendChild(name);
      card.appendChild(cost);
      card.appendChild(desc);
      card.appendChild(buy);
      list.appendChild(card);
    });
  }

  function open() {
    renderItems();
    message.textContent = 'Welcome back, traveler. Take what you need.';
    container.classList.remove('hidden');
  }

  function close() {
    container.classList.add('hidden');
    options.onClose?.();
  }

  container.appendChild(panel);
  panel.appendChild(heading);
  panel.appendChild(purse);
  panel.appendChild(list);
  panel.appendChild(message);
  panel.appendChild(closeButton);

  return { container, open, close };
}
