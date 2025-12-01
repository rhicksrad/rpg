export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic';
export type ItemCategory = 'consumable' | 'currency' | 'equipment' | 'quest';

export type EquipmentSlot = 'weapon' | 'armor' | 'accessory';

export type ItemDefinition = {
  id: string;
  name: string;
  category: ItemCategory;
  stackSize: number;
  rarity: ItemRarity;
  slot?: EquipmentSlot;
  modifiers?: Partial<Record<'attack' | 'defense' | 'speed' | 'maxHp', number>>;
  healAmount?: number;
};

export type ItemStack = { itemId: string; quantity: number };

export type Inventory = {
  slots: ItemStack[];
  hotbar: ItemStack[];
  equipped: Partial<Record<EquipmentSlot, ItemStack>>;
  maxSlots: number;
};

export function getCurrencyBalance(inventory: Inventory): number {
  return inventory.slots
    .filter((slot) => slot.itemId === 'coin')
    .reduce((total, slot) => total + slot.quantity, 0);
}

export function earnCurrency(inventory: Inventory, amount: number): void {
  if (amount <= 0) return;
  addItemToInventory(inventory, 'coin', amount);
}

export function spendCurrency(inventory: Inventory, amount: number): boolean {
  if (amount <= 0) return true;
  const available = getCurrencyBalance(inventory);
  if (available < amount) return false;

  let remaining = amount;
  inventory.slots = inventory.slots
    .map((stack) => {
      if (stack.itemId !== 'coin' || remaining <= 0) return stack;
      const spend = Math.min(stack.quantity, remaining);
      remaining -= spend;
      return { ...stack, quantity: stack.quantity - spend };
    })
    .filter((stack) => stack.quantity > 0);

  return remaining === 0;
}

export const ITEM_DEFINITIONS: Record<string, ItemDefinition> = {
  coin: {
    id: 'coin',
    name: 'Coin',
    category: 'currency',
    stackSize: 999,
    rarity: 'common'
  },
  heart: {
    id: 'heart',
    name: 'Heart',
    category: 'consumable',
    stackSize: 5,
    rarity: 'uncommon',
    healAmount: 5
  },
  potion: {
    id: 'potion',
    name: 'Potion',
    category: 'consumable',
    stackSize: 10,
    rarity: 'uncommon',
    healAmount: 10
  },
  sword: {
    id: 'sword',
    name: 'Rusty Sword',
    category: 'equipment',
    stackSize: 1,
    rarity: 'common',
    slot: 'weapon',
    modifiers: { attack: 5 }
  },
  boots: {
    id: 'boots',
    name: 'Traveler Boots',
    category: 'equipment',
    stackSize: 1,
    rarity: 'uncommon',
    slot: 'armor',
    modifiers: { speed: 0.1 }
  },
  'glow-crystal': {
    id: 'glow-crystal',
    name: 'Glow Crystal',
    category: 'quest',
    stackSize: 10,
    rarity: 'uncommon'
  },
  'lantern-polish': {
    id: 'lantern-polish',
    name: 'Lantern Polish',
    category: 'consumable',
    stackSize: 5,
    rarity: 'uncommon'
  },
  'coin-pouch': {
    id: 'coin-pouch',
    name: 'Coin Pouch',
    category: 'currency',
    stackSize: 3,
    rarity: 'uncommon'
  },
  'slime-gel': {
    id: 'slime-gel',
    name: 'Slime Gel',
    category: 'quest',
    stackSize: 10,
    rarity: 'common'
  },
  'timber-plank': {
    id: 'timber-plank',
    name: 'Timber Plank',
    category: 'quest',
    stackSize: 20,
    rarity: 'common'
  },
  'gear-sash': {
    id: 'gear-sash',
    name: 'Gear Sash',
    category: 'equipment',
    stackSize: 1,
    rarity: 'rare',
    slot: 'armor',
    modifiers: { defense: 2 }
  },
  'lantern-oil': {
    id: 'lantern-oil',
    name: 'Lantern Oil',
    category: 'consumable',
    stackSize: 5,
    rarity: 'uncommon'
  },
  'woodcutter-sash': {
    id: 'woodcutter-sash',
    name: 'Woodcutter Sash',
    category: 'equipment',
    stackSize: 1,
    rarity: 'rare',
    slot: 'armor',
    modifiers: { defense: 3, maxHp: 2 }
  },
  'spirit-charm': {
    id: 'spirit-charm',
    name: 'Spirit Charm',
    category: 'equipment',
    stackSize: 1,
    rarity: 'rare',
    slot: 'accessory',
    modifiers: { defense: 1 }
  },
  'warmth-salve': {
    id: 'warmth-salve',
    name: 'Warmth Salve',
    category: 'consumable',
    stackSize: 5,
    rarity: 'uncommon',
    healAmount: 8
  },
  'river-etching': {
    id: 'river-etching',
    name: 'River Map Etching',
    category: 'quest',
    stackSize: 5,
    rarity: 'uncommon'
  },
  'still-water-charm': {
    id: 'still-water-charm',
    name: 'Charm of Still Waters',
    category: 'equipment',
    stackSize: 1,
    rarity: 'rare',
    slot: 'accessory',
    modifiers: { defense: 2 }
  },
  'creek-pearl': {
    id: 'creek-pearl',
    name: 'Creek Pearl',
    category: 'currency',
    stackSize: 50,
    rarity: 'uncommon'
  },
  'broodmother-lamp': {
    id: 'broodmother-lamp',
    name: 'Broodmother Lamp Housing',
    category: 'equipment',
    stackSize: 1,
    rarity: 'epic',
    slot: 'accessory',
    modifiers: { speed: 0.05, maxHp: 3 }
  }
};

