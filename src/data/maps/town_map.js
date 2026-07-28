/**
 * 🎨 DESIGNER MAP CONFIGURATION - Town Map (코랄 아일랜드 마을)
 * 
 * 디자이너 안내:
 * 맵의 크기, 바닥, 발판(Platform), 사다리(Ladder), 포탈(Portal) 배치는
 * 이 파일만 수정하면 게임 엔진에 자동으로 반영됩니다.
 */
export const TOWN_MAP_CONFIG = {
  id: 'map4',
  name: '🏝️ 코랄 아일랜드 (산호초 마을)',
  theme: 'coral_island',
  width: 4800,
  height: 1600,
  
  // 맵 발판 (x: 시작위치, y: 높이, width: 너비, height: 두께, isGround: 메인 바닥 여부)
  platforms: [
    // 해변 백사장 메인 바닥 (x: 0 ~ 4800)
    { x: 0, y: 1320, width: 4800, height: 280, isGround: true },

    // 선착장 목재 데크
    { x: 100, y: 1180, width: 250, height: 20 },
    { x: 4450, y: 1180, width: 250, height: 20 },

    // 1층 상가 보드워크 (리리아 위치)
    { x: 400, y: 1060, width: 1400, height: 24 },

    // 2층 절벽 마을 테라스 (촌장 피트 위치)
    { x: 2000, y: 860, width: 1200, height: 24 },

    // 3층 전망대 파빌리온
    { x: 3400, y: 1140, width: 1000, height: 24 },

    // 상층 전망 발코니
    { x: 1500, y: 720, width: 400, height: 20 },
    { x: 2800, y: 640, width: 350, height: 20 }
  ],

  // 오르내리는 사다리 (x: X좌표, yMin: 최상단 높이, yMax: 최하단 높이)
  ladders: [
    { x: 500, yMin: 1060, yMax: 1320 },
    { x: 1200, yMin: 1060, yMax: 1320 },
    { x: 1650, yMin: 720, yMax: 1060 },
    { x: 2200, yMin: 860, yMax: 1320 },
    { x: 3000, yMin: 860, yMax: 1320 },
    { x: 3600, yMin: 1140, yMax: 1320 }
  ],

  // 다른 맵 이동 포탈
  portals: [
    { x: 300, y: 1320, targetMap: 'map1', targetX: 1850, targetY: 920, label: '수호의 숲 [W]' },
    { x: 2400, y: 1320, targetMap: 'map2', targetX: 1800, targetY: 920, label: '수련 고원 [W]' },
    { x: 4500, y: 1320, targetMap: 'map3', targetX: 1950, targetY: 920, label: '용암 동굴 [W]' }
  ]
};
