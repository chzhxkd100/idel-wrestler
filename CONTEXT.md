# PROJECT CONTEXT & ARCHITECTURE SPECIFICATION (AI HANDOFF DOCUMENT)

> **ATTENTION AI ASSISTANTS & AGENTS:**
> This document contains authoritative context, architectural specifications, data structures, and state machines for `idel-wrestler` project.
> **MANDATORY INSTRUCTION:** Every time you modify the codebase or add features, you MUST update this `CONTEXT.md` file to keep it current.

---

## 1. Project Overview & Tech Stack

- **Project Name:** 2D Side-Scrolling Multi-Map Engine (`idel-wrestler`)
- **Target Design Philosophy:** Incremental modular development starting from core map physics and multiplayer synchronization.
- **Tech Stack:**
  - **Client:** HTML5 Canvas (2D Context), Vanilla JavaScript (ES Modules), Vite (Dev Server & Bundler).
  - **Server:** Node.js (ESM `type: module`), Express (Static Server), Socket.io v4 (Real-time WebSockets).
  - **Styling:** Custom Modern Dark Mode CSS (`src/styles/main.css`).

---

## 2. Directory Map & File Responsibilities

```
idel-wrestler/
├── server/
│   └── server.js            # Node.js + Express + Socket.io Server (30FPS tick, player state broadcast)
├── src/
│   ├── data/
│   │   ├── maps/            # Designer-friendly Map configurations (town_map.js 12,000x2,400px schema, index.js)
│   │   └── npcs/            # Designer-friendly Modular NPC definitions (coral_island.js, index.js)
│   ├── engine/
│   │   ├── GameEngine.js    # Canvas rendering loop, dynamic camera bounds, parallax background, minimap
│   │   ├── PhysicsEngine.js # Core physics loop, collision AABB, loads MAP_REGISTRY from data/maps
│   │   ├── SpriteManager.js # Paperdoll player rendering, Portals, Mobs, NPC dialog & portrait rendering
│   │   └── TileMapManager.js# Seamless 64x64 tilemap renderer & layer grid management
│   ├── styles/
│   │   └── main.css         # Clean dark mode UI overlay & HUD layout
│   ├── index.html           # Canvas container, minimap overlay, control guide, login modal
│   └── main.js              # Client entry, Socket.io event listeners, 60FPS physics loop (~20Hz socket emit)
├── tools/
│   ├── generate_town_assets.js # Town map asset & sprite generation utility
│   └── remove_bg.js         # BFS Flood-Fill Background Removal & Transparent PNG Generator Tool
├── package.json             # NPM dependencies & dev scripts
├── vite.config.js           # Vite config
└── CONTEXT.md               # [THIS FILE] AI Agent handoff context & development rules
```

---

## 3. Current Engine Architecture & Systems

### 3.1 Multi-Map System & Dynamic Map Dimensions
Maps support dynamic dimensions (`width`, `height`), with camera clamping and minimap scaling adapting automatically per map:

1. **`map1` (🌲 엘니아 수호의 숲 / Theme: `forest` / 2400x1200)**
   - Blue night sky, dark hill parallax.
   - Portal 1: `x: 450, y: 920` ➔ Target: `map2` (`targetX: 150, targetY: 920`).
   - Portal 2: `x: 1850, y: 920` ➔ Target: `map4` (`targetX: 300, targetY: 1320`).
2. **`map2` (⛰️ 헤네시스 수련 고원 / Theme: `highland` / 2400x1200)**
   - Purple/sunset sky, dusk mountain parallax.
   - Portal 1: `x: 150, y: 920` ➔ Target: `map1` (`targetX: 450, targetY: 920`).
   - Portal 2: `x: 600, y: 920` ➔ Target: `map3` (`targetX: 150, targetY: 920`).
   - Portal 3: `x: 1800, y: 920` ➔ Target: `map4` (`targetX: 2400, targetY: 1320`).
3. **`map3` (🌋 지옥 용암 동굴 / Theme: `cave` / 2400x1200)**
   - Dark lava red cave sky, magma rocks parallax.
   - Portal 1: `x: 150, y: 920` ➔ Target: `map2` (`targetX: 600, targetY: 920`).
   - Portal 2: `x: 1950, y: 920` ➔ Target: `map4` (`targetX: 4500, targetY: 1320`).