export function createInventory(): Inventory {
  return {
    slots: [],
    hotbar: [],
    equipped: {},
    maxSlots: 20
  };
}

export function addItemToInventory(inventory: Inventory, itemId: string, quantity = 1): boolean {
  const definition = ITEM_DEFINITIONS[itemId];
  if (!definition) return false;

  let remaining = quantity;

  // Try to stack existing entries first
  inventory.slots.forEach((stack) => {
    if (stack.itemId === itemId && remaining > 0) {
      const definition = ITEM_DEFINITIONS[itemId];
      const space = definition.stackSize - stack.quantity;
      const toAdd = Math.min(space, remaining);
      stack.quantity += toAdd;
      remaining -= toAdd;
    }
  });

  while (remaining > 0 && inventory.slots.length < inventory.maxSlots) {
    const toAdd = Math.min(remaining, definition.stackSize);
    inventory.slots.push({ itemId, quantity: toAdd });
    remaining -= toAdd;
  }

  return remaining === 0;
}

export function consumeItem(inventory: Inventory, itemId: string): boolean {
  const stack = inventory.slots.find((entry) => entry.itemId === itemId && entry.quantity > 0);
  if (!stack) return false;
  stack.quantity -= 1;
  if (stack.quantity <= 0) {
    inventory.slots = inventory.slots.filter((entry) => entry.quantity > 0);
  }
  return true;
}

export function equipItem(inventory: Inventory, itemId: string): boolean {
  const def = ITEM_DEFINITIONS[itemId];
  if (!def || def.category !== 'equipment' || !def.slot) return false;
  const hadItem = consumeItem(inventory, itemId);
  if (!hadItem) return false;
  inventory.equipped[def.slot] = { itemId, quantity: 1 };
  return true;
}

export function inventorySummary(inventory: Inventory): string {
  if (!inventory.slots.length) return 'Empty';
  return inventory.slots
    .map((stack) => `${ITEM_DEFINITIONS[stack.itemId]?.name ?? stack.itemId} x${stack.quantity}`)
    .join(', ');
}
