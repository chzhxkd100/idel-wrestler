# 📊 PROJECT_STATUS.md — 프로젝트 상태 & 지속 개발 로드맵

본 문서는 **레슬러 키우기 MMORPG**의 기능 구현 현황과 현재 상태를 기록하는 문서입니다. AI 에이전트는 작업 승계 시 이 문서를 먼저 확인합니다.

---

## 📌 현재 개발 상태 요약
* **완료된 단계**: **Phase 1 ~ Phase 45 (100% 완료 및 테스트 통과)**
* **최근 푸시된 기능**:
  * **Phase 44**: 콤보 시스템 (연속 타격 시 `COMBO` 스택 연출 & 3초 리셋)
  * **Phase 45**: 서버 최초 달성 공지 (`[SERVER FIRST]` 50/100 레벨 달성 전체 화면 메가폰 알림)
* **원격 저장소**: `https://github.com/chzhxkd100/idel-wrestler.git` (`main` 브랜치 동기화 됨)

---

## 📋 단계별 개발 현황 (Phase 1 ~ 45 Completed)

- `[x]` **Phase 1-10**: 기초 Colyseus 서버 + Phaser3 클라이언트, 이동/공격, 몬스터 AI, 보스 몬스터, 레벨업/스탯, 스킬
- `[x]` **Phase 11-20**: NPC 및 상점, 챔피언십 벨트 장착, 퀘스트, PVP, 말풍선, 실시간 리더보드, 데이터베이스(Prisma) 연동, 직업(Fighter/Grappler) 전직
- `[x]` **Phase 21-30**: 미니맵 UI, 길드 시스템, 무적 타임, 탈것 시스템, 낮/밤 주기, 월드 보스 & 전설 무기, 크리티컬 텍스트, 인벤토리 UI, NPC 스탯 리셋 상점, 칭호 시스템
- `[x]` **Phase 31-35**: 환생(Rebirth) 시스템, 환생 아우라 파티클, 핫타임 이벤트, 펫(Pet) 소환, 전역 날씨(비/눈) 시스템
- `[x]` **Phase 36**: 안전 지대 (Safe Zone, X: 350-450, PVP/몬스터 금지, 초당 +5 HP/MP 회복)
- `[x]` **Phase 37**: 감정 표현 (Emote, 단축키 4, 5, 6 -> 😀, 😠, 😭 말풍선)
- `[x]` **Phase 38**: 회피 시스템 (AGI 비례 Dodge 확률, 0데미지 & 회색 `MISS!` 연출)
- `[x]` **Phase 39**: 직업별 데미지 색상 (Fighter: Red `#ff3333`, Grappler: Purple `#bb33ff`)
- `[x]` **Phase 40**: 데스 패널티 (사망 시 경험치 10% 차감 & 경고 시스템 메시지)
- `[x]` **Phase 41**: 자리 비움 감지 (AFK 60초 감지 시 이름표에 `[Zzz]` 마크 표시)
- `[x]` **Phase 42**: 퀵 힐 단축키 (H키 50골드 소모 즉시 HP/MP 풀 회복)
- `[x]` **Phase 43**: 확성기 전체 공지 (`! 내용` 입력 시 100골드 소모 화면 중앙 거대 텍스트)
- `[x]` **Phase 44**: 콤보 시스템 (연속 타격 시 COMBO 스택 및 3초 리셋)
- `[x]` **Phase 45**: 서버 최초 달성 공지 (최초 50/100 레벨 달성 시 전 유저 브로드캐스트)

---

## 🔮 향후 개발 로드맵 (Roadmap: Phase 46+)

AI 에이전트가 다음 개발 요청을 받거나 연속 작업을 수행할 때 진행할 로드맵입니다:

- `[ ]` **Phase 46: 파티 시스템 (Party System & EXP Bonus)**
  - `/party invite <유저명>`, `/party accept` 명령어 또는 파티 초대 UI
  - 파티원 사냥 시 경험치 공유 및 2인 이상 파티 시 경험치 +20% 보너스
- `[ ]` **Phase 47: 장비 강화 시스템 (Equipment Enhancement System)**
  - 골드를 소모하여 무기/벨트 강화 (`+1 무기`, `+2 무기`)
  - 강화 단계에 따라 공격력 상승 및 빛나는 무기 파티클 효과
- `[ ]` **Phase 48: 던전 입점 (Dungeon Portal System)**
  - 포탈 영역 진입 시 인스턴스 던전으로 이동
  - 난이도별 강한 던전 몬스터 스폰 및 대량의 보상 드롭
- `[ ]` **Phase 49: 랭킹 전용 칭호 및 아우라 확장**
  - 1위 랭커 전용 `[CHAMPION]` 특별 칭호 및 붉은 불꽃 아우라 부여
- `[ ]` **Phase 50: 오토 플레이 / 방치형 사냥 모드 (Auto Hunt Mode)**
  - `A`키 입력 시 주변 가장 가까운 몬스터를 자동 탐색하여 이동 및 공격

---

## ⚙️ 시스템 사양 및 변수 가이드
* **Safe Zone**: `x >= 350 && x <= 450`
* **Dodge Formula**: `Math.min(50, agi * 0.5) / 100`
* **Death EXP Loss**: `exp = Math.max(0, exp - Math.floor(exp * 0.1))`
* **AFK Timeout**: `60,000ms` (60초)
* **Combo Timeout**: `3,000ms` (3초)
* **Quick Heal Cost**: `50 Gold`
* **Megaphone Cost**: `100 Gold` (`! 내용`)
