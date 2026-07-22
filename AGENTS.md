# 🤖 AGENTS.md — AI 자동 개발 & 지속성(Continuity) 가이드

이 프로젝트는 사람의 수동 개입 없이 **AI 에이전트(LLM/Copilot/Antigravity 등)** 가 완전히 스스로 개발, 테스트, 문서화, Git 관리를 자동 수행하도록 구성되었습니다. 다른 환경/컴퓨터에서 작업을 승계하는 모든 AI 에이전트는 본 가이드를 준수해야 합니다.

---

## 1. 🚀 작업 시작 시 필수 확인 단계 (Context Recovery)

새로운 환경이나 세션에서 작업을 시작할 때 AI 에이전트는 아래 순서대로 컨텍스트를 파악합니다:

1. **[PROJECT_STATUS.md](file:///c:/Users/gguser/Desktop/%EA%B9%80%EB%AF%BC%ED%99%98/idel-wrestler/PROJECT_STATUS.md) 필독**:
   * 현재 진행된 Phase 단계(Phase 1~45 완료 상태)와 구현된 게임 메커니즘 확인.
   * 다음으로 구현해야 할 개발 로드맵(Phase 46+) 확인.
2. **코드베이스 구조 파악**:
   * `shared/src/index.ts`: 공통 인터페이스 및 메시지 타입 정의.
   * `server/src/rooms/GameRoom.ts`: 권한 서버 전투, 데미지, 스폰, 콤보, 타이머 로직.
   * `server/src/rooms/schema/GameState.ts`: Colyseus 동기화 스키마 (Player, Monster, Item, Npc).
   * `client/src/main.ts`: Phaser 3 렌더링 및 키보드 입력/UI 렌더링.

---

## 2. 🛠 기능 구현 및 빌드 파이프라인 수칙 (Development Rules)

새로운 기능(Phase)을 구현할 때는 항상 아래 표준 파이프라인을 엄격히 준수합니다.

```
[1. shared 타입 정의] ➔ [2. npm run build:shared] ➔ [3. server 스키마/로직 수정] ➔ [4. npx tsc -b 검증] ➔ [5. client 렌더링 수정] ➔ [6. npm run build 검증] ➔ [7. PROJECT_STATUS.md 업데이트] ➔ [8. Git Commit & Push]
```

### 상세 수칙:
1. **타입 안전성 (Type Safety)**:
   * 스키마 속성이나 네트워크 메시지가 변경될 경우 `shared/src/index.ts`를 먼저 수정하고 `npm run build:shared`를 실행합니다.
2. **서버 권한 검증 (Authoritative Server)**:
   * 골드, 경험치, 스탯, 체력, 콤보, 회피, 스폰 등 모든 주요 게임 로직은 반드시 `server/src/rooms/GameRoom.ts`에서 계산하고 클라이언트로 브로드캐스트합니다.
3. **타입 컴파일 검증**:
   * 코드 수정 후 `server` 디렉토리에서 `npx tsc -b` 명령어를 수행하여 타입 에러가 0개인지 확인합니다.
4. **클라이언트 빌드 검증**:
   * `client` 디렉토리에서 `npm run build`를 실행하여 Vite 빌드가 정상 완료되는지 확인합니다.

---

## 3. 📝 문서 자동화 및 상태 유지 관리 (Documentation Maintenance)

기능(Phase)을 구현할 때마다 AI 에이전트는 프로젝트 루트의 **[PROJECT_STATUS.md](file:///c:/Users/gguser/Desktop/%EA%B9%80%EB%AF%BC%ED%99%98/idel-wrestler/PROJECT_STATUS.md)** 파일을 자동으로 업데이트해야 합니다.

* `[x]` 체크리스트 갱신.
* 새롭게 추가된 기능의 서버/클라이언트 작동 방식 요약 작성.
* 다음 구현할 Phase 목록 유지보수.

---

## 4. 🐙 원격 Git 관리 자동화 (Git Automation Rules)

기능 검증이 끝나면 AI 에이전트는 사용자의 별도 지시가 없어도 원격 저장소(`main` 브랜치)로 커밋 및 푸시를 완료해야 합니다.

```bash
git add .
git commit -m "feat: Implement Phase XX <기능명>"
git push origin main
```

---

## 💡 AI 에이전트 지침 요약
* **절대 멈추지 마십시오**: 유저가 "계속 만들어줘"라고 했을 때는 토큰 제한에 도달할 때까지 연속적으로 Phase를 계획 ➔ 구현 ➔ 검증 ➔ Git Push ➔ 문서화 단계를 순환하십시오.
* **에러 발생 시**: 즉시 full log를 확인하고 근본 원인을 수정 후 다시 빌드 검증을 거쳐 Git에 동기화하십시오.
