# Top-down NES-style RPG sandbox

A minimal canvas-based prototype for experimenting with NES-inspired top-down RPG mechanics. Built with TypeScript, Vite, pnpm, and Node 20.

## Stack
- TypeScript
- Vite
- pnpm
- Node 20

## Setup
1. `nvm use` (ensure Node 20)
2. `pnpm install`
3. `pnpm dev`
4. `pnpm run build`

## Demo
The page renders a single yellow dot on an 800x600 canvas. Move it with Arrow Keys or WASD. Movement is clamped within the canvas bounds using a simple update/render loop driven by `requestAnimationFrame`.
