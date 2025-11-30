import './style.css';

type Vector = {
  x: number;
  y: number;
};

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement | null;

if (!canvas) {
  throw new Error('Canvas element not found');
}

const ctx = canvas.getContext('2d');

if (!ctx) {
  throw new Error('Unable to acquire 2D context');
}

const player = {
  position: { x: canvas.width / 2, y: canvas.height / 2 } as Vector,
  radius: 10,
  speed: 200 // pixels per second
};

const keys = new Set<string>();

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key)) {
    keys.add(key);
    event.preventDefault();
  }
});

window.addEventListener('keyup', (event) => {
  keys.delete(event.key.toLowerCase());
});

let lastTime = performance.now();

function update(deltaTime: number) {
  const delta = deltaTime / 1000;
  let dx = 0;
  let dy = 0;

  if (keys.has('arrowup') || keys.has('w')) dy -= 1;
  if (keys.has('arrowdown') || keys.has('s')) dy += 1;
  if (keys.has('arrowleft') || keys.has('a')) dx -= 1;
  if (keys.has('arrowright') || keys.has('d')) dx += 1;

  if (dx !== 0 || dy !== 0) {
    const length = Math.hypot(dx, dy) || 1;
    dx /= length;
    dy /= length;
    player.position.x += dx * player.speed * delta;
    player.position.y += dy * player.speed * delta;
  }

  const minX = player.radius;
  const minY = player.radius;
  const maxX = canvas.width - player.radius;
  const maxY = canvas.height - player.radius;

  player.position.x = clamp(player.position.x, minX, maxX);
  player.position.y = clamp(player.position.y, minY, maxY);
}

function render() {
  ctx.fillStyle = '#0f1115';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#f8e473';
  ctx.beginPath();
  ctx.arc(player.position.x, player.position.y, player.radius, 0, Math.PI * 2);
  ctx.fill();
}

function gameLoop(timestamp: number) {
  const deltaTime = timestamp - lastTime;
  lastTime = timestamp;

  update(deltaTime);
  render();
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
