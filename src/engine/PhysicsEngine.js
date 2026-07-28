import { MAP_REGISTRY } from '../data/maps/index.js';

export class PhysicsEngine {
  constructor() {
    this.gravity = 0.65;
    this.friction = 0.82;
    this.maxSpeed = 6.5;
    this.jumpForce = -13.5;

    // Load Designer Map Registry (Platforms, Ladders, Portals, NPCs)
    this.maps = MAP_REGISTRY;
  }

  getNearbyNPC(player, mapId = 'map1') {
    const mapData = this.getMapData(mapId);
    if (!mapData.npcs) return null;
    const margin = 60;
    return mapData.npcs.find(npc =>
      Math.abs(player.x - npc.x) < margin &&
      Math.abs(player.y - npc.y) < 60
    );
  }

  getMapData(mapId = 'map1') {
    return this.maps[mapId] || this.maps['map1'];
  }

  getNearbyLadder(player, mapId = 'map1') {
    const mapData = this.getMapData(mapId);
    const margin = 20;
    return mapData.ladders.find(l => 
      Math.abs(player.x - l.x) < margin &&
      player.y >= l.yMin - 10 &&
      player.y <= l.yMax + 10
    );
  }

  getNearbyPortal(player, mapId = 'map1') {
    const mapData = this.getMapData(mapId);
    const margin = 50;
    return mapData.portals.find(p =>
      Math.abs(player.x - p.x) < margin &&
      Math.abs(player.y - p.y) < 60
    );
  }

  updatePlayerPhysics(p, keys, dt = 1 / 60) {
    const mapData = this.getMapData(p.mapId || 'map1');

    // Clamp dt to avoid physics glitches during tab switches or lag spikes
    const delta = Math.min(dt, 0.05);
    const stepRatio = delta * 60; // 1.0 at 60 FPS

    // Check Ladder Climbing
    const ladder = this.getNearbyLadder(p, p.mapId);
    if (ladder && (keys['ArrowUp'] || keys['KeyW'] || keys['ArrowDown'] || keys['KeyS'])) {
      p.isClimbing = true;
      p.x = ladder.x;
    }

    if (p.isClimbing) {
      p.vy = 0;
      p.vx = 0;
      p.animState = 'climb';

      const climbSpeed = 4 * stepRatio;
      if (keys['ArrowUp'] || keys['KeyW']) {
        p.y -= climbSpeed;
        if (p.y < ladder.yMin) {
          p.y = ladder.yMin;
          p.isClimbing = false;
        }
      } else if (keys['ArrowDown'] || keys['KeyS']) {
        p.y += climbSpeed;
        if (p.y > ladder.yMax) {
          p.y = ladder.yMax;
          p.isClimbing = false;
        }
      }

      if (keys['Space']) {
        p.isClimbing = false;
        p.vy = this.jumpForce * 0.8;
      }
      return;
    }

    // Horizontal Movement
    const accel = 1.2 * stepRatio;
    const currentFriction = Math.pow(this.friction, stepRatio);

    if (keys['ArrowLeft'] || keys['KeyA']) {
      p.vx -= accel;
      p.facing = -1;
      p.animState = 'walk';
    } else if (keys['ArrowRight'] || keys['KeyD']) {
      p.vx += accel;
      p.facing = 1;
      p.animState = 'walk';
    } else {
      p.vx *= currentFriction;
      if (Math.abs(p.vx) < 0.1) {
        p.vx = 0;
        if (p.animState === 'walk') p.animState = 'idle';
      }
    }

    // Cap Max Speed
    p.vx = Math.max(-this.maxSpeed, Math.min(this.maxSpeed, p.vx));
    p.x += p.vx * stepRatio;

    // Clamp Boundaries
    const mapWidth = mapData.width || 2400;
    p.x = Math.max(20, Math.min(mapWidth - 20, p.x));

    // Apply Gravity
    p.vy += this.gravity * stepRatio;
    p.y += p.vy * stepRatio;

    // Platform Collisions
    let grounded = false;
    const playerFeetY = p.y;
    const prevFeetY = p.y - p.vy * stepRatio;

    for (const plat of mapData.platforms) {
      if (
        p.x >= plat.x &&
        p.x <= plat.x + plat.width &&
        prevFeetY <= plat.y + 10 &&
        playerFeetY >= plat.y
      ) {
        p.y = plat.y;
        p.vy = 0;
        grounded = true;
        break;
      }
    }

    // Jump Logic
    if (grounded) {
      if (keys['Space']) {
        p.vy = this.jumpForce;
        p.animState = 'jump';
      }
    } else {
      p.animState = 'jump';
    }
  }
}
