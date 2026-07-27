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
          { x: 450, y: 920, targetMap: 'map2', targetX: 150, targetY: 920, label: '수련 고원 [W]' },
          { x: 1850, y: 920, targetMap: 'map4', targetX: 200, targetY: 920, label: '코랄 아일랜드 [W]' }
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
          { x: 600, y: 920, targetMap: 'map3', targetX: 150, targetY: 920, label: '용암 동굴 [W]' },
          { x: 1800, y: 920, targetMap: 'map4', targetX: 1100, targetY: 920, label: '코랄 아일랜드 [W]' }
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
          { x: 150, y: 920, targetMap: 'map2', targetX: 600, targetY: 920, label: '수련 고원 [W]' },
          { x: 1950, y: 920, targetMap: 'map4', targetX: 2150, targetY: 920, label: '코랄 아일랜드 [W]' }
        ]
      },
      map4: {
        id: 'map4',
        name: '🏝️ 코랄 아일랜드 (산호초 섬마을)',
        theme: 'coral_island',
        platforms: [
          { x: 0, y: 920, width: 2400, height: 280, isGround: true },
          { x: 120, y: 760, width: 480, height: 20 },
          { x: 680, y: 620, width: 500, height: 20 },
          { x: 1280, y: 500, width: 450, height: 20 },
          { x: 1800, y: 680, width: 520, height: 20 }
        ],
        ladders: [
          { x: 300, yMin: 760, yMax: 920 },
          { x: 900, yMin: 620, yMax: 920 },
          { x: 1450, yMin: 500, yMax: 920 },
          { x: 2000, yMin: 680, yMax: 920 }
        ],
        portals: [
          { x: 200, y: 920, targetMap: 'map1', targetX: 1850, targetY: 920, label: '수호의 숲 [W]' },
          { x: 1100, y: 920, targetMap: 'map2', targetX: 1800, targetY: 920, label: '수련 고원 [W]' },
          { x: 2150, y: 920, targetMap: 'map3', targetX: 1950, targetY: 920, label: '용암 동굴 [W]' }
        ],
        npcs: [
          {
            id: 'npc_coral_girl',
            name: '🌸 섬마을 소녀 리리아',
            portrait: '/assets/npc_girl.png',
            x: 740,
            y: 620,
            dialog: '안녕! 여긴 파도소리가 감미로운 코랄 아일랜드야~ 🌊✨ 바다 아래 영롱한 산호 보석들을 구경해보렴!'
          }
        ]
      }
    };
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
    p.x = Math.max(20, Math.min(2380, p.x));

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
