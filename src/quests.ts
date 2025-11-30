export type Quest = {
  id: string;
  title: string;
  summary: string;
  location: string;
  rewardHint: string;
};

export type QuestDetail = {
  areaName: string;
  areas: { name: string; description: string }[];
  systems: string[];
  enemies: { name: string; behavior: string; drops?: string[] }[];
  boss: { name: string; title: string; mechanics: string[]; reward: string };
  items: string[];
  bonuses: string[];
};

export const QUESTS: Quest[] = [
  {
    id: 'echoing-depths',
    title: 'Echoing Depths',
    summary:
      'Venture into the damp cavern beneath the village well. The bats there carry crystals that glow brighter the deeper you go.',
    location: 'Well-side caverns to the south plaza',
    rewardHint: 'Return with three glow-crystals for a lantern polish and a pouch of coin.'
  },
  {
    id: 'timber-tunnels',
    title: 'Timber Tunnels',
    summary:
      'A mining tunnel north of the orchard collapsed, leaving tools and supplies trapped inside. Clear the rubble and recover what you can.',
    location: 'Collapsed tunnel beyond the northern fence',
    rewardHint: 'Hauling the lost gear back will earn you a sturdy woodcutter sash.'
  },
  {
    id: 'river-hollow',
    title: 'River Hollow',
    summary:
      'Follow the creek east until it vanishes underground. Strange lights flicker within—investigate and calm whatever stirs there.',
    location: 'Hidden creek cave in the eastern grove',
    rewardHint: 'Soothe the spirits to receive a charm that wards off chill and fear.'
  }
];

