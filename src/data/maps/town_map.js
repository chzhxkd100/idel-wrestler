/**
 * 🏰 DESIGNER MAP CONFIGURATION - 12,000px x 2,400px Mega Metropolis
 * 
 * 🎮 Industry Standard 6-Level Multi-Tier 5-Layer Composition Schema
 * Tiled Map Editor와 100% 연동 호환되는 8대 독자 테마 구역 대도시 스키마
 */
export const TOWN_MAP_CONFIG = {
  id: 'map4',
  name: '🏰 코랄 아일랜드 메가 메트로폴리스',
  theme: 'coral_island',
  width: 12000,
  height: 2400,
  tileSize: 64,

  // ----------------------------------------------------
  // Layer 1: 5-Level 패럴랙스 다층 배경 (Parallax Backgrounds)
  // ----------------------------------------------------
  parallaxLayers: [
    { key: 'sky_gradient', speedRatioX: 0.0, speedRatioY: 0.0 },
    { key: 'far_islands', speedRatioX: 0.06, speedRatioY: 0.02 },
    { key: 'near_tropical_hills', speedRatioX: 0.14, speedRatioY: 0.04 },
    { key: 'sparkling_ocean_waves', speedRatioX: 0.28, speedRatioY: 0.08 }
  ],

  // ----------------------------------------------------
  // Layer 2: 6단계 고저차 64x64 지형 타일맵 그리드 (Seamless Tilemap)
  // ----------------------------------------------------
  tileMapGrid: (() => {
    const tiles = [];
    const tileSize = 64;

    // 12,000px 메인 지상 (y: 1800 ~ 2400)
    for (let x = 0; x < 12000; x += tileSize) {
      for (let y = 1800; y < 2400; y += tileSize) {
        let tileType = 'tile_sand';
        if (x >= 3600 && x < 8800) tileType = 'tile_coral_stone';
        else if (x >= 8800 && x < 10200) tileType = 'tile_sea_bottom';
        else if (x >= 10200) tileType = 'tile_wood';
        tiles.push({ x, y, type: tileType });
      }
    }

    // Level 3: 1차 공중 보드워크 (x: 1800 ~ 4500, y: 1450)
    for (let x = 1800; x < 4500; x += tileSize) {
      tiles.push({ x, y: 1450, type: 'tile_wood' });
    }

    // Level 4: 2차 절벽 테라스 & 현수교 (x: 4800 ~ 8000, y: 1100)
    for (let x = 4800; x < 8000; x += tileSize) {
      let tileType = (x >= 6000 && x < 6600) ? 'tile_wood_bridge' : 'tile_rock';
      tiles.push({ x, y: 1100, type: tileType });
    }

    // Level 5: 3차 로열 궁전 성곽 테라스 (x: 6500 ~ 9500, y: 750)
    for (let x = 6500; x < 9500; x += tileSize) {
      tiles.push({ x, y: 750, type: 'tile_cliff_brick' });
    }

    // Level 6: 4차 최고봉 천문대 스카이웨이 (x: 9800 ~ 11500, y: 400)
    for (let x = 9800; x < 11500; x += tileSize) {
      tiles.push({ x, y: 400, type: 'tile_coral_stone' });
    }

    return tiles;
  })(),

  // ----------------------------------------------------
  // Layer 3 & Layer 5: 8개 구역 입체 프롭 배치 (Props & Buildings)
  // ----------------------------------------------------
  propsLayer: [
    // --- ZONE 1: 서쪽 무역항 & 해적 선술집 (x: 0 ~ 1800, y: 1800) ---
    { type: 'lighthouse', assetKey: 'building_lighthouse_grand', x: 160, y: 1800, width: 120, height: 320, zIndex: 'main', label: '⚓ 3층 해안 Grand 등대' },
    { type: 'ship', assetKey: 'prop_ship', x: 450, y: 1800, width: 220, height: 120, zIndex: 'back', label: '⛵ 무역 갤리온선' },
    { type: 'building', assetKey: 'building_tavern', x: 900, y: 1800, width: 260, height: 180, zIndex: 'main', label: '🍺 해변 선술집 Tavern' },
    { type: 'building', assetKey: 'building_port_warehouse', x: 1350, y: 1800, width: 240, height: 170, zIndex: 'main', label: '📦 무역항 화물창고' },
    { type: 'cannon', assetKey: 'prop_cannon', x: 300, y: 1800, width: 80, height: 50, zIndex: 'front' },
    { type: 'anchor', assetKey: 'prop_anchor', x: 700, y: 1800, width: 60, height: 70, zIndex: 'main' },
    { type: 'chest', assetKey: 'prop_chest', x: 1080, y: 1800, width: 50, height: 40, zIndex: 'front' },

    // --- ZONE 2: 해변 상가 & 스카이웨이 보드워크 (x: 1800 ~ 3600, Level 3: y: 1450) ---
    { type: 'building', assetKey: 'building_shop', x: 2050, y: 1450, width: 220, height: 160, zIndex: 'main', label: '🥐 코랄 베이커리' },
    { type: 'building', assetKey: 'building_juice_bar', x: 2450, y: 1450, width: 200, height: 150, zIndex: 'main', label: '🍹 리리아의 주스바' },
    { type: 'building', assetKey: 'building_shop', x: 2950, y: 1450, width: 240, height: 170, zIndex: 'main', label: '🎣 낚시용품점' },
    { type: 'tree', assetKey: 'prop_palm_tree', x: 2250, y: 1800, width: 130, height: 170, zIndex: 'front' },
    { type: 'tree', assetKey: 'prop_palm_tree', x: 3350, y: 1800, width: 130, height: 170, zIndex: 'front' },
    { type: 'parasol', assetKey: 'prop_parasol', x: 2700, y: 1800, width: 80, height: 90, zIndex: 'main' },
    { type: 'sign', assetKey: 'prop_signpost', x: 1900, y: 1800, width: 40, height: 70, zIndex: 'front' },

    // --- ZONE 3: 대도시 중앙 대광장 & 산호 분수대 (x: 3600 ~ 5400) ---
    { type: 'arch', assetKey: 'prop_flower_arch', x: 3750, y: 1800, width: 100, height: 120, zIndex: 'front' },
    { type: 'fountain', assetKey: 'prop_fountain', x: 4250, y: 1800, width: 150, height: 120, zIndex: 'main', label: '⛲ 대도시 중앙 산호 분수대' },
    { type: 'clocktower', assetKey: 'prop_clocktower', x: 4700, y: 1450, width: 100, height: 260, zIndex: 'main', label: '🔔 대도시 중앙 시계탑' },
    { type: 'statue', assetKey: 'prop_statue', x: 5100, y: 1450, width: 90, height: 140, zIndex: 'main', label: '🏆 수호자 금빛 동상' },
    { type: 'bench', assetKey: 'prop_bench', x: 4000, y: 1800, width: 70, height: 45, zIndex: 'front' },
    { type: 'bench', assetKey: 'prop_bench', x: 4500, y: 1800, width: 70, height: 45, zIndex: 'front' },

    // --- ZONE 4: 폭포 계곡 & 공중 현수교 구름다리 (x: 5400 ~ 7200, Level 4: y: 1100) ---
    { type: 'waterfall', assetKey: 'prop_waterfall', x: 5750, y: 1100, width: 120, height: 300, zIndex: 'back', label: '🌊 암석 아쿠아 폭포' },
    { type: 'bridge', assetKey: 'prop_bridge', x: 6300, y: 1100, width: 180, height: 60, zIndex: 'front', label: '🌉 공중 현수교 구름다리' },
    { type: 'lamp', assetKey: 'prop_streetlamp_double', x: 5500, y: 1100, width: 40, height: 100, zIndex: 'front' },
    { type: 'lamp', assetKey: 'prop_streetlamp_double', x: 7000, y: 1100, width: 40, height: 100, zIndex: 'front' },

    // --- ZONE 5: 로열 산호 왕국 성 & 절벽 촌장 저택 (x: 7200 ~ 9000, Level 5: y: 750) ---
    { type: 'castle', assetKey: 'building_castle', x: 7800, y: 750, width: 420, height: 300, zIndex: 'main', label: '🏰 로열 산호 왕국 성' },
    { type: 'manor', assetKey: 'building_manor', x: 8600, y: 750, width: 340, height: 220, zIndex: 'main', label: '🏛️ 촌장 피트 저택 회관' },
    { type: 'lamp', assetKey: 'prop_streetlamp_double', x: 7400, y: 750, width: 40, height: 100, zIndex: 'front' },
    { type: 'lamp', assetKey: 'prop_streetlamp_double', x: 9100, y: 750, width: 40, height: 100, zIndex: 'front' },

    // --- ZONE 6: 해저 침몰선 트렌치 & 아쿠아리움 (x: 9000 ~ 10200, Level 1: y: 2100) ---
    { type: 'building', assetKey: 'building_aquarium', x: 9250, y: 1800, width: 280, height: 190, zIndex: 'main', label: '🐬 해양 아쿠아리움' },
    { type: 'coral', assetKey: 'prop_coral_reef', x: 9700, y: 2100, width: 90, height: 90, zIndex: 'front' },
    { type: 'chest', assetKey: 'prop_chest', x: 9950, y: 2100, width: 50, height: 40, zIndex: 'front' },

    // --- ZONE 7: 최고봉 천문대 & 리조트 호텔 (x: 10200 ~ 11200, Level 6: y: 400) ---
    { type: 'observatory', assetKey: 'building_observatory', x: 10450, y: 400, width: 280, height: 260, zIndex: 'main', label: '🔭 천문대 스카이 돔' },
    { type: 'building', assetKey: 'building_hotel', x: 10950, y: 1800, width: 360, height: 240, zIndex: 'main', label: '🏨 코랄 럭셔리 리조트 호텔' },

    // --- ZONE 8: 동쪽 전망 풍차 산책로 & 던전 포탈 (x: 11200 ~ 12000, y: 1800) ---
    { type: 'windmill', assetKey: 'prop_windmill', x: 11550, y: 1800, width: 140, height: 200, zIndex: 'main', label: '🍃 전망대 풍차' },
    { type: 'tree', assetKey: 'prop_palm_tree', x: 11350, y: 1800, width: 130, height: 170, zIndex: 'front' }
  ],

  // ----------------------------------------------------
  // Layer 4: 물리 엔진 발판 & 입체 사다리 (Colliders)
  // ----------------------------------------------------
  platforms: [
    // 12,000px 메인 지상 바닥 (Level 2)
    { x: 0, y: 1800, width: 12000, height: 600, isGround: true },

    // Level 1: 해저 침몰선 트렌치 바닥
    { x: 8800, y: 2100, width: 1400, height: 300 },

    // Level 3: 1차 공중 보드워크
    { x: 1800, y: 1450, width: 2700, height: 24 },

    // Level 4: 2차 절벽 테라스 & 현수교
    { x: 4800, y: 1100, width: 3200, height: 24 },

    // Level 5: 3차 로열 성곽 테라스
    { x: 6500, y: 750, width: 3000, height: 24 },

    // Level 6: 4차 최고봉 천문대 스카이웨이
    { x: 9800, y: 400, width: 1700, height: 24 }
  ],

  // 6단계 높이를 누비는 입체 사다리 네트워크
  ladders: [
    { x: 500, yMin: 1450, yMax: 1800 },
    { x: 1900, yMin: 1450, yMax: 1800 },
    { x: 3100, yMin: 1450, yMax: 1800 },
    { x: 4400, yMin: 1100, yMax: 1800 },
    { x: 5200, yMin: 1100, yMax: 1450 },
    { x: 6100, yMin: 750, yMax: 1100 },
    { x: 7100, yMin: 750, yMax: 1100 },
    { x: 8200, yMin: 750, yMax: 1800 },
    { x: 9000, yMin: 1800, yMax: 2100 },
    { x: 9900, yMin: 400, yMax: 750 },
    { x: 10800, yMin: 400, yMax: 1800 },
    { x: 11400, yMin: 400, yMax: 1800 }
  ],

  // 맵 포탈
  portals: [
    { x: 400, y: 1800, targetMap: 'map1', targetX: 1850, targetY: 920, label: '수호의 숲 [W]' },
    { x: 7800, y: 750, targetMap: 'map2', targetX: 1800, targetY: 920, label: '수련 고원 [W]' },
    { x: 11800, y: 1800, targetMap: 'map3', targetX: 1950, targetY: 920, label: '용암 동굴 [W]' }
  ]
};
