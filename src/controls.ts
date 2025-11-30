export type ControlState = {
  keys: Record<string, boolean>;
  consumeInteractRequest: () => boolean;
  pollGamepadInteract: () => boolean;
};

let interactRequested = false;
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
    }
  });

  window.addEventListener('keyup', (event) => {
    const key = event.key.toLowerCase();
    delete keys[key];
  });

  return {
    keys,
    consumeInteractRequest,
    pollGamepadInteract
  };
}

function consumeInteractRequest(): boolean {
  const shouldInteract = interactRequested;
  interactRequested = false;
  return shouldInteract;
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
