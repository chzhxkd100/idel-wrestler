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
  if (!engine.localPlayer.equipment) {
    engine.localPlayer.equipment = {
      hat: 'knight_helm',
      top: 'knight_plate',
      bottom: 'steel_pants',
      weapon: 'magic_sword'
    };
  }
});

socket.on('gameState', (state) => {
  // Preserve lerp render coordinates for remote players
  Object.keys(state.players).forEach(id => {
    if (engine.players[id]) {
      state.players[id].renderX = engine.players[id].renderX;
      state.players[id].renderY = engine.players[id].renderY;
    }
  });

  engine.players = state.players;

  if (engine.selfId && state.players[engine.selfId]) {
    const serverSelf = state.players[engine.selfId];
    if (!engine.localPlayer) {
      engine.localPlayer = serverSelf;
    }
  }
});

socket.on('playerEquipChanged', (data) => {
  if (engine.players[data.id]) {
    engine.players[data.id].equipment = data.equipment;
  }
  if (engine.localPlayer && data.id === engine.selfId) {
    engine.localPlayer.equipment = data.equipment;
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

// Equipment presets for toggle testing
const weapons = ['magic_sword', 'fire_blade', 'golden_spear'];
const hats = ['knight_helm', 'crown', 'wizard_hat', 'none'];
const armors = [
  { top: 'knight_plate', bottom: 'steel_pants' },
  { top: 'golden_armor', bottom: 'royal_pants' },
  { top: 'royal_coat', bottom: 'dark_pants' }
];

let weaponIdx = 0;
let hatIdx = 0;
let armorIdx = 0;

// Input Handlers
window.addEventListener('keydown', (e) => {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
    return;
  }

  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
    e.preventDefault();
  }
  keys[e.code] = true;

  if (engine.localPlayer) {
    if (!engine.localPlayer.equipment) {
      engine.localPlayer.equipment = {
        hat: 'knight_helm',
        top: 'knight_plate',
        bottom: 'steel_pants',
        weapon: 'magic_sword'
      };
    }

    // Hotkeys for live Equipment Swap testing
    let equipChanged = false;
    if (e.code === 'Digit1') {
      weaponIdx = (weaponIdx + 1) % weapons.length;
      engine.localPlayer.equipment.weapon = weapons[weaponIdx];
      equipChanged = true;
    } else if (e.code === 'Digit2') {
      hatIdx = (hatIdx + 1) % hats.length;
      engine.localPlayer.equipment.hat = hats[hatIdx];
      equipChanged = true;
    } else if (e.code === 'Digit3') {
      armorIdx = (armorIdx + 1) % armors.length;
      engine.localPlayer.equipment.top = armors[armorIdx].top;
      engine.localPlayer.equipment.bottom = armors[armorIdx].bottom;
      equipChanged = true;
    }

    if (equipChanged) {
      socket.emit('changeEquipment', engine.localPlayer.equipment);
    }
  }

  // Check NPC Dialog Trigger (Space or KeyE)
  if (engine.localPlayer && (e.code === 'Space' || e.code === 'KeyE')) {
    const dialogModal = document.getElementById('dialog-modal');
    if (dialogModal && !dialogModal.classList.contains('hidden')) {
      dialogModal.classList.add('hidden');
    } else {
      const currentMapId = engine.localPlayer.mapId || 'map1';
      const npc = engine.physics.getNearbyNPC(engine.localPlayer, currentMapId);
      if (npc && dialogModal) {
        document.getElementById('dialog-name').innerText = npc.name;
        document.getElementById('dialog-portrait').src = npc.portrait;

        const qStatus = engine.questMgr.getNpcQuestStatus(npc.id);
        const q = engine.questMgr.getCurrentQuest();
        const actionBox = document.getElementById('dialog-quest-action');
        const actionBtn = document.getElementById('btn-quest-action');

        if (qStatus === 'available' && q) {
          document.getElementById('dialog-text').innerText = q.dialogs.initial;
          actionBox.classList.remove('hidden');
          actionBtn.innerText = '📜 퀘스트 수락';
          actionBtn.onclick = (event) => {
            event.stopPropagation();
            engine.questMgr.acceptQuest();
            dialogModal.classList.add('hidden');
          };
        } else if (qStatus === 'canComplete' && q) {
          document.getElementById('dialog-text').innerText = q.dialogs.complete;
          actionBox.classList.remove('hidden');
          actionBtn.innerText = '🏆 퀘스트 완료';
          actionBtn.onclick = (event) => {
            event.stopPropagation();
            const reward = engine.questMgr.completeQuest();
            if (reward) {
              alert(`🎉 [${q.title}] 완료!\n보상: EXP +${reward.exp}, Gold +${reward.gold}, 칭호: [${reward.title}]`);
            }
            dialogModal.classList.add('hidden');
          };
        } else {
          document.getElementById('dialog-text').innerText = npc.dialog;
          actionBox.classList.add('hidden');
        }

        dialogModal.classList.remove('hidden');
      }
    }
  }

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

// Close dialog when clicked
const dialogModalEl = document.getElementById('dialog-modal');
if (dialogModalEl) {
  dialogModalEl.addEventListener('click', (e) => {
    if (e.target.id !== 'btn-quest-action') {
      dialogModalEl.classList.add('hidden');
    }
  });
}

// BGM Mute / Sound Toggle Handler
const btnSoundToggle = document.getElementById('btn-sound-toggle');
if (btnSoundToggle) {
  btnSoundToggle.addEventListener('click', () => {
    const isMuted = engine.audio.toggleMute();
    if (isMuted) {
      btnSoundToggle.innerText = '🔇 BGM OFF';
      btnSoundToggle.classList.add('muted');
    } else {
      btnSoundToggle.innerText = '🎵 BGM ON';
      btnSoundToggle.classList.remove('muted');
    }
  });
}

window.addEventListener('keyup', (e) => {
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
    e.preventDefault();
  }
  keys[e.code] = false;
});

// Main Loop (60 FPS)
let lastTime = performance.now();
function gameLoop(now) {
  const dt = (now - lastTime) / 1000;
  lastTime = now;

  if (engine.localPlayer && loginModal.classList.contains('hidden')) {
    // 1. Update Local Player Physics with frame delta time
    engine.physics.updatePlayerPhysics(engine.localPlayer, keys, dt);

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
        isClimbing: engine.localPlayer.isClimbing,
        equipment: engine.localPlayer.equipment
      });
    }
  }

  // 3. Render Game
  engine.render(dt);

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
