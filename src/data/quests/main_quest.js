/**
 * 📜 Episode 1: Main Story Quest Registry ("타락한 수호석과 4대 대륙의 전설")
 */
export const MAIN_QUESTS = [
  {
    id: 'quest_1',
    title: '🌲 숲의 서막: 오염된 수호석',
    giverId: 'npc_forest_luna',
    targetNpcId: 'npc_highland_lucas',
    targetMapId: 'map2',
    description: '수호의 숲 요정 루나가 용암 동굴의 마수가 깊어지고 있다고 경고합니다. 헤네시스 수련 고원의 교관 루카스를 찾아가 도움을 요청하세요.',
    dialogs: {
      initial: '모험가님, 도움이 필요해요! 지옥 용암 동굴의 불길이 수호의 숲까지 번지고 있어요. 숲의 수호석이 오염되고 있습니다! 헤네시스 수련 고원의 [교관 루카스] 님께 전령을 전해주세요!',
      inProgress: '헤네시스 수련 고원(오른쪽 포탈 ➔ map2)의 [교관 루카스] 님을 찾아가셨나요? 서두르셔야 합니다!',
      complete: '오! 루나 님이 보낸 전령이로군. 숲의 수호석마저 오염되다니... 상황이 생각보다 심각하다!'
    },
    reward: { exp: 500, gold: 1000, title: '숲의 전령' }
  },
  {
    id: 'quest_2',
    title: '⛰️ 고원의 시련: 기사의 자격',
    giverId: 'npc_highland_lucas',
    targetNpcId: 'npc_cave_garon',
    targetMapId: 'map3',
    description: '교관 루카스는 당신의 용기를 테스트합니다. 지옥 용암 동굴 입구에서 고군분투하는 동굴 기사 가론을 지원하세요.',
    dialogs: {
      initial: '자네의 눈빛을 보니 수련은 충분하군. 지옥 용암 동굴 전선에서 고군분투 중인 [기사 가론]을 찾아가 힘을 보태주게나!',
      inProgress: '용암 동굴(고원 우측 하단 포탈 ➔ map3) 입구에 있는 [기사 가론]에게 가보게!',
      complete: '루카스 님이 보낸 구원투수가 자네인가? 용암 동굴 내부의 마그마 폭포가 통제를 잃고 솟구치고 있네!'
    },
    reward: { exp: 1200, gold: 2500, title: '고원의 수호자' }
  },
  {
    id: 'quest_3',
    title: '🌋 동굴의 비밀: 마그마 제단 봉인',
    giverId: 'npc_cave_garon',
    targetNpcId: 'npc_pete',
    targetMapId: 'map4',
    description: '용암 동굴의 붉은 크리스탈 제단 오염을 조사했습니다. 이 승전보를 코랄 대도시 촌장 피트에게 보고하세요.',
    dialogs: {
      initial: '중앙 마그마 제단의 붉은 크리스탈을 억제하는 데 성공했네! 이 기쁜 승전보를 코랄 대도시(map4)의 [촌장 피트] 님께 전해주게!',
      inProgress: '코랄 대도시(오른쪽 포탈 ➔ map4 5층 로열 성곽)의 [촌장 피트] 님께 보고를 전해주세요!',
      complete: '허허! 자네가 용암 동굴의 재앙을 막아낸 영웅이로군! 메가 메트로폴리스 전체가 자네의 공헌에 감사하고 있네.'
    },
    reward: { exp: 3000, gold: 10000, title: '대륙의 영웅' }
  },
  {
    id: 'quest_4',
    title: '🏰 영웅의 탄생: 대도시의 구원자',
    giverId: 'npc_pete',
    targetNpcId: 'npc_pete',
    targetMapId: 'map4',
    description: '코랄 대도시의 영웅으로 칭송받았습니다! 4대 대륙을 자유롭게 탐험하며 다음 에피소드를 준비하세요.',
    dialogs: {
      initial: '모험가여, 자네는 4대 대륙의 평화를 지켜낸 진정한 전설이다! 앞으로도 이 세계를 자유롭게 탐험해주게나!',
      inProgress: '자네는 이미 전설의 영웅이라네!',
      complete: '에피소드 1 메인 스토리 클리어! 🏆 축하합니다!'
    },
    reward: { exp: 10000, gold: 50000, title: '전설의 모험가' }
  }
];
