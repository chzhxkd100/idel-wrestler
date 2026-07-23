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
│   ├── engine/
│   │   ├── GameEngine.js    # Canvas rendering loop, parallax background, map elements, player filtering
│   │   ├── PhysicsEngine.js # Map definitions (platforms, ladders, portals), collision AABB, gravity, jump
│   │   └── SpriteManager.js # Procedural Canvas 2D drawing (Player body animations, animated Portals)
│   ├── styles/
│   │   └── main.css         # Clean dark mode UI overlay & HUD layout
│   ├── index.html           # Canvas container, minimap overlay, control guide, login modal
│   └── main.js              # Client entry, Socket.io event listeners, 60FPS physics loop (~20Hz socket emit)
├── package.json             # NPM dependencies & dev scripts
├── vite.config.js           # Vite config
└── CONTEXT.md               # [THIS FILE] AI Agent handoff context & development rules
```

---

## 3. Current Engine Architecture & Systems

### 3.1 Multi-Map System (`map1`, `map2`, `map3`)

Defined in `PhysicsEngine.js`:
1. **`map1` (🌲 엘니아 수호의 숲 / Theme: `forest`)**
   - Blue night sky, dark hill parallax.
   - Portal: `x: 450, y: 920` ➔ Target: `map2` (`targetX: 150, targetY: 920`).
2. **`map2` (⛰️ 헤네시스 수련 고원 / Theme: `highland`)**
   - Purple/sunset sky, dusk mountain parallax.
   - Portal 1: `x: 150, y: 920` ➔ Target: `map1` (`targetX: 450, targetY: 920`).
   - Portal 2: `x: 600, y: 920` ➔ Target: `map3` (`targetX: 150, targetY: 920`).
3. **`map3` (🌋 지옥 용암 동굴 / Theme: `cave`)**
   - Dark lava red cave sky, magma rocks parallax.
   - Portal: `x: 150, y: 920` ➔ Target: `map2` (`targetX: 600, targetY: 920`).

### 3.2 Physics & Collision Engine
- **Gravity:** `0.65`, **Friction:** `0.82`, **Max Speed:** `6.5`, **Jump Force:** `-13.5`.
- **Platforms:** AABB floor collision with one-way top snapping.
- **Ladders:** Vertical snapping on `W`/`S` or `Up`/`Down`. Jump off ladder supported via `Space`.
- **Portals:** Distance margin check (< 50px). Triggered on `W` or `ArrowUp` keydown event.

### 3.3 Socket.io Events Specification

| Event Name | Direction | Payload | Description |
|---|---|---|---|
| `joinGame` | Client ➔ Server | `{ nickname }` | Client requests game join. |
| `initSelf` | Server ➔ Client | `{ selfId, player }` | Server acknowledges join & assigns socket ID. |
| `playerUpdate` | Client ➔ Server | `{ mapId, x, y, vx, vy, facing, animState, isClimbing }` | Sent at ~20Hz from active client. |
| `gameState` | Server ➔ Client | `{ players }` | Broadcasted at 30FPS interval to all clients. |
| `changeMap` | Client ➔ Server | `{ targetMap, targetX, targetY }` | Sent when player interacts with a portal. |
| `mapChanged` | Server ➔ Client | `{ mapId, x, y }` | Server confirms new map state. |
| `playerLeft` | Server ➔ Client | `socketId` | Broadcasted on socket disconnect. |

### 3.4 Multi-Player Filtering & Minimap
- `GameEngine.js` only renders players whose `mapId` matches the local player's `mapId`.
- Minimap displays current map's platforms, blue portal dots, green remote player dots, and glowing yellow local player dot.

---

## 4. Guidelines for Future AI Assistants

1. **Keep it Step-by-Step:** Do not introduce bloated or unnecessary features all at once. Add features incrementally upon user request.
2. **Always Maintain Context:** Whenever files are added, refactored, or new Socket events are introduced, update this `CONTEXT.md` file immediately before finishing your turn.
3. **Verification Policy:** Always run `npm run build` and test using `browser_subagent` before concluding any feature additions.

---

## 5. Next Planned Roadmap (For Reference)

When requested by the user, features should be added in the following order:
- [ ] **Phase 1 (Current Done):** Map, Physics (Movement/Ladder/Portal), Multiplayer Sync.
- [ ] **Phase 2:** Simple Mob Spawner (Static & wandering mobs per map).
- [ ] **Phase 3:** Basic Attack & Hit Detection (Normal attack key `Z`, Mob damage).
- [ ] **Phase 4:** EXP / Level System & Basic UI Stats HUD.
- [ ] **Phase 5:** Simple Inventory / Item Drops.
