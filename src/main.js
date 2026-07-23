import { io } from 'socket.io-client';
import { GameEngine } from './engine/GameEngine.js';

// DOM Elements
const canvas = document.getElementById('game-canvas');
const minimapCanvas = document.getElementById('minimap-canvas');

const loginModal = document.getElementById('login-modal');
const loginNicknameInput = document.getElementById('login-nickname');
const btnStartGame = document.getElementById('btn-start-game');

// Initialize Engine
const engine = new GameEngine(canvas, minimapCanvas);

// Connect Socket.io
const socket = io(window.location.origin.includes('5173') ? 'http://localhost:3000' : window.location.origin);

const keys = {};
let lastNetworkUpdate = 0;
let isChangingMap = false;

// Handle Window Resize
function onResize() {
  engine.resize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onResize);
onResize();

// Join Game
btnStartGame.addEventListener('click', () => {
  const nickname = loginNicknameInput.value.trim() || '모험가';
  socket.emit('joinGame', { nickname });
  loginModal.classList.add('hidden');
});

loginNicknameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    btnStartGame.click();
  }
});

// Socket Events
socket.on('initSelf', (data) => {
  engine.selfId = data.selfId;
  engine.localPlayer = data.player;
});

socket.on('gameState', (state) => {
  engine.players = state.players;

  if (engine.selfId && state.players[engine.selfId]) {
    const serverSelf = state.players[engine.selfId];
    if (!engine.localPlayer) {
      engine.localPlayer = serverSelf;
    }
  }
});

socket.on('mapChanged', (data) => {
  if (engine.localPlayer) {
    engine.localPlayer.mapId = data.mapId;
    engine.localPlayer.x = data.x;
    engine.localPlayer.y = data.y;
    engine.localPlayer.vx = 0;
    engine.localPlayer.vy = 0;
  }
  isChangingMap = false;
});

// Input Handlers
window.addEventListener('keydown', (e) => {
  keys[e.code] = true;

  // Check Portal Key Trigger (Up or W)
  if (engine.localPlayer && (e.code === 'KeyW' || e.code === 'ArrowUp') && !isChangingMap) {
    const currentMapId = engine.localPlayer.mapId || 'map1';
    const portal = engine.physics.getNearbyPortal(engine.localPlayer, currentMapId);

    if (portal) {
      isChangingMap = true;
      socket.emit('changeMap', {
        targetMap: portal.targetMap,
        targetX: portal.targetX,
        targetY: portal.targetY
      });
    }
  }
});

window.addEventListener('keyup', (e) => {
  keys[e.code] = false;
});

// Main Loop (60 FPS)
let lastTime = performance.now();
function gameLoop(now) {
  const dt = (now - lastTime) / 1000;
  lastTime = now;

  if (engine.localPlayer && loginModal.classList.contains('hidden')) {
    // 1. Update Local Player Physics
    engine.physics.updatePlayerPhysics(engine.localPlayer, keys);

    // 2. Send Movement to Server (~20Hz)
    if (now - lastNetworkUpdate > 50) {
      lastNetworkUpdate = now;
      socket.emit('playerUpdate', {
        mapId: engine.localPlayer.mapId || 'map1',
        x: Math.round(engine.localPlayer.x),
        y: Math.round(engine.localPlayer.y),
        vx: parseFloat(engine.localPlayer.vx.toFixed(2)),
        vy: parseFloat(engine.localPlayer.vy.toFixed(2)),
        facing: engine.localPlayer.facing,
        animState: engine.localPlayer.animState,
        isClimbing: engine.localPlayer.isClimbing
      });
    }
  }

  // 3. Render Game
  engine.render(dt);

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
