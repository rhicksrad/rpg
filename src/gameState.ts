import { QuestLog } from './quests';

export type GameMode = 'title' | 'playing' | 'paused' | 'dialogue' | 'inventory' | 'gameover';

export type GameState = {
  mode: GameMode;
  questLog: QuestLog;
};

export function createGameState(questLog: QuestLog): GameState {
  return { mode: 'playing', questLog };
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