export const QUEST_DETAILS: Record<string, QuestDetail> = {
  'echoing-depths': {
    areaName: 'The Echoing Depths beneath the well',
    areas: [
      {
        name: 'Mossy Approach',
        description: 'Sloped stone tunnels with slick floors and narrow bridges over the wellspring pools.'
      },
      {
        name: 'Dripstone Gallery',
        description: 'Columns and stalactites that create cover but also funnel sound-based traps.'
      },
      {
        name: 'Crystal Nursery',
        description: 'A warm cavern where glow-crystals sprout near underground vents; guarded fiercely by colony leaders.'
      }
    ],
    systems: [
      'Echo pulses ring out every 12 seconds; stand behind stone columns to avoid stagger damage.',
      'Glowing pools cleanse poison but slow movement by 20% while wading.',
      'Crystal resonance: carrying three glow-crystals boosts lantern radius until you return to town.'
    ],
    enemies: [
      {
        name: 'Cave Bat',
        behavior: 'Dives in pairs when the lantern is dim; weak to upward strikes.',
        drops: ['glow-crystal', 'coin']
      },
      {
        name: 'Damp Slime',
        behavior: 'Splits once at half health and leaves slowing puddles.',
        drops: ['slime-gel']
      },
      {
        name: 'Tunnel Rat',
        behavior: 'Circles lantern light and steals coins unless interrupted.'
      }
    ],
    boss: {
      name: 'Lumina Broodmother',
      title: 'Matriarch of the crystals',
      mechanics: [
        'Alternates between spawning bat swarms and firing piercing crystal lances.',
        'Shatters pillars at 50% health, reducing available cover.',
        'Enrages if you linger in darkness—keep lantern stacks active.'
      ],
      reward: 'Broodmother Lamp housing: permanent +1 tile light radius and a pouch of coin.'
    },
    items: ['Glow-crystal', 'Lantern polish', 'Broodmother lamp housing', 'Coin pouch'],
    bonuses: ['+10% vision radius in caverns', '+1 heart from crystal-infused berries', 'Chance to spawn extra glow-crystals']
  },
  'timber-tunnels': {
    areaName: 'Collapsed Timber Tunnels north of the orchard',
    areas: [
      {
        name: 'Splintered Entry',
        description: 'Broken beams and swinging lanterns; falling debris hazards tick every few seconds.'
      },
      {
        name: 'Tool Cache',
        description: 'Side chambers with abandoned gear crates that can be pried open for supplies.'
      },
      {
        name: 'Old Mine Cartway',
        description: 'Straightaways perfect for charge attacks but patrolled by shielded foremen.'
      }
    ],
    systems: [
      'Shoring beams can be repaired with found planks to disable cave-in traps for two minutes.',
      'Rolling mine carts can be pushed to stun armored foes and break weak walls.',
      'Air pockets refresh stamina; fighting too long in dusty zones slowly drains stamina regeneration.'
    ],
    enemies: [
      {
        name: 'Pickaxer',
        behavior: 'Lunges in a straight line and is vulnerable during recovery.',
        drops: ['timber-plank', 'coin']
      },
      {
        name: 'Shield Foreman',
        behavior: 'Blocks frontal hits; bait a cart into them or circle to flank.',
        drops: ['gear-sash']
      },
      {
        name: 'Burrowing Mole',
        behavior: 'Erupts from marked soft dirt; hitting them mid-burrow yields bonus loot.'
      }
    ],
    boss: {
      name: 'Redwood Warden',
      title: 'Ancient treant bound in the mine',
      mechanics: [
        'Roots cage the arena; sever glowing roots to drop its bark armor.',
        'Hurls boulders that create lasting rough terrain slowing everyone.',
        'Summons saplings that buff its defense unless burned by lantern oil pickups.'
      ],
      reward: 'Woodcutter Sash (defense +1, carry weight +2) and a cache of repair tools.'
    },
    items: ['Gear sash', 'Timber plank', 'Lantern oil', 'Collapsed map scrap'],
    bonuses: ['Cart impacts deal +25% damage this run', '+5% move speed on gravel', 'Finds extra ore in destructible walls']
  },
  'river-hollow': {
    areaName: 'River Hollow beneath the eastern creek',
    areas: [
      {
        name: 'Mistfall Cavern',
        description: 'Chill fog halves visibility but hides spirit braziers that grant warmth buffs.'
      },
      {
        name: 'Flooded Causeway',
        description: 'Alternating dry stones and knee-high water that can carry you into whirlpools if mistimed.'
      },
      {
        name: 'Silent Shrine',
        description: 'Ancient runes project fear auras; lighting all braziers dispels them for safer travel.'
      }
    ],
    systems: [
      'Cold exposure slowly chips hearts unless warmed at spirit braziers.',
      'Currents move on a predictable rhythm; ride them to secret ledges with relic chests.',
      'Spirit calm meter: defeating enemies without taking damage fills the meter, pacifying nearby spirits temporarily.'
    ],
    enemies: [
      {
        name: 'River Wisp',
        behavior: 'Phases after every second hit; vulnerable when channeling cold orbs.',
        drops: ['spirit-charm']
      },
      {
        name: 'Leechling',
        behavior: 'Attaches on contact to drain stamina; roll to shake them off.',
        drops: ['coin']
      },
      {
        name: 'Bog Strider',
        behavior: 'Uses reach attacks over water and leaps back when threatened.'
      }
    ],
    boss: {
      name: 'Kelpie Sovereign',
      title: 'Keeper of the Hollow',
      mechanics: [
        'Shifts between water and mist forms; only melee vulnerable while corporeal.',
        'Summons whirlpools that pull you off safe stones; interrupt with brazier light pulses.',
        'Roars inflict fear unless wearing warmth charms or standing near lit braziers.'
      ],
      reward: 'Charm of Still Waters (resist chill and fear) and a chest of creek pearls.'
    },
    items: ['Spirit charm', 'Creek pearls', 'Warmth salve', 'River map etching'],
    bonuses: ['+10% stamina regen in cold areas', 'Fear duration halved', 'Bonus pearls for flawless skirmishes']
  }
};

