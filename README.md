# 🤼 레슬러 키우기 (Wrestler Raising MMORPG)

100% AI 자동화로 개발 및 지속 보수되는 2D 횡스크롤 실시간 멀티플레이어(MMORPG) 웹 게임입니다.  
메이플스토리, 귀혼 스타일의 2D 액션 아케이드 횡스크롤 시스템과 고성능 권한 서버(Authoritative Server) 구조로 제작되었습니다.

---

## 🚀 실행 및 테스트 가이드 (Getting Started)

### 1. 사전 요구 사항 (Prerequisites)
* **Node.js**: `v20.19+` 또는 `v22.12+` (Prisma v7+ 호환성)
* **npm**: `v9+`

### 2. 의존성 설치 및 공유 모듈 빌드 (Setup)
```bash
# 1. 루트 디렉토리에서 전체 의존성 설치
npm install

# 2. shared 공통 타입 빌드 (필수)
npm run build:shared
```

### 3. 로컬 서버 & 클라이언트 실행 방법 (Local Run)

#### 1) 게임 서버 실행 (Terminal 1)
```bash
cd server
npm run dev
# 기본 WebSocket 주소: ws://localhost:2567
```

#### 2) 웹 클라이언트 실행 (Terminal 2)
```bash
cd client
npm run dev
# 브라우저 접속 주소: http://localhost:5173
```

---

## 🎮 게임 조작키 (Keybindings Reference)

| 단축키 | 기능 설명 |
| :--- | :--- |
| **방향키 (← ↑ → ↓)** | 캐릭터 8방향 이동 |
| **Space Bar** | 일반 공격 (타격 성공 시 콤보 누적) |
| **Z** | 클래스 전용 스킬 (라리앗) |
| **Shift** | 드랍된 아이템(골드/벨트/전설무기) 획득 |
| **H** | 퀵 힐 (50 골드 소모 즉시 HP/MP MAX) |
| **B** | 물약 상점 (안전 지대 인근) |
| **P** | 스탯 리셋 상점 UI 토글 |
| **I** | 인벤토리 UI 토글 |
| **Q** | 퀘스트 수락 및 완료 |
| **F / G** | 10레벨 달성 시 파이터(F) / 그래플러(G) 전직 |
| **4 / 5 / 6** | 감정 표현 이모지 (😀 / 😠 / 😭) |
| **! 내용 (채팅창)** | 전 서버 확성기 공지 (100 골드 소모) |

---

## 🛠 아키텍처 요약 (Architecture Summary)
* **Server**: Colyseus 0.15 + Node.js (Authoritative State Sync)
* **Client**: Phaser 3 + Vite 2D HTML5 Canvas
* **Database**: Prisma ORM (SQLite / PostgreSQL)
* **Monorepo**: npm Workspaces (`server`, `client`, `shared`)

---

## 🤖 AI 개발자 지침 및 진행 현황 (For AI Agents)
본 프로젝트의 모든 자동 개발 지침과 지속적인 개발 현황 문서는 아래 파일에 정의되어 있습니다:
* [AGENTS.md](file:///c:/Users/gguser/Desktop/%EA%B9%80%EB%AF%BC%ED%99%98/idel-wrestler/AGENTS.md): AI 작업 수행 규칙, 자동 Git 관리, 자동 문서화 및 타입 체킹 가이드
* [PROJECT_STATUS.md](file:///c:/Users/gguser/Desktop/%EA%B9%80%EB%AF%BC%ED%99%98/idel-wrestler/PROJECT_STATUS.md): 완료된 Phase 1~45 기능 사양 및 다음 개발 로드맵 문서
