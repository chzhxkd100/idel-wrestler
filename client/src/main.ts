import Phaser from "phaser";
import * as Colyseus from "colyseus.js";

const client = new Colyseus.Client("ws://localhost:2567");

class GameScene extends Phaser.Scene {
  private room!: Colyseus.Room;
  private myUsername!: string;
  private playerContainers: { [id: string]: Phaser.GameObjects.Container } = {};
  private monsterContainers: { [id: string]: Phaser.GameObjects.Container } = {};
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private attackKey!: Phaser.Input.Keyboard.Key;
  private myLevelText!: Phaser.GameObjects.Text;
  private myExpText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private isConnected: boolean = false;

  constructor() {
    super("GameScene");
  }

  create() {
    // 1. Setup Fixed 800x600 View Canvas Background & Terrain
    const bgGfx = this.add.graphics();
    bgGfx.fillStyle(0x1a1a2e, 1.0);
    bgGfx.fillRect(0, 0, 800, 600);

    // Grid Floor / Environment
    const terrain = this.add.graphics();
    terrain.fillStyle(0x27ae60, 1.0);
    terrain.fillRect(0, 500, 800, 100);
    terrain.lineStyle(4, 0x1e8449, 1.0);
    terrain.lineBetween(0, 500, 800, 500);

    // Floating Platform
    terrain.fillStyle(0x795548, 1.0);
    terrain.fillRect(250, 350, 300, 20);
    terrain.lineStyle(2, 0x4e342e, 1.0);
    terrain.strokeRect(250, 350, 300, 20);

    // 2. Bind Keyboard Controls (WASD & Arrow Keys)
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.attackKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // 3. UI Layer
    this.myLevelText = this.add.text(20, 20, "LVL: 1", { fontSize: '24px', color: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4 }).setDepth(100);
    this.myExpText = this.add.text(20, 55, "EXP: 0 / 100", { fontSize: '18px', color: '#f1c40f', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4 }).setDepth(100);

    this.statusText = this.add.text(400, 300, "Connecting to Game Server...", { fontSize: '24px', color: '#ffffff', backgroundColor: '#000000cc', padding: { x: 20, y: 12 } }).setOrigin(0.5).setDepth(100);

    this.add.text(20, 565, "🎮 Controls: [Arrow Keys / WASD] Move | [Space] Attack Monster", { fontSize: '14px', color: '#ffffff', backgroundColor: '#000000aa', padding: { x: 10, y: 5 } }).setDepth(100);

    // 4. Connect Colyseus Server
    this.connectServer();
  }

  async connectServer() {
    try {
      this.myUsername = (window as any).GAME_USERNAME || "Wrestler_Guest";
      this.room = await client.joinOrCreate("game", { username: this.myUsername });
      this.isConnected = true;
      if (this.statusText) this.statusText.destroy();
      console.log("[Client] Connected successfully to room:", this.room.roomId);

      this.setupRoomEvents();
    } catch (e) {
      console.error("[Client] Connection Error:", e);
      if (this.statusText) {
        this.statusText.setText("Connection Failed!\nPlease make sure server is running on port 2567.");
        this.statusText.setColor("#e74c3c");
      }
    }
  }

