/**
 * 🎨 DESIGNER NPC CONFIGURATION - Town Map (코랄 마을)
 * 
 * 디자이너 안내:
 * 새로운 NPC를 추가하거나 기존 NPC를 수정할 때 이 파일만 수정하면 됩니다.
 * 
 * [속성 설명]
 * - id: NPC 식별자 (중복 불가)
 * - name: 게임 내 머리 위에 표시될 이름
 * - title: NPC 칭호 / 역할
 * - portrait: 대화창에 표시될 초상화 이미지 경로
 * - x, y: 맵 상의 위치 좌표
 * - dialog: 대화 내용
 */
export const TOWN_NPCS = [
  {
    id: 'npc_liria',
    name: '🌸 마을 안내원 리리아',
    title: '코랄 마을 안내원',
    portrait: '/assets/npc_girl.png',
    mapId: 'map4',
    x: 1200,
    y: 1060,
    dialog: '안녕! 여긴 에메랄드빛 바다가 펼쳐진 아름다운 코랄 마을이야~ 🌊✨ 마음껏 마을을 둘러보렴!'
  },
  {
    id: 'npc_pete',
    name: '⚓ 해변 촌장 피트',
    title: '마을 촌장',
    portrait: '/assets/npc_girl.png',
    mapId: 'map4',
    x: 2400,
    y: 860,
    dialog: '허허, 어서오게 모험가! 우리 마을은 디자이너가 맵과 NPC 데이터를 간편하게 변경할 수 있도록 데이터 구조가 잘 분리되어 있다네.'
  }
];
