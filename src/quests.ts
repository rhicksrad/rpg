export type Quest = {
  id: string;
  title: string;
  summary: string;
  location: string;
  rewardHint: string;
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

    card.appendChild(title);
    card.appendChild(location);
    card.appendChild(summary);
    card.appendChild(reward);
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
