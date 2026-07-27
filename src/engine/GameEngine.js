import { SpriteManager } from './SpriteManager.js';
import { PhysicsEngine } from './PhysicsEngine.js';
import { AudioManager } from './AudioManager.js';

export class GameEngine {
  constructor(canvas, minimapCanvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.minimapCanvas = minimapCanvas;
    this.minimapCtx = minimapCanvas.getContext('2d');

    this.spriteMgr = new SpriteManager();
    this.physics = new PhysicsEngine();
    this.audio = new AudioManager();

    this.camX = 0;
    this.camY = 0;
    this.currentRenderMapId = null;

    // DOM Caching
    this.headerEl = document.querySelector('#minimap-title');

    // Local Game Objects
    this.selfId = null;
    this.localPlayer = null;
    this.players = {};
  }

  resize(w, h) {
    this.canvas.width = w;
    this.canvas.height = h;

    this.minimapCanvas.width = 200;
    this.minimapCanvas.height = 106;
  }

  render(dt) {
    this.spriteMgr.update(dt);

    const currentMapId = this.localPlayer ? (this.localPlayer.mapId || 'map1') : 'map1';
    const mapData = this.physics.getMapData(currentMapId);

    // BGM Playback trigger per map
    if (this.currentRenderMapId !== currentMapId) {
      this.currentRenderMapId = currentMapId;
      this.audio.playMapBgm(currentMapId);
    }

    // Smooth Camera Tracking Local Player
    if (this.localPlayer) {
      const targetCamX = this.localPlayer.x - this.canvas.width / 2;
      const targetCamY = this.localPlayer.y - this.canvas.height / 2 - 40;

      // Frame-rate independent camera lerp (approx 15% per 60fps frame)
      const camLerp = 1 - Math.pow(0.85, dt * 60);
      this.camX += (targetCamX - this.camX) * camLerp;
      this.camY += (targetCamY - this.camY) * camLerp;

      // Clamp Camera to map boundaries
      this.camX = Math.max(0, Math.min(2400 - this.canvas.width, this.camX));
      this.camY = Math.max(0, Math.min(1200 - this.canvas.height, this.camY));
    }

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 1. Draw Parallax Background per theme
    this.drawBackground(ctx, mapData);

    ctx.save();
    ctx.translate(-Math.floor(this.camX), -Math.floor(this.camY));

    // 2. Draw Map Elements (Platforms & Ladders)
    this.drawMapElements(ctx, mapData);

    // 3. Draw Portals
    (mapData.portals || []).forEach(p => {
      this.spriteMgr.drawPortal(ctx, p);
    });

    // 3.5. Draw NPCs on current map
    const nearbyNPC = this.localPlayer ? this.physics.getNearbyNPC(this.localPlayer, currentMapId) : null;
    (mapData.npcs || []).forEach(npc => {
      const isNearby = nearbyNPC && nearbyNPC.id === npc.id;
      this.spriteMgr.drawNPC(ctx, npc, isNearby);
    });

    // 4. Draw Players on the same map
    const remotePlayersCount = Object.keys(this.players).length;
    let localPlayerDrawn = false;

    Object.values(this.players).forEach(p => {
      const isSelf = p.id === this.selfId;
      const displayPlayer = isSelf ? this.localPlayer : p;

      if (!displayPlayer) return;

      const playerMap = displayPlayer.mapId || 'map1';
      if (playerMap === currentMapId) {
        if (isSelf) {
          localPlayerDrawn = true;
          this.spriteMgr.drawPlayer(ctx, this.localPlayer, true);
        } else {
          // Smooth remote player position interpolation
          if (p.renderX === undefined) p.renderX = p.x;
          if (p.renderY === undefined) p.renderY = p.y;

          const lerpFactor = 1 - Math.pow(0.7, dt * 60);
          p.renderX += (p.x - p.renderX) * lerpFactor;
          p.renderY += (p.y - p.renderY) * lerpFactor;

          const tempP = { ...p, x: p.renderX, y: p.renderY };
          this.spriteMgr.drawPlayer(ctx, tempP, false);
        }
      }
    });

    // Fallback if local player is not in players list yet
    if (!localPlayerDrawn && this.localPlayer && (this.localPlayer.mapId || 'map1') === currentMapId) {
      this.spriteMgr.drawPlayer(ctx, this.localPlayer, true);
    }

    ctx.restore();

    // 5. Draw Minimap & Title
    this.drawMinimap(mapData);
  }