4. **`map4` (🏰 코랄 아일랜드 메가 메트로폴리스 / Theme: `coral_island` / 12000x2400)**
   - **Mega Metropolis Map:** 12,000px width × 2,400px height grand 6-level multi-tier tropical metropolis layout.
   - **TileMap & Assets:** Integrated `TileMapManager` with 39 dedicated PNG assets (tiles, buildings, props, decor, portraits, field sprites). Legacy unused assets (`coral_tree.png`, `npc_girl.png`) purged (~2MB reduced), default NPC fallback portrait updated to `/assets/portraits/portrait_liria.png`.
   - **Diverse Platform Visual Styles:** Supports 6 platform visual types (`stepping_stone`, `wood_deck`, `stone_terrace`, `mossy_ruins`, `volcanic_ledge`, `floating_crystal`).
   - **Atmospheric Particle Weather:** Multi-theme floating ambient particles (forest pollen, mountain embers, lava sparks, sea bubbles).
   - **Portals:** Portal 1 (`x: 300` ➔ `map1`), Portal 2 (`x: 2400` ➔ `map2`), Portal 3 (`x: 4500` ➔ `map3`).

### 3.2 Designer-Friendly Modular NPC Data Structure (`src/data/npcs/`)
- NPC definitions are completely decoupled from engine logic into modular configuration files:
  - `src/data/npcs/coral_island.js` (6 NPCs: 항해사 카엘, 마을 안내원 리리아, 챔피언 칼, 해변 촌장 피트, 달빛 상인 루나, 천문학자 아스트로)
  - `src/data/npcs/forest.js` (Elnia Forest NPCs)
  - `src/data/npcs/highland.js` (Hennesys Highland NPCs)
  - `src/data/npcs/cave.js` (Lava Cave NPCs)
  - `src/data/npcs/index.js` (Central registry & designer query API `getNPCsForMap`)
- Designers can easily open `src/data/npcs/` to add new NPCs, alter dialogues, portraits, titles, or coordinates without modifying engine code.

### 3.2 Physics & Collision Engine
- **Gravity:** `0.65`, **Friction:** `0.82`, **Max Speed:** `6.5`, **Jump Force:** `-13.5`.
- **Frame-Rate Independence (`dt` Normalized):** `PhysicsEngine.updatePlayerPhysics` scales acceleration, friction decay, gravity, and velocities by `dt` step ratio (`dt * 60`), ensuring smooth movement on 60Hz/120Hz/144Hz displays.
- **Platforms:** AABB floor collision with one-way top snapping.
- **Ladders:** Vertical snapping on `W`/`S` or `Up`/`Down`. Jump off ladder supported via `Space`.
- **Portals:** Distance margin check (< 50px). Triggered on `W` or `ArrowUp` keydown event.

### 3.3 Socket.io Events Specification

| Event Name | Direction | Payload | Description |
|---|---|---|---|
| `joinGame` | Client ➔ Server | `{ nickname }` | Client requests game join. |
| `initSelf` | Server ➔ Client | `{ selfId, player }` | Server acknowledges join & assigns socket ID. |
| `playerUpdate` | Client ➔ Server | `{ mapId, x, y, vx, vy, facing, animState, isClimbing, equipment }` | Sent at ~20Hz from active client. |
| `gameState` | Server ➔ Client | `{ players }` | Broadcasted at 30FPS interval to all clients. |
| `changeEquipment` | Client ➔ Server | `{ hat, top, bottom, weapon }` | Triggers instant equipment change. |
| `playerEquipChanged` | Server ➔ Client | `{ id, equipment }` | Broadcasts equipment update to all connected clients. |
| `changeMap` | Client ➔ Server | `{ targetMap, targetX, targetY }` | Sent when player interacts with a portal. |
| `mapChanged` | Server ➔ Client | `{ mapId, x, y }` | Server confirms new map state. |
| `playerLeft` | Server ➔ Client | `socketId` | Broadcasted on socket disconnect. |

