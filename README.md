# 🤼 레슬러 키우기 (Wrestler Raising MMORPG)

100% AI 자동화로 개발 및 지속 보수되는 2D 횡스크롤 실시간 멀티플레이어(MMORPG) 웹 게임입니다.  
메이플스토리, 귀혼 스타일의 2D 액션 아케이드 횡스크롤 시스템과 고성능 권한 서버(Authoritative Server) 구조로 제작되었습니다.

---

## 🤖 AI Agent Continuity & Maintainability Guide (AI 작업 승계 가이드)

> **IMPORTANT FOR AI AGENTS:**  
> 이 프로젝트는 개발자의 개입 없이 AI Agent가 스스로 모든 기획, 코드 작성, 타입 검사, 빌드, Git 버전 관리 및 CI/CD 배포를 진행하도록 설계되었습니다.  
> 다른 컴퓨터 또는 새로운 세션에서 작업을 이어받을 때 본 가이드를 최우선으로 참조하십시오.

### 1. 프로젝트 아키텍처 (Architecture Overview)
* **Monorepo (npm workspaces)**:
  * `shared/`: 서버와 클라이언트가 공통으로 사용하는 TypeScript 인터페이스 (`IPlayerState`, `IMonsterState` 등).
  * `server/`: Colyseus 0.15 + Node.js (TypeScript) 기반 권한 서버. 게임 로직, 데미지 계산, 회피, 스탯, 타이머 관리.
  * `client/`: Phaser 3 + Vite 기반 2D Canvas 웹 클라이언트.
* **데이터베이스**: Prisma ORM (`server/prisma/schema.prisma`).

### 2. 핵심 게임 규칙 및 시스템 사양 (Core Game Rules)
* **Safe Zone (안전 지대)**: X 좌표 `350 ~ 450` 영역. 몬스터 스폰 불가, PVP 및 공격 불가, 초당 HP/MP +5 자동 회복.
* **전직 (Job Class)**: 10레벨 달성 후 `F`키(파이터 - STR 가산 & 붉은 데미지), `G`키(그래플러 - VIT/HP 가산 & 보라 데미지).
* **회피 (Dodge)**: 민첩(AGI) * 0.5% (최대 50%). 회피 성공 시 `damage = 0`, 클라이언트에 `MISS!` 연출.
* **데스 패널티 (Death Penalty)**: 사망 시 현재 경험치(EXP)의 10% 차감.
* **자리 비움 (AFK)**: 60초간 이동 조작이 없을 시 `isAFK = true` 세팅, 머리 위에 `[Zzz]` 상태 표시.
* **퀵 힐 (Quick Heal)**: `H`키 입력 시 50 골드를 소모하여 즉시 HP/MP 풀 회복.
* **확성기 (Megaphone)**: 채팅창에 `! 내용` 입력 시 100 골드를 소모하여 전 서버 화면 중앙에 거대 메가폰 브로드캐스트.
* **콤보 (Combo)**: 공격 성공 시 `combo` 카운트 상승. 3초간 공격 미발생 시 0으로 리셋.
* **서버 최초 (Server First)**: 서버 내 최초 50레벨 / 100레벨 달성 시 전 유저 화면에 기념 공지 발송.

