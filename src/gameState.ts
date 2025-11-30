export type GameMode = 'title' | 'playing' | 'paused' | 'dialogue' | 'inventory' | 'gameover';

export type GameState = {
  mode: GameMode;
};

export function createGameState(): GameState {
  return { mode: 'playing' };
}

export function togglePause(state: GameState): void {
  state.mode = state.mode === 'paused' ? 'playing' : 'paused';
}

export function toggleInventory(state: GameState): void {
  state.mode = state.mode === 'inventory' ? 'playing' : 'inventory';
}

export function setGameOver(state: GameState): void {
  state.mode = 'gameover';
}