  setupRoomEvents() {
    // Damage Popup
    this.room.onMessage("damage", (data: { targetId: string; damage: number }) => {
      const container = this.monsterContainers[data.targetId] || this.playerContainers[data.targetId];
      if (container) {
        const dmgText = this.add.text(container.x, container.y - 50, `-${data.damage}`, { fontSize: '26px', color: '#e74c3c', fontStyle: 'bold', stroke: '#ffffff', strokeThickness: 3 }).setDepth(50);
        this.tweens.add({
          targets: dmgText,
          y: container.y - 100,
          alpha: 0,
          duration: 800,
          onComplete: () => dmgText.destroy()
        });
      }
    });

    // Level Up Popup
    this.room.onMessage("levelup", (data: { playerId: string; level: number }) => {
      if (data.playerId === this.room.sessionId) {
        this.myLevelText.setText(`LVL: ${data.level}`);
        const lvlText = this.add.text(400, 200, "⚡ LEVEL UP! ⚡", { fontSize: '42px', color: '#f1c40f', fontStyle: 'bold', stroke: '#000000', strokeThickness: 6 }).setOrigin(0.5).setDepth(200);
        this.tweens.add({
          targets: lvlText,
          y: 130,
          alpha: 0,
          duration: 1600,
          onComplete: () => lvlText.destroy()
        });
      }
    });

    // Sync Players
    const syncPlayer = (player: any, sessionId: string) => {
      this.createOrUpdatePlayer(player, sessionId);
      player.onChange(() => {
        this.createOrUpdatePlayer(player, sessionId);
      });
    };

    this.room.state.players.onAdd((player: any, sessionId: string) => syncPlayer(player, sessionId));
    this.room.state.players.forEach((player: any, sessionId: string) => syncPlayer(player, sessionId));

    this.room.state.players.onRemove((player: any, sessionId: string) => {
      if (this.playerContainers[sessionId]) {
        this.playerContainers[sessionId].destroy();
        delete this.playerContainers[sessionId];
      }
    });

    // Sync Monsters
    const syncMonster = (monster: any, id: string) => {
      this.createOrUpdateMonster(monster, id);
      monster.onChange(() => {
        this.createOrUpdateMonster(monster, id);
      });
    };

    this.room.state.monsters.onAdd((monster: any, id: string) => syncMonster(monster, id));
    this.room.state.monsters.forEach((monster: any, id: string) => syncMonster(monster, id));

    this.room.state.monsters.onRemove((monster: any, id: string) => {
      if (this.monsterContainers[id]) {
        this.monsterContainers[id].destroy();
        delete this.monsterContainers[id];
      }
    });
  }

