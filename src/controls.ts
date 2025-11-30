export type ControlState = {
  keys: Record<string, boolean>;
  consumeInteractRequest: () => boolean;
  consumeAttackRequest: () => boolean;
  consumeInventoryToggle: () => boolean;
  consumePauseToggle: () => boolean;
  pollGamepadInteract: () => boolean;
};

let interactRequested = false;
let attackRequested = false;
let inventoryToggleRequested = false;
let pauseToggleRequested = false;
let previousGamepadButtons: boolean[] = [];

export function setupControls(): ControlState {
  const keys: Record<string, boolean> = {};

  window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key)) {
      keys[key] = true;
      event.preventDefault();
    } else if (key === 'e' && !event.repeat) {
      interactRequested = true;
      event.preventDefault();
    } else if ((key === ' ' || key === 'j') && !event.repeat) {
      attackRequested = true;
      event.preventDefault();
    } else if (key === 'i' && !event.repeat) {
      inventoryToggleRequested = true;
      event.preventDefault();
    } else if (key === 'escape' && !event.repeat) {
      pauseToggleRequested = true;
      event.preventDefault();
    }
  });

  window.addEventListener('keyup', (event) => {
    const key = event.key.toLowerCase();
    delete keys[key];
  });

  return {
    keys,
    consumeInteractRequest,
    consumeAttackRequest,
    consumeInventoryToggle,
    consumePauseToggle,
    pollGamepadInteract
  };
}

function consumeInteractRequest(): boolean {
  const shouldInteract = interactRequested;
  interactRequested = false;
  return shouldInteract;
}

function consumeAttackRequest(): boolean {
  const shouldAttack = attackRequested;
  attackRequested = false;
  return shouldAttack;
}

function consumeInventoryToggle(): boolean {
  const toggle = inventoryToggleRequested;
  inventoryToggleRequested = false;
  return toggle;
}

function consumePauseToggle(): boolean {
  const toggle = pauseToggleRequested;
  pauseToggleRequested = false;
  return toggle;
}

function pollGamepadInteract(): boolean {
  const gamepads = navigator.getGamepads?.() ?? [];
  const primaryPad = gamepads.find((pad) => pad !== null);

  if (!primaryPad) {
    previousGamepadButtons = [];
    return false;
  }

  const pressedButtons = primaryPad.buttons.map((button) => button.pressed);
  const interactPressed = pressedButtons[0] && !previousGamepadButtons[0];
  previousGamepadButtons = pressedButtons;

  return interactPressed;
}
