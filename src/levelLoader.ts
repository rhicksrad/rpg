import type { LevelData } from './levels';

export function levelTilesToGrid(level: LevelData): number[][] {
  if (level.tiles.length !== level.width * level.height) {
    throw new Error(`Level ${level.id} tile data is inconsistent with dimensions`);
  }

  const grid: number[][] = [];

  for (let row = 0; row < level.height; row += 1) {
    const start = row * level.width;
    grid.push(level.tiles.slice(start, start + level.width));
  }

  return grid;
}

export function createLevelLoader(
  levels: LevelData[],
  onSelect: (levelId: string) => void,
  onNext: () => void
): { container: HTMLDivElement; select: HTMLSelectElement } {
  const container = document.createElement('div');
  container.className = 'level-loader';

  const label = document.createElement('label');
  label.textContent = 'Load level:';

  const select = document.createElement('select');
  select.ariaLabel = 'Select level';

  levels.forEach((level) => {
    const option = document.createElement('option');
    option.value = level.id;
    option.textContent = level.levelName;
    select.appendChild(option);
  });

  select.addEventListener('change', () => onSelect(select.value));

  const nextButton = document.createElement('button');
  nextButton.type = 'button';
  nextButton.textContent = 'Next level';
  nextButton.addEventListener('click', onNext);

  container.append(label, select, nextButton);

  return { container, select };
}
