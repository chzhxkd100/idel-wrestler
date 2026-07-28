import { SpriteManager } from './SpriteManager.js';
import { PhysicsEngine } from './PhysicsEngine.js';
import { AudioManager } from './AudioManager.js';
import { TileMapManager } from './TileMapManager.js';

export class GameEngine {
  constructor(canvas, minimapCanvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.minimapCanvas = minimapCanvas;
    this.minimapCtx = minimapCanvas.getContext('2d');

    this.spriteMgr = new SpriteManager();
    this.physics = new PhysicsEngine();
    this.audio = new AudioManager();
    this.tileMapMgr = new TileMapManager();

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
      const mapWidth = mapData.width || 2400;
      const mapHeight = mapData.height || 1200;
      this.camX = Math.max(0, Math.min(mapWidth - this.canvas.width, this.camX));
      this.camY = Math.max(0, Math.min(mapHeight - this.canvas.height, this.camY));
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
    const now = Date.now();

    if (theme === 'forest') {
      // 1. Deep Night Sky with Gradient
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#090d16');
      sky.addColorStop(0.5, '#131b2e');
      sky.addColorStop(1, '#233252');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // 2. Stars
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      for (let i = 0; i < 30; i++) {
        const starX = (i * 137 + 50) % w;
        const starY = (i * 93 + 20) % (h * 0.5);
        const alpha = 0.3 + 0.5 * Math.sin(now * 0.003 + i);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(2)})`;
        ctx.fillRect(starX, starY, 2, 2);
      }

      // 3. Far Distant Mountains (Parallax 0.08)
      ctx.fillStyle = '#0c1220';
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w + 40; x += 60) {
        const hillY = h - 320 + Math.sin((x + this.camX * 0.08) * 0.004) * 80 + Math.cos((x + 200) * 0.009) * 30;
        ctx.lineTo(x, hillY);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();

      // 4. Mid-Ground Forest Canopy Silhouette (Parallax 0.18)
      ctx.fillStyle = '#162238';
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w + 40; x += 40) {
        const hillY = h - 220 + Math.sin((x + this.camX * 0.18) * 0.008) * 45;
        ctx.lineTo(x, hillY);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();

      // 5. Glowing Ambient Fireflies
      ctx.fillStyle = '#a3e635';
      for (let i = 0; i < 15; i++) {
        const fx = (i * 211 + now * 0.02) % w;
        const fy = h - 200 - (i * 47 + Math.sin(now * 0.002 + i) * 30) % 300;
        const glow = 2 + Math.sin(now * 0.005 + i) * 1.5;
        ctx.globalAlpha = 0.6 + 0.4 * Math.sin(now * 0.004 + i);
        ctx.beginPath();
        ctx.arc(fx, fy, glow, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

    } else if (theme === 'highland') {
      // 1. Sunset Sky Gradient
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#21092e');
      sky.addColorStop(0.4, '#4a154b');
      sky.addColorStop(0.7, '#7c1c46');
      sky.addColorStop(1, '#c0392b');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // 2. Far Mountain Peaks (Parallax 0.1)
      ctx.fillStyle = '#260a2b';
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w + 50; x += 80) {
        const hillY = h - 340 + Math.sin((x + this.camX * 0.1) * 0.005) * 100;
        ctx.lineTo(x, hillY);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();

      // 3. Near Mountain Ridges (Parallax 0.22)
      ctx.fillStyle = '#3c0f37';
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w + 50; x += 50) {
        const hillY = h - 220 + Math.sin((x + this.camX * 0.22) * 0.007) * 50;
        ctx.lineTo(x, hillY);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();

    } else if (theme === 'cave') {
      // 1. Dark Lava Cave Ambient Sky
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#060308');
      sky.addColorStop(0.6, '#180708');
      sky.addColorStop(1, '#2c0808');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // 2. Distant Cave Rock Strata (Parallax 0.15)
      ctx.fillStyle = '#100506';
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w + 40; x += 60) {
        const hillY = h - 200 + Math.sin((x + this.camX * 0.15) * 0.012) * 60;
        ctx.lineTo(x, hillY);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();

      // 3. Rising Lava Sparks / Embers
      ctx.fillStyle = '#ff6b6b';
      for (let i = 0; i < 20; i++) {
        const ex = (i * 157 + Math.sin(now * 0.001 + i) * 40) % w;
        const ey = h - ((now * 0.05 + i * 80) % h);
        const size = 1.5 + (i % 3);
        ctx.globalAlpha = 0.4 + 0.6 * Math.cos(now * 0.003 + i);
        ctx.fillRect(ex, ey, size, size);
      }
      ctx.globalAlpha = 1.0;

    } else if (theme === 'coral_island') {
      // 1. Tropical Sky & Ocean Gradient
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#0a2342');
      sky.addColorStop(0.3, '#124559');
      sky.addColorStop(0.65, '#0096c7');
      sky.addColorStop(1, '#48cae4');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // 2. Distant Islands (Parallax 0.08)
      ctx.fillStyle = '#083045';
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w + 50; x += 90) {
        const hillY = h - 260 + Math.sin((x + this.camX * 0.08) * 0.005) * 55;
        ctx.lineTo(x, hillY);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();

      // 3. Near Tropical Hills & Palms Silhouette (Parallax 0.18)
      ctx.fillStyle = '#0a425e';
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w + 40; x += 50) {
        const hillY = h - 180 + Math.sin((x + this.camX * 0.18) * 0.008) * 35;
        ctx.lineTo(x, hillY);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();

      // 4. Sparkling Ocean Wave Reflection Strips
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      for (let i = 0; i < 5; i++) {
        const waveY = h - 160 + i * 24 + Math.sin(now * 0.002 + i * 1.5) * 5;
        ctx.fillRect(0, waveY, w, 2.5);
      }

      // 5. Floating Coral Ocean Bubbles
      ctx.fillStyle = 'rgba(160, 241, 255, 0.4)';
      for (let i = 0; i < 12; i++) {
        const bx = (i * 193 + Math.sin(now * 0.0015 + i) * 25) % w;
        const by = h - ((now * 0.03 + i * 90) % (h * 0.6));
        const r = 2 + (i % 3);
        ctx.beginPath();
        ctx.arc(bx, by, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  drawMapElements(ctx, mapData) {
    const theme = mapData.theme || 'forest';

    // 1. Layer 2: Draw Back Props (Far background elements)
    this.tileMapMgr.drawPropsLayer(ctx, mapData, 'back');

    // 2. Layer 3: Draw 64x64 TileMap Grid & Seamless Platform Surfaces
    this.tileMapMgr.drawTileMap(ctx, mapData, this.camX, this.canvas.width);

    // 3. Layer 4: Draw Main Props Layer (Buildings, Landmarks, Palms, Parasols)
    this.tileMapMgr.drawPropsLayer(ctx, mapData, 'main');

    // Fallback Procedural Graphics for Landmarks & Buildings
    (mapData.landmarks || []).forEach(lm => {
      this.spriteMgr.drawTownLandmark(ctx, lm);
    });

    (mapData.buildings || []).forEach(b => {
      this.spriteMgr.drawTownBuilding(ctx, b);
    });

    (mapData.trees || []).forEach(t => {
      this.spriteMgr.drawPalmTree(ctx, t);
    });

    (mapData.decorations || []).forEach(d => {
      this.spriteMgr.drawTownDecoration(ctx, d);
    });

    // 4. Layer 5: Draw Front Overlapping Props Layer (Front Foliage & Lanterns)
    this.tileMapMgr.drawPropsLayer(ctx, mapData, 'front');

    (mapData.lights || []).forEach(l => {
      this.spriteMgr.drawStreetLantern(ctx, l);
    });

    // 5. Draw Wooden & Rope Ladders
    mapData.ladders.forEach(l => {
      // Ladder Vertical Poles
      const poleColor = theme === 'coral_island' ? '#8b4513' : '#5c3a21';
      ctx.fillStyle = poleColor;
      ctx.fillRect(l.x - 12, l.yMin, 5, l.yMax - l.yMin);
      ctx.fillRect(l.x + 7, l.yMin, 5, l.yMax - l.yMin);

      // Pole Highlights
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(l.x - 12, l.yMin, 2, l.yMax - l.yMin);
      ctx.fillRect(l.x + 7, l.yMin, 2, l.yMax - l.yMin);

      // Wooden Rungs with Drop Shadows
      for (let y = l.yMin + 10; y < l.yMax; y += 18) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(l.x - 12, y + 2, 24, 4);

        ctx.fillStyle = theme === 'coral_island' ? '#d4a373' : '#a07855';
        ctx.fillRect(l.x - 12, y, 24, 4);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(l.x - 12, y, 24, 1);
      }
    });

    // 3. Draw Textured Platforms & Ground
    mapData.platforms.forEach(p => {
      // 3.1 Drop Shadow under platforms
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.fillRect(p.x + 4, p.y + p.height, p.width - 8, 12);

      if (p.isGround) {
        // --- MAIN GROUND TERRAIN ---
        if (theme === 'forest') {
          // Deep Earth Soil Base Gradient
          const dirtGrad = ctx.createLinearGradient(0, p.y, 0, p.y + p.height);
          dirtGrad.addColorStop(0, '#3a2518');
          dirtGrad.addColorStop(0.3, '#2a1a10');
          dirtGrad.addColorStop(1, '#150c07');
          ctx.fillStyle = dirtGrad;
          ctx.fillRect(p.x, p.y, p.width, p.height);

          // Subsurface Dirt Strata & Pebbles
          ctx.fillStyle = '#4a3324';
          for (let px = p.x + 15; px < p.x + p.width; px += 45) {
            const py = p.y + 30 + ((px * 17) % 80);
            ctx.beginPath();
            ctx.arc(px, py, 4 + (px % 3), 0, Math.PI * 2);
            ctx.fill();
          }

          // Lush Grass Layer (18px)
          ctx.fillStyle = '#27ae60';
          ctx.fillRect(p.x, p.y, p.width, 18);
          ctx.fillStyle = '#2ecc71';
          ctx.fillRect(p.x, p.y, p.width, 4);

          // Procedural Grass Blades & Tufts on Surface
          ctx.fillStyle = '#2ecc71';
          ctx.beginPath();
          for (let gx = p.x; gx < p.x + p.width; gx += 8) {
            const h = 6 + ((gx * 31) % 7);
            ctx.moveTo(gx, p.y);
            ctx.lineTo(gx + 3, p.y - h);
            ctx.lineTo(gx + 6, p.y);
          }
          ctx.fill();

          // Organic Dark Grass Edge Trim
          ctx.fillStyle = '#1e8449';
          ctx.fillRect(p.x, p.y + 18, p.width, 3);

        } else if (theme === 'highland') {
          // Sunset Terracotta / Clay Ground Base
          const dirtGrad = ctx.createLinearGradient(0, p.y, 0, p.y + p.height);
          dirtGrad.addColorStop(0, '#4a2515');
          dirtGrad.addColorStop(0.4, '#36190c');
          dirtGrad.addColorStop(1, '#1c0a03');
          ctx.fillStyle = dirtGrad;
          ctx.fillRect(p.x, p.y, p.width, p.height);

          // Highland Orange Grass Surface
          ctx.fillStyle = '#d35400';
          ctx.fillRect(p.x, p.y, p.width, 18);
          ctx.fillStyle = '#f39c12';
          ctx.fillRect(p.x, p.y, p.width, 4);

          // Highland Grass Tuft Spikes
          ctx.fillStyle = '#e67e22';
          ctx.beginPath();
          for (let gx = p.x; gx < p.x + p.width; gx += 10) {
            const h = 7 + ((gx * 23) % 8);
            ctx.moveTo(gx, p.y);
            ctx.lineTo(gx + 4, p.y - h);
            ctx.lineTo(gx + 8, p.y);
          }
          ctx.fill();

        } else if (theme === 'cave') {
          // Obsidian / Basalt Volcanic Soil Base
          const dirtGrad = ctx.createLinearGradient(0, p.y, 0, p.y + p.height);
          dirtGrad.addColorStop(0, '#261717');
          dirtGrad.addColorStop(0.4, '#190e0e');
          dirtGrad.addColorStop(1, '#0a0404');
          ctx.fillStyle = dirtGrad;
          ctx.fillRect(p.x, p.y, p.width, p.height);

          // Lava Magma Crust Surface
          ctx.fillStyle = '#c0392b';
          ctx.fillRect(p.x, p.y, p.width, 18);
          ctx.fillStyle = '#ff7675';
          ctx.fillRect(p.x, p.y, p.width, 4);

          // Cracker Crust Lava Lines
          ctx.fillStyle = '#e74c3c';
          for (let gx = p.x + 10; gx < p.x + p.width; gx += 40) {
            ctx.fillRect(gx, p.y + 4, 16, 2);
          }

        } else if (theme === 'coral_island') {
          // Tropical Beach Sand & Coral Base Gradient
          const sandGrad = ctx.createLinearGradient(0, p.y, 0, p.y + p.height);
          sandGrad.addColorStop(0, '#e9c46a');
          sandGrad.addColorStop(0.3, '#d4a373');
          sandGrad.addColorStop(1, '#a67c52');
          ctx.fillStyle = sandGrad;
          ctx.fillRect(p.x, p.y, p.width, p.height);

          // Top Fine White Sand & Seafoam Border
          ctx.fillStyle = '#fefae0';
          ctx.fillRect(p.x, p.y, p.width, 14);
          ctx.fillStyle = '#00b4d8';
          ctx.fillRect(p.x, p.y, p.width, 3);

          // Shell & Coral Speckles in Sand
          ctx.fillStyle = '#f4a261';
          for (let sx = p.x + 20; sx < p.x + p.width; sx += 50) {
            const sy = p.y + 25 + ((sx * 13) % 70);
            ctx.fillRect(sx, sy, 3, 3);
          }
        }

      } else {
        // --- ELEVATED PLATFORMS (WOODEN BOARDWALK / STONE LEDGES) ---
        if (theme === 'coral_island' || theme === 'forest') {
          // Wooden Boardwalk Deck Design
          ctx.fillStyle = '#5c3a21';
          ctx.fillRect(p.x, p.y, p.width, p.height);

          // Individual Wooden Planks & Seams
          const plankWidth = 40;
          for (let x = p.x; x < p.x + p.width; x += plankWidth) {
            const currentW = Math.min(plankWidth, p.x + p.width - x);
            
            // Plank Surface
            ctx.fillStyle = '#8b5a2b';
            ctx.fillRect(x + 1, p.y + 1, currentW - 2, p.height - 2);

            // Plank Top Highlight
            ctx.fillStyle = '#b0753c';
            ctx.fillRect(x + 1, p.y + 1, currentW - 2, 3);

            // Plank Seam Line
            ctx.fillStyle = '#3a2312';
            ctx.fillRect(x, p.y, 2, p.height);

            // Metallic Peg / Nail Dots
            ctx.fillStyle = '#222';
            ctx.fillRect(x + 5, p.y + 5, 2, 2);
            ctx.fillRect(x + currentW - 7, p.y + 5, 2, 2);
          }

          // Tropical Cyan Water Glow Edge for Coral Island
          if (theme === 'coral_island') {
            ctx.fillStyle = '#00f5d4';
            ctx.fillRect(p.x, p.y, p.width, 2);
          }

          // Wooden Support Stilts / Beams Under Platforms
          ctx.fillStyle = '#422815';
          const beamSpacing = 120;
          for (let bx = p.x + 30; bx < p.x + p.width - 20; bx += beamSpacing) {
            ctx.fillRect(bx, p.y + p.height, 12, 25);
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(bx + 12, p.y + p.height, 4, 25);
            ctx.fillStyle = '#422815';
          }

        } else if (theme === 'cave') {
          // Dark Volcanic Rock Ledge
          ctx.fillStyle = '#231818';
          ctx.fillRect(p.x, p.y, p.width, p.height);

          ctx.fillStyle = '#8a2b2b';
          ctx.fillRect(p.x, p.y, p.width, 5);

          ctx.fillStyle = '#ff4d4d';
          ctx.fillRect(p.x, p.y, p.width, 2);

        } else {
          // Standard Mountain Wooden Ledge
          ctx.fillStyle = '#4a3324';
          ctx.fillRect(p.x, p.y, p.width, p.height);

          ctx.fillStyle = '#78533b';
          ctx.fillRect(p.x, p.y, p.width, 5);

          ctx.fillStyle = '#d35400';
          ctx.fillRect(p.x, p.y, p.width, 2);
        }
      }
    });
  }

  drawMinimap(mapData) {
    const ctx = this.minimapCtx;
    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;

    const mapWidth = mapData.width || 2400;
    const mapHeight = mapData.height || 1200;

    const scaleX = w / mapWidth;
    const scaleY = h / mapHeight;

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