### 3. 개발 진행 현황 (Completed Progress: Phase 1 ~ 45)
- `[x]` **Phase 1-35**: 기초 아키텍처, 전투, AI, 퀘스트, PVP, 길드, 탈것, 낮/밤, 월드보스, 크리티컬, 타이틀, 환생, 아우라, 펫, 날씨
- `[x]` **Phase 36**: 안전 지대 (Safe Zone, X: 350-450)
- `[x]` **Phase 37**: 감정 표현 시스템 (Emotes: 키 4, 5, 6)
- `[x]` **Phase 38**: 회피 시스템 (AGI 기반 Dodge & MISS! 연출)
- `[x]` **Phase 39**: 직업별 데미지 텍스트 색상 (Fighter: Red, Grappler: Purple)
- `[x]` **Phase 40**: 데스 패널티 (사망 시 경험치 10% 삭감)
- `[x]` **Phase 41**: 자리 비움 감지 (AFK 60초 감지 & [Zzz] 상태 표시)
- `[x]` **Phase 42**: 퀵 힐 단축키 (H키 50골드 소모 즉시 회복)
- `[x]` **Phase 43**: 확성기 전체 공지 (`! 내용` 100골드 소모 전체 화면 공지)
- `[x]` **Phase 44**: 콤보 시스템 (연속 타격 스택 및 3초 리셋)
- `[x]` **Phase 45**: 서버 최초 달성 공지 (최초 50/100 레벨 달성 메가폰 알림)

---

## 🚀 실행 및 빌드 가이드 (Getting Started)

### 1. 사전 요구 사항 (Prerequisites)
* **Node.js**: v20.19+ 또는 v22.12+ (Prisma v7+ 호환성 필수)
* **npm**: v9+

### 2. 의존성 설치 및 공유 모듈 빌드 (Installation)
```bash
# 루트 디렉토리에서 전체 의존성 설치
npm install

# shared 공통 타입 빌드 (필수)
npm run build:shared
```

### 3. 로컬 개발 서버 실행 (Local Development)

#### 서버 실행 (Server)
```bash
cd server
npm run dev
# 기본 실행 주소: ws://localhost:2567
```

#### 클라이언트 실행 (Client)
```bash
cd client
npm run dev
# 기본 접속 주소: http://localhost:5173
```

---

## 🛠 CI/CD 및 자동화 배포 파이프라인 (Automated Pipeline)

`.github/workflows/deploy.yml` 파일에 구성된 자동 검증 가이드입니다.

```bash
# 1. Shared 타입 빌드
npm run build:shared

# 2. 서버 타입 검사 및 프리즈마 생성
cd server
npx prisma generate
npx tsc -b

# 3. 클라이언트 프론트엔드 빌드
cd client
npm run build
```

---

## 🎮 조작키 안내 (Keybindings Reference)

| 단축키 | 기능 설명 |
| :--- | :--- |
| **방향키 (← ↑ → ↓)** | 캐릭터 8방향 이동 |
| **Space Bar** | 일반 공격 (공격 성공 시 콤보 누적) |
| **Z** | 클래스 전용 스킬 발사 (라리앗) |
| **Shift** | 필드 드랍 아이템(골드/벨트/무기) 획득 |
| **H** | 퀵 힐 (50 골드 소모 즉시 HP/MP MAX) |
| **B** | 물약 상점 (마을 안전지대 인근) |
| **P** | NPC 스탯 초기화 상점 UI 토글 |
| **I** | 인벤토리 UI 토글 |
| **Q** | 퀘스트 수락 및 완료 |
| **F / G** | 10레벨 달성 시 파이터(F) / 그래플러(G) 전직 |
| **4 / 5 / 6** | 감정 표현 이모지 (😀 / 😠 / 😭) |
| **! 내용 (채팅창)** | 전 서버 확성기 공지 (100 골드 소모) |

---

## 💡 AI Agent 후속 작업 지침 (Instructions for Next Tasks)
1. **타입 안전성 유지**: `shared/src/index.ts` 수정 시 항상 `npm run build:shared`를 실행하여 컴파일 한 뒤 `server` 및 `client`에 적용하십시오.
2. **권한 서버 검증**: 데미지, 경험치, 스탯 변동은 반드시 `server/src/rooms/GameRoom.ts`에서 검증 및 브로드캐스트되어야 합니다.
3. **자동 Git 푸시 규칙**: 각 기능 개발 완료 및 `npx tsc -b` / `npm run build` 검증 완료 후 메인 브랜치(`main`)에 자동 commit 및 push를 수행하십시오.