  drawBackground(ctx, mapData) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const theme = mapData.theme || 'forest';

    if (theme === 'forest') {
      // Dark Blue Night Sky
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#0c101d');
      sky.addColorStop(0.6, '#1a2238');
      sky.addColorStop(1, '#2c3a5e');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // Distant Forest Hills
      ctx.fillStyle = '#121829';
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 100) {
        const hillY = h - 220 + Math.sin((x + this.camX * 0.2) * 0.008) * 60;
        ctx.lineTo(x, hillY);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
    } else if (theme === 'highland') {
      // Sunset Sky
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#2d142c');
      sky.addColorStop(0.5, '#512b58');
      sky.addColorStop(1, '#801336');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // Sunset Mountains
      ctx.fillStyle = '#2b092b';
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 120) {
        const hillY = h - 260 + Math.sin((x + this.camX * 0.15) * 0.005) * 90;
        ctx.lineTo(x, hillY);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
    } else if (theme === 'cave') {
      // Dark Lava Cave Sky
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#05020a');
      sky.addColorStop(0.7, '#1f0808');
      sky.addColorStop(1, '#3b0a0a');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // Lava Cave Rocks
      ctx.fillStyle = '#120404';
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 80) {
        const hillY = h - 180 + Math.sin((x + this.camX * 0.25) * 0.01) * 40;
        ctx.lineTo(x, hillY);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
    } else if (theme === 'coral_island') {
      // Tropical Turquoise Ocean & Coral Reef Sky
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#0c2461');
      sky.addColorStop(0.35, '#1e3799');
      sky.addColorStop(0.7, '#00a8ff');
      sky.addColorStop(1, '#00d2d3');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // Distant Tropical Coral Island Silhouettes
      ctx.fillStyle = '#0a3d62';
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 100) {
        const hillY = h - 230 + Math.sin((x + this.camX * 0.12) * 0.006) * 50;
        ctx.lineTo(x, hillY);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();

      // Glowing Seafoam Ocean Waves Overlay
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      for (let i = 0; i < 4; i++) {
        const waveY = h - 160 + i * 28 + Math.sin(Date.now() * 0.002 + i) * 6;
        ctx.fillRect(0, waveY, w, 3);
      }
    }
  }

  drawMapElements(ctx, mapData) {
    const theme = mapData.theme || 'forest';

    // Draw Coral Props for Island Map
    if (theme === 'coral_island') {
      if (!this.coralTreeImg) {
        this.coralTreeImg = new Image();
        this.coralTreeImg.src = '/assets/coral_tree.png';
      }
      if (this.coralTreeImg.complete && this.coralTreeImg.naturalWidth !== 0) {
        ctx.drawImage(this.coralTreeImg, 480, 840, 80, 80);
        ctx.drawImage(this.coralTreeImg, 780, 540, 80, 80);
        ctx.drawImage(this.coralTreeImg, 1380, 420, 80, 80);
        ctx.drawImage(this.coralTreeImg, 1920, 600, 80, 80);
      }
    }

    // Draw Ladders
    mapData.ladders.forEach(l => {
      ctx.fillStyle = theme === 'coral_island' ? '#a0522d' : '#8d6e63';
      ctx.fillRect(l.x - 12, l.yMin, 4, l.yMax - l.yMin);
      ctx.fillRect(l.x + 8, l.yMin, 4, l.yMax - l.yMin);

      // Rungs
      ctx.fillStyle = theme === 'coral_island' ? '#f4a261' : '#d7ccc8';
      for (let y = l.yMin + 10; y < l.yMax; y += 20) {
        ctx.fillRect(l.x - 12, y, 24, 4);
      }
    });

    // Draw Platforms
    mapData.platforms.forEach(p => {
      if (p.isGround) {
        if (theme === 'forest') {
          ctx.fillStyle = '#2d1e18';
          ctx.fillRect(p.x, p.y, p.width, p.height);
          ctx.fillStyle = '#27ae60';
          ctx.fillRect(p.x, p.y, p.width, 16);
          ctx.fillStyle = '#2ecc71';
          ctx.fillRect(p.x, p.y, p.width, 4);
        } else if (theme === 'highland') {
          ctx.fillStyle = '#3a271d';
          ctx.fillRect(p.x, p.y, p.width, p.height);
          ctx.fillStyle = '#d35400';
          ctx.fillRect(p.x, p.y, p.width, 16);
          ctx.fillStyle = '#e67e22';
          ctx.fillRect(p.x, p.y, p.width, 4);
        } else if (theme === 'cave') {
          ctx.fillStyle = '#1c1515';
          ctx.fillRect(p.x, p.y, p.width, p.height);
          ctx.fillStyle = '#c0392b';
          ctx.fillRect(p.x, p.y, p.width, 16);
          ctx.fillStyle = '#e74c3c';
          ctx.fillRect(p.x, p.y, p.width, 4);
        } else if (theme === 'coral_island') {
          ctx.fillStyle = '#d4a373';
          ctx.fillRect(p.x, p.y, p.width, p.height);
          ctx.fillStyle = '#e9c46a';
          ctx.fillRect(p.x, p.y, p.width, 16);
          ctx.fillStyle = '#00b4d8';
          ctx.fillRect(p.x, p.y, p.width, 4);
        }
      } else {
        // Elevated Platforms
        if (theme === 'cave') {
          ctx.fillStyle = '#2c1e1e';
          ctx.fillRect(p.x, p.y, p.width, p.height);
          ctx.fillStyle = '#962d2d';
          ctx.fillRect(p.x, p.y, p.width, 5);
        } else if (theme === 'coral_island') {
          ctx.fillStyle = '#8b5a2b';
          ctx.fillRect(p.x, p.y, p.width, p.height);
          ctx.fillStyle = '#cd853f';
          ctx.fillRect(p.x, p.y, p.width, 5);
          ctx.fillStyle = '#00f5d4';
          ctx.fillRect(p.x, p.y, p.width, 2);
        } else {
          ctx.fillStyle = '#4e342e';
          ctx.fillRect(p.x, p.y, p.width, p.height);
          ctx.fillStyle = '#795548';
          ctx.fillRect(p.x, p.y, p.width, 6);
        }
      }
    });
  }

  drawMinimap(mapData) {
    const ctx = this.minimapCtx;
    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;

    const scaleX = w / 2400;
    const scaleY = h / 1200;

    // Update Header Text using cached element
    if (!this.headerEl) {
      this.headerEl = document.querySelector('.minimap-header');
    }
    if (this.headerEl && mapData) {
      this.headerEl.innerText = mapData.name;
    }

    ctx.clearRect(0, 0, w, h);

    // Platforms
    ctx.fillStyle = '#4a5568';
    mapData.platforms.forEach(p => {
      ctx.fillRect(p.x * scaleX, p.y * scaleY, p.width * scaleX, Math.max(2, p.height * scaleY));
    });

    // Portals (Blue dots)
    ctx.fillStyle = '#5865f2';
    (mapData.portals || []).forEach(p => {
      ctx.fillRect(p.x * scaleX - 3, (p.y - 30) * scaleY - 3, 6, 6);
    });

    const currentMapId = mapData.id;

    // Other Players on same map (Green dots)
    ctx.fillStyle = '#2ecc71';
    Object.values(this.players).forEach(p => {
      if (p.id !== this.selfId && (p.mapId || 'map1') === currentMapId) {
        ctx.fillRect(p.x * scaleX - 2, p.y * scaleY - 2, 4, 4);
      }
    });

    // Self Player (Yellow Glowing Dot)
    if (this.localPlayer) {
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(this.localPlayer.x * scaleX - 3, this.localPlayer.y * scaleY - 3, 6, 6);
    }
  }
}
