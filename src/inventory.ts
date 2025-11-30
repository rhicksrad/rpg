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
