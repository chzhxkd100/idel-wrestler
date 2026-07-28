import { TOWN_MAP_CONFIG } from './town_map.js';
import { getNPCsForMap } from '../npcs/index.js';

/**
 * 🎨 Central Map Registry for Designers
 */
export const MAP_REGISTRY = {
  map1: {
    id: 'map1',
    name: '🌲 엘니아 수호의 숲',
    theme: 'forest',
    width: 2400,
    height: 1200,
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
      { x: 1850, y: 920, targetMap: 'map4', targetX: 300, targetY: 1320, label: '코랄 마을 [W]' }
    ],
    npcs: getNPCsForMap('map1')
  },
  map2: {
    id: 'map2',
    name: '⛰️ 헤네시스 수련 고원',
    theme: 'highland',
    width: 2400,
    height: 1200,
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
      { x: 1800, y: 920, targetMap: 'map4', targetX: 2400, targetY: 1320, label: '코랄 마을 [W]' }
    ],
    npcs: getNPCsForMap('map2')
  },
  map3: {
    id: 'map3',
    name: '🌋 지옥 용암 동굴',
    theme: 'cave',
    width: 2400,
    height: 1200,
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
      { x: 1950, y: 920, targetMap: 'map4', targetX: 4500, targetY: 1320, label: '코랄 마을 [W]' }
    ],
    npcs: getNPCsForMap('map3')
  },
  map4: {
    ...TOWN_MAP_CONFIG,
    npcs: getNPCsForMap('map4')
  }
};

export function getMapData(mapId = 'map4') {
  return MAP_REGISTRY[mapId] || MAP_REGISTRY['map4'];
}
