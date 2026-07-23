export class PhysicsEngine {
  constructor() {
    this.gravity = 0.65;
    this.friction = 0.82;
    this.maxSpeed = 6.5;
    this.jumpForce = -13.5;

    // Define 3 Maps (Platforms, Ladders, Portals)
    this.maps = {
      map1: {
        id: 'map1',
        name: '🌲 엘니아 수호의 숲',
        theme: 'forest',
        platforms: [
          { x: 0, y: 920, width: 2400, height: 280, isGround: true },
          { x: 100, y: 760, width: 450, height: 20 },
          { x: 580, y: 620, width: 400, height: 20 },
          { x: 1050, y: 620, width: 400, height: 20 },
          { x: 1750, y: 560, width: 550, height: 20 },
          { x: 1300, y: 420, width: 380, height: 20 }
        ],
        ladders: [
          { x: 300, yMin: 760, yMax: 920 },
          { x: 750, yMin: 620, yMax: 920 },
          { x: 1200, yMin: 620, yMax: 920 },
          { x: 1900, yMin: 560, yMax: 920 }
        ],
        portals: [
          { x: 450, y: 920, targetMap: 'map2', targetX: 150, targetY: 920, label: '수련 고원 [W]' }
        ]
      },
      map2: {
        id: 'map2',
        name: '⛰️ 헤네시스 수련 고원',
        theme: 'highland',
        platforms: [
          { x: 0, y: 920, width: 2400, height: 280, isGround: true },
          { x: 200, y: 720, width: 500, height: 20 },
          { x: 800, y: 540, width: 800, height: 20 },
          { x: 1700, y: 720, width: 500, height: 20 },
          { x: 1000, y: 360, width: 400, height: 20 }
        ],
        ladders: [
          { x: 450, yMin: 720, yMax: 920 },
          { x: 1200, yMin: 540, yMax: 920 },
          { x: 1950, yMin: 720, yMax: 920 },
          { x: 1200, yMin: 360, yMax: 540 }
        ],
        portals: [
          { x: 150, y: 920, targetMap: 'map1', targetX: 450, targetY: 920, label: '수호의 숲 [W]' },
          { x: 600, y: 920, targetMap: 'map3', targetX: 150, targetY: 920, label: '용암 동굴 [W]' }
        ]
      },
      map3: {
        id: 'map3',
        name: '🌋 지옥 용암 동굴',
        theme: 'cave',
        platforms: [
          { x: 0, y: 920, width: 2400, height: 280, isGround: true },
          { x: 150, y: 780, width: 350, height: 20 },
          { x: 600, y: 640, width: 350, height: 20 },
          { x: 1050, y: 500, width: 300, height: 20 },
          { x: 1450, y: 640, width: 350, height: 20 },
          { x: 1900, y: 780, width: 350, height: 20 }
        ],
        ladders: [
          { x: 300, yMin: 780, yMax: 920 },
          { x: 750, yMin: 640, yMax: 920 },
          { x: 1200, yMin: 500, yMax: 920 },
          { x: 1600, yMin: 640, yMax: 920 },
          { x: 2050, yMin: 780, yMax: 920 }
        ],
        portals: [
          { x: 150, y: 920, targetMap: 'map2', targetX: 600, targetY: 920, label: '수련 고원 [W]' }
        ]
      }
    };
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

  updatePlayerPhysics(p, keys) {
    const mapData = this.getMapData(p.mapId || 'map1');

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

      if (keys['ArrowUp'] || keys['KeyW']) {
        p.y -= 4;
        if (p.y < ladder.yMin) {
          p.y = ladder.yMin;
          p.isClimbing = false;
        }
      } else if (keys['ArrowDown'] || keys['KeyS']) {
        p.y += 4;
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
    if (keys['ArrowLeft'] || keys['KeyA']) {
      p.vx -= 1.2;
      p.facing = -1;
      p.animState = 'walk';
    } else if (keys['ArrowRight'] || keys['KeyD']) {
      p.vx += 1.2;
      p.facing = 1;
      p.animState = 'walk';
    } else {
      p.vx *= this.friction;
      if (Math.abs(p.vx) < 0.1) {
        p.vx = 0;
        if (p.animState === 'walk') p.animState = 'idle';
      }
    }

    // Cap Max Speed
    p.vx = Math.max(-this.maxSpeed, Math.min(this.maxSpeed, p.vx));
    p.x += p.vx;

    // Clamp Boundaries
    p.x = Math.max(20, Math.min(2380, p.x));

    // Apply Gravity
    p.vy += this.gravity;
    p.y += p.vy;

    // Platform Collisions
    let grounded = false;
    const playerFeetY = p.y;
    const prevFeetY = p.y - p.vy;

    for (const plat of mapData.platforms) {
      if (
        p.x >= plat.x &&
        p.x <= plat.x + plat.width &&
        prevFeetY <= plat.y + 5 &&
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
