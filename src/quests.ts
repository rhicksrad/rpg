export type Quest = {
  id: string;
  title: string;
  summary: string;
  location: string;
  rewardHint: string;
  rewardCoins: number;
};

export type QuestLog = {
  available: Quest[];
  active: Quest | null;
  completed: Quest[];
};

export function createQuestLog(quests: Quest[]): QuestLog {
  return {
    available: [...quests],
    active: null,
    completed: []
  };
}

export function acceptQuest(log: QuestLog, questId: string): Quest | null {
  const quest = log.available.find((q) => q.id === questId) ?? log.completed.find((q) => q.id === questId);
  if (!quest) return log.active?.id === questId ? log.active : null;

  if (log.active && log.active.id !== questId && !log.completed.find((completedQuest) => completedQuest.id === log.active?.id)) {
    log.available = [log.active, ...log.available.filter((q) => q.id !== log.active?.id)];
  }

  log.available = log.available.filter((q) => q.id !== questId);
  log.active = quest;
  return quest;
}

export function completeActiveQuest(log: QuestLog): Quest | null {
  if (!log.active) return null;
  const finished = log.active;
  log.completed = [...log.completed, finished];
  log.active = null;
  return finished;
}

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
    rewardHint: 'Return with three glow-crystals for a lantern polish and a pouch of coin.',
    rewardCoins: 24
  },
  {
    id: 'timber-tunnels',
    title: 'Timber Tunnels',
    summary:
      'A mining tunnel north of the orchard collapsed, leaving tools and supplies trapped inside. Clear the rubble and recover what you can.',
    location: 'Collapsed tunnel beyond the northern fence',
    rewardHint: 'Hauling the lost gear back will earn you a sturdy woodcutter sash.',
    rewardCoins: 30
  },
  {
    id: 'river-hollow',
    title: 'River Hollow',
    summary:
      'Follow the creek east until it vanishes underground. Strange lights flicker within—investigate and calm whatever stirs there.',
    location: 'Hidden creek cave in the eastern grove',
    rewardHint: 'Soothe the spirits to receive a charm that wards off chill and fear.',
    rewardCoins: 36
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

export function createQuestOverlay(
  questLog: QuestLog,
  options?: { onAccept?: (quest: Quest) => void; onComplete?: (quest: Quest) => void; onClose?: () => void }
) {
  const container = document.createElement('div');
  container.className = 'quest-overlay hidden';

  const panel = document.createElement('div');
  panel.className = 'quest-panel';

  const heading = document.createElement('div');
  heading.className = 'quest-heading';
  heading.innerHTML = `<p class="quest-speaker">Old Man</p><p class="quest-line">&ldquo;Come closer, traveler.&rdquo;</p>`;

  const dialogue = document.createElement('div');
  dialogue.className = 'quest-dialogue';

  const optionsList = document.createElement('div');
  optionsList.className = 'quest-options';

  const setDialogue = (lines: string[]) => {
    dialogue.innerHTML = '';
    lines.forEach((line) => {
      const p = document.createElement('p');
      p.textContent = line;
      dialogue.appendChild(p);
    });
  };

  const addOption = (label: string, handler: () => void, helper?: string) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'quest-option';
    button.innerHTML = helper ? `<strong>${label}</strong><span>${helper}</span>` : label;
    button.addEventListener('click', handler);
    optionsList.appendChild(button);
  };

  const close = () => {
    container.classList.add('hidden');
    options?.onClose?.();
  };

  const completeQuest = (quest: Quest) => {
    if (questLog.active?.id !== quest.id) {
      setDialogue([`"You've nothing to report on ${quest.title} yet," the old man says.`]);
      optionsList.innerHTML = '';
      addOption('Understood.', renderGreeting);
      return;
    }

    const finished = completeActiveQuest(questLog);
    if (!finished) return;
    options?.onComplete?.(finished);
    setDialogue([
      'The old man nods appreciatively.',
      `"${finished.title}" is done. The village is safer for it.`,
      `He presses ${finished.rewardCoins} coins into your palm.`
    ]);
    optionsList.innerHTML = '';
    addOption('Happy to help.', renderGreeting);
  };

  const renderQuestReminder = (quest: Quest) => {
    setDialogue([
      'The old man strokes his beard thoughtfully.',
      `"You're already walking the path of ${quest.title}.", he says.`,
      quest.summary,
      `Head toward ${quest.location} and remember: ${quest.rewardHint}`
    ]);

    optionsList.innerHTML = '';
    addOption('I have returned with what you asked.', () => completeQuest(quest));
    addOption('I will return soon.', close);
    addOption('What other work do you have?', renderGreeting);
  };

  const renderAccepted = (quest: Quest) => {
    setDialogue([
      `"Good. I'll mark the ${quest.location.toLowerCase()} on your map," the old man nods.`,
      `"Return with news of ${quest.title}. The village is counting on you."`
    ]);
    optionsList.innerHTML = '';
    addOption('I will get moving.', close);
    addOption('Anything else before I go?', renderGreeting);
  };

  const renderQuestConversation = (quest: Quest) => {
    const detail = QUEST_DETAILS[quest.id];
    const hook = detail?.areas[0]?.description ?? quest.summary;
    const danger = detail?.systems[0] ?? 'Expect trouble in the depths.';

    setDialogue([
      `The old man leans in. "There is a way into ${quest.title}.", he whispers.`,
      hook,
      `The hazards? ${danger}`,
      `Return with what you can; ${quest.rewardHint}`
    ]);

    optionsList.innerHTML = '';

    if (questLog.active?.id === quest.id) {
      addOption(`I have finished ${quest.title}.`, () => completeQuest(quest), `${quest.rewardCoins} coins on completion.`);
      addOption('I remember—let me get back to it.', close);
    } else {
      addOption('I will take this on.', () => {
        const accepted = acceptQuest(questLog, quest.id);
        if (accepted) {
          options?.onAccept?.(accepted);
        }
        renderAccepted(quest);
      });
    }

    addOption('Tell me about something else.', renderGreeting);
  };

  function renderCompletedLog() {
    setDialogue([
      'The old man smiles faintly.',
      '"You have already helped with these matters," he says, tapping his staff on the ground.'
    ]);

    optionsList.innerHTML = '';
    questLog.completed.forEach((quest) => {
      addOption(quest.title, () => {
        setDialogue([
          `"${quest.title}" is behind us now, thanks to you.`,
          `I still recall the trek ${quest.location.toLowerCase()}.`
        ]);
        optionsList.innerHTML = '';
        addOption('Anything else?', renderGreeting);
      });
    });

    addOption('Back to business.', renderGreeting);
  }

  function renderGreeting() {
    const openingLine =
      questLog.active && questLog.active.id
        ? '"Back again? The path you chose still awaits," the old man notes.'
        : '"Looking for work? The wilds groan with trouble," the old man offers.';

    setDialogue([
      openingLine,
      '"Ask, and I will point you toward a path."'
    ]);

    optionsList.innerHTML = '';

    if (questLog.active) {
      addOption(`Remind me about ${questLog.active.title}.`, () => renderQuestReminder(questLog.active as Quest));
      addOption('I have news from the wilds.', () => completeQuest(questLog.active as Quest), 'Turn in your current job.');
    }

    questLog.available.forEach((quest) => {
      addOption(`Ask about ${quest.title}`, () => renderQuestConversation(quest), quest.location);
    });

    if (questLog.completed.length) {
      addOption('How have my efforts helped?', renderCompletedLog);
    }

    addOption('I need to go.', close);
  }

  panel.appendChild(heading);
  panel.appendChild(dialogue);
  panel.appendChild(optionsList);

  container.appendChild(panel);

  return {
    container,
    open: () => {
      renderGreeting();
      container.classList.remove('hidden');
    },
    close
  };
}