export function createQuestOverlay(quests: Quest[], onClose?: () => void) {
  const container = document.createElement('div');
  container.className = 'quest-overlay hidden';

  const panel = document.createElement('div');
  panel.className = 'quest-panel';

  const heading = document.createElement('div');
  heading.className = 'quest-heading';
  heading.innerHTML = `<p class="quest-speaker">Old Man</p><p class="quest-line">&ldquo;Thee choose from my quests of three.&rdquo;</p>`;

  const explainer = document.createElement('p');
  explainer.className = 'quest-explainer';
  explainer.textContent = 'Each path leads into a sub-area that opens like a cave or tunnel. Pick the peril that suits you, traveler.';

  const questList = document.createElement('div');
  questList.className = 'quest-list';

  quests.forEach((quest) => {
    const card = document.createElement('article');
    card.className = 'quest-card';

    const title = document.createElement('h3');
    title.textContent = quest.title;

    const location = document.createElement('p');
    location.className = 'quest-location';
    location.textContent = quest.location;

    const summary = document.createElement('p');
    summary.textContent = quest.summary;

    const reward = document.createElement('p');
    reward.className = 'quest-reward';
    reward.textContent = quest.rewardHint;

    const detail = QUEST_DETAILS[quest.id];

    card.appendChild(title);
    card.appendChild(location);
    card.appendChild(summary);
    card.appendChild(reward);

    if (detail) {
      const areaName = document.createElement('p');
      areaName.className = 'quest-area-name';
      areaName.textContent = detail.areaName;

      const areaList = document.createElement('ul');
      areaList.className = 'quest-bullets';
      detail.areas.forEach((area) => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${area.name}:</strong> ${area.description}`;
        areaList.appendChild(li);
      });

      const systemList = document.createElement('ul');
      systemList.className = 'quest-bullets';
      detail.systems.forEach((system) => {
        const li = document.createElement('li');
        li.textContent = system;
        systemList.appendChild(li);
      });

      const enemies = document.createElement('ul');
      enemies.className = 'quest-bullets';
      detail.enemies.forEach((enemy) => {
        const li = document.createElement('li');
        const drops = enemy.drops?.length ? ` Drops: ${enemy.drops.join(', ')}.` : '';
        li.innerHTML = `<strong>${enemy.name}:</strong> ${enemy.behavior}${drops}`;
        enemies.appendChild(li);
      });

      const boss = document.createElement('div');
      boss.className = 'quest-boss';
      boss.innerHTML = `<p class="quest-boss-name">${detail.boss.name}, ${detail.boss.title}</p>`;
      const bossMechanics = document.createElement('ul');
      bossMechanics.className = 'quest-bullets';
      detail.boss.mechanics.forEach((mech) => {
        const li = document.createElement('li');
        li.textContent = mech;
        bossMechanics.appendChild(li);
      });
      const bossReward = document.createElement('p');
      bossReward.className = 'quest-reward';
      bossReward.textContent = `Reward: ${detail.boss.reward}`;
      boss.append(bossMechanics, bossReward);

      const items = document.createElement('p');
      items.className = 'quest-detail-line';
      items.textContent = `Key items: ${detail.items.join(', ')}.`;

      const bonuses = document.createElement('ul');
      bonuses.className = 'quest-bullets';
      detail.bonuses.forEach((bonus) => {
        const li = document.createElement('li');
        li.textContent = bonus;
        bonuses.appendChild(li);
      });

      const section = document.createElement('div');
      section.className = 'quest-detail';

      const areaHeader = document.createElement('p');
      areaHeader.className = 'quest-detail-heading';
      areaHeader.textContent = 'Areas';
      const systemHeader = document.createElement('p');
      systemHeader.className = 'quest-detail-heading';
      systemHeader.textContent = 'Systems & hazards';
      const enemyHeader = document.createElement('p');
      enemyHeader.className = 'quest-detail-heading';
      enemyHeader.textContent = 'Enemies';
      const bossHeader = document.createElement('p');
      bossHeader.className = 'quest-detail-heading';
      bossHeader.textContent = 'Boss';
      const bonusHeader = document.createElement('p');
      bonusHeader.className = 'quest-detail-heading';
      bonusHeader.textContent = 'Bonuses';

      section.append(areaName, areaHeader, areaList, systemHeader, systemList, enemyHeader, enemies, bossHeader, boss, items, bonusHeader, bonuses);
      card.appendChild(section);
    }
    questList.appendChild(card);
  });

  const footer = document.createElement('div');
  footer.className = 'quest-footer';

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.textContent = 'Return to the square';
  closeButton.addEventListener('click', () => {
    container.classList.add('hidden');
    onClose?.();
  });

  footer.appendChild(closeButton);

  panel.appendChild(heading);
  panel.appendChild(explainer);
  panel.appendChild(questList);
  panel.appendChild(footer);

  container.appendChild(panel);

  return {
    container,
    open: () => container.classList.remove('hidden'),
    close: () => {
      container.classList.add('hidden');
      onClose?.();
    }
  };
}