  // Pure Graphics Vector Model (100% Guaranteed Visual Character Display)
  createOrUpdatePlayer(player: any, sessionId: string) {
    let container = this.playerContainers[sessionId];
    const isMe = (sessionId === this.room.sessionId);

    if (!container) {
      container = this.add.container(player.x, player.y);
      container.setDepth(10);

      // 1. Draw 2D Wrestler Character Model
      const gfx = this.add.graphics();
      // Body (Torso)
      gfx.fillStyle(isMe ? 0x3498db : 0x9b59b6, 1.0);
      gfx.fillRoundedRect(-18, -35, 36, 35, 6);
      // Head
      gfx.fillStyle(0xf5cba7, 1.0);
      gfx.fillCircle(0, -46, 15);
      // Wrestler Belt
      gfx.fillStyle(0xf1c40f, 1.0);
      gfx.fillRect(-18, -20, 36, 8);
      // Eyes
      gfx.fillStyle(0x2c3e50, 1.0);
      gfx.fillCircle(-5, -48, 3);
      gfx.fillCircle(5, -48, 3);

      container.add(gfx);

      // 2. Nametag & Level Badge
      const nameColor = isMe ? '#2ecc71' : '#ffffff';
      const nameText = this.add.text(0, -75, `[Lv.${player.level}] ${player.name || "Wrestler"}`, { fontSize: '15px', color: nameColor, fontStyle: 'bold', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5);
      nameText.setName("nameText");
      container.add(nameText);

      // 3. HP Bar Graphic
      const hpGfx = this.add.graphics();
      hpGfx.setName("hpGfx");
      container.add(hpGfx);

      this.playerContainers[sessionId] = container;
    }

    container.x = player.x;
    container.y = player.y;

    const nameText = container.getByName("nameText") as Phaser.GameObjects.Text;
    if (nameText) {
      nameText.setText(`[Lv.${player.level}] ${player.name || "Wrestler"}`);
    }

    const hpGfx = container.getByName("hpGfx") as Phaser.GameObjects.Graphics;
    if (hpGfx) {
      hpGfx.clear();
      const barWidth = 44;
      const barHeight = 6;
      const hpRatio = Math.max(0, player.hp / player.maxHp);
      
      hpGfx.fillStyle(0x000000, 0.7);
      hpGfx.fillRect(-barWidth/2, -62, barWidth, barHeight);
      hpGfx.fillStyle(0x2ecc71, 1.0);
      hpGfx.fillRect(-barWidth/2, -62, barWidth * hpRatio, barHeight);
      hpGfx.lineStyle(1, 0xffffff, 0.9);
      hpGfx.strokeRect(-barWidth/2, -62, barWidth, barHeight);
    }

    if (isMe) {
      this.myLevelText.setText(`LVL: ${player.level}`);
      this.myExpText.setText(`EXP: ${player.exp} / ${player.maxExp}`);
    }
  }

  // Pure Graphics Vector Model for Monster
  createOrUpdateMonster(monster: any, id: string) {
    let container = this.monsterContainers[id];

    if (!container) {
      container = this.add.container(monster.x, monster.y);
      container.setDepth(8);

      const gfx = this.add.graphics();
      const mobColor = monster.type === "Slime" ? 0x2ecc71 : (monster.type === "RibbonPig" ? 0xe74c3c : 0xe67e22);
      
      gfx.fillStyle(mobColor, 1.0);
      gfx.fillCircle(0, -20, 20);
      gfx.fillStyle(0xffffff, 1.0);
      gfx.fillCircle(-6, -24, 5);
      gfx.fillCircle(6, -24, 5);
      gfx.fillStyle(0x000000, 1.0);
      gfx.fillCircle(-6, -24, 2);
      gfx.fillCircle(6, -24, 2);

      container.add(gfx);

      const typeText = this.add.text(0, -52, monster.type, { fontSize: '13px', color: '#f1c40f', fontStyle: 'bold', stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5);
      container.add(typeText);

      const hpGfx = this.add.graphics();
      hpGfx.setName("hpGfx");
      container.add(hpGfx);

      this.monsterContainers[id] = container;
    }

    container.x = monster.x;
    container.y = monster.y;

    const hpGfx = container.getByName("hpGfx") as Phaser.GameObjects.Graphics;
    if (hpGfx) {
      hpGfx.clear();
      const barWidth = 40;
      const barHeight = 5;
      const hpRatio = Math.max(0, monster.hp / monster.maxHp);
      
      hpGfx.fillStyle(0x000000, 0.7);
      hpGfx.fillRect(-barWidth/2, -44, barWidth, barHeight);
      hpGfx.fillStyle(0xe74c3c, 1.0);
      hpGfx.fillRect(-barWidth/2, -44, barWidth * hpRatio, barHeight);
      hpGfx.lineStyle(1, 0xffffff, 0.8);
      hpGfx.strokeRect(-barWidth/2, -44, barWidth, barHeight);
    }
  }

  update() {
    if (!this.isConnected || !this.room || !this.room.state) return;

    const myContainer = this.playerContainers[this.room.sessionId];
    if (!myContainer) return;

    let moved = false;
    let dx = 0;
    let dy = 0;
    const speed = 5;

    if (this.cursors.left.isDown) { dx -= speed; moved = true; }
    if (this.cursors.right.isDown) { dx += speed; moved = true; }
    if (this.cursors.up.isDown) { dy -= speed; moved = true; }
    if (this.cursors.down.isDown) { dy += speed; moved = true; }

    if (moved) {
      this.room.send("move", { x: myContainer.x + dx, y: myContainer.y + dy });
    }

    if (Phaser.Input.Keyboard.JustDown(this.attackKey)) {
      let targetId: string | null = null;
      let minDistance = 120;

      for (const id in this.monsterContainers) {
        const mobContainer = this.monsterContainers[id];
        const dist = Phaser.Math.Distance.Between(myContainer.x, myContainer.y, mobContainer.x, mobContainer.y);
        if (dist < minDistance) {
          minDistance = dist;
          targetId = id;
        }
      }

      if (targetId) {
        this.room.send("attack", { targetId });
      }
    }
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  scene: GameScene,
  parent: "game-container",
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 }, debug: false }
  }
};

window.onload = () => {
  const loginBtn = document.getElementById("loginBtn");
  const usernameInput = document.getElementById("usernameInput") as HTMLInputElement;
  const loginScreen = document.getElementById("login-screen");
  const gameContainer = document.getElementById("game-container");

  const startLogin = (e?: Event) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const username = usernameInput ? (usernameInput.value.trim() || "Wrestler_" + Math.floor(Math.random() * 1000)) : "Wrestler_Guest";
    (window as any).GAME_USERNAME = username;

    if (loginScreen) loginScreen.style.display = "none";
    if (gameContainer) gameContainer.style.display = "block";

    new Phaser.Game(config);
    return false;
  };

  if (loginBtn) {
    loginBtn.addEventListener("click", startLogin);
  }
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", startLogin);
  }
};