### 3.4 Multi-Player Filtering, Smoothing & Paperdoll Equipment System
- **Paperdoll Modular Layer System (`SpriteManager.js`):** Player characters render via a multi-layer equipment paperdoll architecture (Scale ~1.45x for heroic, legible proportions):
  1. **Layer 1 (Skin & Anatomy):** Base head/neck skin and eye expression.
  2. **Layer 2 (Bottom / Pants & Greaves):** `steel_pants`, `royal_pants`, `dark_pants` with animated walking legs.
  3. **Layer 3 (Top / Chest Armor):** `knight_plate`, `golden_armor`, `royal_coat`.
  4. **Layer 4 (Hat / Helmet):** `knight_helm`, `crown`, `wizard_hat`, `none`.
  5. **Layer 5 (Arms & Weapon):** `magic_sword` (Glowing Cyan Crystal Blade), `fire_blade` (Flaming Broadsword), `golden_spear` (Holy Spear) with swing animation & particle effects.
- **Dynamic Equipment Hotkeys & Multi-player Sync:** Hotkeys `1` (Weapon), `2` (Hat/Helm), `3` (Top/Bottom Armor) trigger real-time equipment swapping broadcasted across all multiplayer clients via Socket.io.
- **Client Prediction & Self Rendering:** `GameEngine.js` explicitly renders `localPlayer` for self instead of overwriting with delayed 30Hz server state, eliminating input lag and visual stuttering.
- **Remote Player Lerp Interpolation:** Position of remote players (`renderX`, `renderY`) is smoothly interpolated frame-by-frame (`lerp`) to prevent choppy movement.
- **Camera Lerp:** Camera tracking uses delta-time exponential smoothing (`1 - 0.85^(dt * 60)`).
- **Minimap:** Displays current map's platforms, blue portal dots, green remote player dots, and glowing yellow local player dot.

### 3.6 Episode 1 Main Story Quests & High-Detail NPC Engine
- **Main Story Quests (`src/data/quests/main_quest.js` & `QuestManager.js`):**
  - **Episode 1: "타락한 수호석과 4대 대륙의 전설"**:
    - Quest 1: `🌲 숲의 서막: 오염된 수호석` (`npc_forest_luna` ➔ `npc_highland_lucas`)
    - Quest 2: `⛰️ 고원의 시련: 기사의 자격` (`npc_highland_lucas` ➔ `npc_cave_garon`)
    - Quest 3: `🌋 동굴의 비밀: 마그마 제단 봉인` (`npc_cave_garon` ➔ `npc_pete`)
    - Quest 4: `🏰 영웅의 탄생: 대도시의 구원자` (`npc_pete` Complete Reward!)
  - **Quest Tracker HUD (`#quest-tracker`)**: Displays current quest title, state (`[수락 가능]`, `[진행 중]`), and narrative description in top-left overlay.
  - **Interactive Dialogue Modal**: Features NPC portrait, typing story dialogue, and `[📜 퀘스트 수락]` / `[🏆 퀘스트 완료]` action buttons.
- **High-Detail Procedural NPC Renderers (`SpriteManager.js`):**
  - `drawNPC` renders customized 2D fantasy avatars (`fairy` with flapping translucent wings & wand, `knight` with steel plate & red cape, `alchemist` with goggles & potions, `wizard` with robe & crystal staff).
  - Ground magic aura halos and bouncing overhead Quest Mark Badges (`!` for available, `?` for completion).

---

## 4. Guidelines for Future AI Assistants

1. **Keep it Step-by-Step:** Do not introduce bloated or unnecessary features all at once. Add features incrementally upon request.
2. **Always Maintain Context:** Whenever files are added, refactored, or new Socket events are introduced, update this `CONTEXT.md` file immediately before finishing your turn.
3. **Verification Policy:** Always run `npm run build` to verify code integrity. DO NOT perform long, repetitive automated browser subagent testing. Simply launch/verify the dev server and hand off to the user immediately for direct browser testing.

---

## 5. Next Planned Roadmap (For Reference)

When requested by the user, features should be added in the following order:
- [x] **Phase 1 (Done):** Map, Physics (Movement/Ladder/Portal), Multiplayer Sync & High/Dark Fantasy Visual Engine.
- [x] **Phase 2 (Done):** Episode 1 Main Story Questline, Quest Tracker HUD & High-Detail Fantasy NPC Renderer.
- [ ] **Phase 3:** Simple Mob Spawner (Static & wandering mobs per map).
- [ ] **Phase 4:** Basic Attack & Hit Detection (Normal attack key `Z`, Mob damage).
- [ ] **Phase 5:** EXP / Level System & Basic UI Stats HUD.
- [ ] **Phase 6:** Simple Inventory / Item Drops.


