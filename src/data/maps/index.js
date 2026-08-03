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
      { x: 0, y: 920, width: 2400, height: 280, isGround: true, style: 'grass_ground' },
      // 층계형 징검다리 디딤돌 (Stepping Stones)
      { x: 120, y: 810, width: 110, height: 22, style: 'stepping_stone' },
      { x: 260, y: 740, width: 120, height: 22, style: 'stepping_stone' },
      { x: 410, y: 670, width: 140, height: 22, style: 'wood_deck' },
      // 나무 가지 루스트 & 이끼 낀 유적 (Mossy Ruins & Tree Roosts)
      { x: 600, y: 600, width: 280, height: 24, style: 'mossy_ruins' },
      { x: 920, y: 540, width: 130, height: 22, style: 'stepping_stone' },
      { x: 1080, y: 480, width: 140, height: 22, style: 'stepping_stone' },
      { x: 1260, y: 420, width: 340, height: 24, style: 'wood_deck' },
      // 오른쪽 망루 고공 테라스 (Watchtower Terrace)
      { x: 1680, y: 580, width: 220, height: 24, style: 'mossy_ruins' },
      { x: 1940, y: 650, width: 150, height: 22, style: 'stepping_stone' },
      { x: 2120, y: 740, width: 180, height: 22, style: 'wood_deck' }
    ],
    ladders: [
      { x: 480, yMin: 670, yMax: 920 },
      { x: 740, yMin: 600, yMax: 920 },
      { x: 1420, yMin: 420, yMax: 920 },
      { x: 1780, yMin: 580, yMax: 920 }
    ],
    portals: [
      { x: 450, y: 920, targetMap: 'map2', targetX: 150, targetY: 920, label: '수련 고원 [W]' },
      { x: 1850, y: 920, targetMap: 'map4', targetX: 300, targetY: 1320, label: '코랄 마을 [W]' }
    ],
    // 🏛️ HIGH FANTASY RUIN STRUCTURES & LIGHTING
    pillars: [
      { x: 300, y: 920, height: 200, width: 48, runeColor: '#00d2d3' },
      { x: 740, y: 600, height: 160, width: 44, runeColor: '#00d2d3' },
      { x: 1420, y: 420, height: 220, width: 52, runeColor: '#f1c40f' },
      { x: 2100, y: 920, height: 210, width: 48, runeColor: '#00d2d3' }
    ],
    torches: [
      { x: 200, y: 920, theme: 'blue_magic', radius: 150 },
      { x: 600, y: 920, theme: 'fire', radius: 140 },
      { x: 1260, y: 420, theme: 'blue_magic', radius: 160 },
      { x: 1600, y: 920, theme: 'fire', radius: 140 },
      { x: 2200, y: 920, theme: 'blue_magic', radius: 150 }
    ],
    crystals: [
      { x: 640, y: 600, color: '#00d2d3' },
      { x: 1430, y: 420, color: '#54a0ff' },
      { x: 1720, y: 580, color: '#00d2d3' }
    ],
    gothicArches: [
      { x: 1260, y: 920, width: 240, height: 280 }
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
      { x: 0, y: 920, width: 2400, height: 280, isGround: true, style: 'highland_ground' },
      // 고원 테라스 & 계단 디딤돌 (Highland Stone Terraces)
      { x: 180, y: 780, width: 220, height: 24, style: 'stone_terrace' },
      { x: 440, y: 700, width: 120, height: 22, style: 'stepping_stone' },
      { x: 600, y: 620, width: 140, height: 22, style: 'stepping_stone' },
      // 수련장 메인 정자 발판 (Highland Pavilion)
      { x: 800, y: 520, width: 800, height: 26, style: 'stone_terrace' },
      { x: 1000, y: 360, width: 400, height: 24, style: 'sky_deck' },
      // 우측 절벽 디딤돌 (Cliff Terraces)
      { x: 1650, y: 620, width: 140, height: 22, style: 'stepping_stone' },
      { x: 1830, y: 700, width: 160, height: 22, style: 'stepping_stone' },
      { x: 2020, y: 780, width: 240, height: 24, style: 'stone_terrace' }
    ],
    ladders: [
      { x: 280, yMin: 780, yMax: 920 },
      { x: 1200, yMin: 520, yMax: 920 },
      { x: 1200, yMin: 360, yMax: 520 },
      { x: 2140, yMin: 780, yMax: 920 }
    ],
    portals: [
      { x: 150, y: 920, targetMap: 'map1', targetX: 450, targetY: 920, label: '수호의 숲 [W]' },
      { x: 600, y: 920, targetMap: 'map3', targetX: 150, targetY: 920, label: '용암 동굴 [W]' },
      { x: 1800, y: 920, targetMap: 'map4', targetX: 2400, targetY: 1320, label: '코랄 마을 [W]' }
    ],
    // 🏰 HIGH FANTASY HIGHLAND STATUES & BRAZIERS
    gargoyles: [
      { x: 820, y: 520 },
      { x: 1580, y: 520 },
      { x: 2040, y: 780 }
    ],
    torches: [
      { x: 300, y: 920, theme: 'fire', radius: 150 },
      { x: 800, y: 520, theme: 'fire', radius: 160 },
      { x: 1200, y: 360, theme: 'fire', radius: 170 },
      { x: 1600, y: 520, theme: 'fire', radius: 160 },
      { x: 2200, y: 920, theme: 'fire', radius: 150 }
    ],
    pillars: [
      { x: 1000, y: 360, height: 160, width: 40, runeColor: '#ffaa00' },
      { x: 1400, y: 360, height: 160, width: 40, runeColor: '#ffaa00' }
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
      { x: 0, y: 920, width: 2400, height: 280, isGround: true, style: 'basalt_ground' },
      // 용암 위를 가로지르는 징검다리와 크리스탈 발판 (Volcanic Ledges & Floating Crystals)
      { x: 150, y: 800, width: 180, height: 24, style: 'volcanic_ledge' },
      { x: 380, y: 730, width: 110, height: 22, style: 'stepping_stone' },
      { x: 530, y: 660, width: 220, height: 24, style: 'volcanic_ledge' },
      // 중앙 마그마 제단 크리스탈 (Magma Altar Crystal)
      { x: 800, y: 580, width: 110, height: 22, style: 'floating_crystal' },
      { x: 960, y: 490, width: 480, height: 26, style: 'floating_crystal' },
      { x: 1490, y: 580, width: 110, height: 22, style: 'floating_crystal' },
      // 우측 용암 절벽 (Right Volcanic Cliffs)
      { x: 1650, y: 660, width: 220, height: 24, style: 'volcanic_ledge' },
      { x: 1910, y: 730, width: 110, height: 22, style: 'stepping_stone' },
      { x: 2060, y: 800, width: 180, height: 24, style: 'volcanic_ledge' }
    ],
    ladders: [
      { x: 240, yMin: 800, yMax: 920 },
      { x: 640, yMin: 660, yMax: 920 },
      { x: 1200, yMin: 490, yMax: 920 },
      { x: 1760, yMin: 660, yMax: 920 },
      { x: 2150, yMin: 800, yMax: 920 }
    ],
    portals: [
      { x: 150, y: 920, targetMap: 'map2', targetX: 600, targetY: 920, label: '수련 고원 [W]' },
      { x: 1950, y: 920, targetMap: 'map4', targetX: 4500, targetY: 1320, label: '코랄 마을 [W]' }
    ],
    // 🌋 DARK FANTASY VOLCANIC STRUCTURES
    lavaFalls: [
      { x: 450, y: 200, width: 70, height: 720 },
      { x: 1750, y: 200, width: 80, height: 720 }
    ],
    torches: [
      { x: 300, y: 920, theme: 'fire', radius: 180 },
      { x: 960, y: 490, theme: 'fire', radius: 190 },
      { x: 1440, y: 490, theme: 'fire', radius: 190 },
      { x: 2100, y: 920, theme: 'fire', radius: 180 }
    ],
    crystals: [
      { x: 800, y: 580, color: '#e74c3c' },
      { x: 1200, y: 490, color: '#ff7675' },
      { x: 1490, y: 580, color: '#e74c3c' }
    ],
    pillars: [
      { x: 960, y: 490, height: 180, width: 44, runeColor: '#e74c3c' },
      { x: 1440, y: 490, height: 180, width: 44, runeColor: '#e74c3c' }
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
