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

  preload() {
    this.load.image("background", "/assets/background.png");
    this.load.image("wrestler", "/assets/wrestler.png");
    this.load.image("monster", "/assets/monster.png");
  }

  create() {
    // 1. Setup Camera & Bounds (2400px x 600px Map)
    this.cameras.main.setBounds(0, 0, 2400, 600);

    // Background Image or Fallback Fill
    if (this.textures.exists("background") && this.textures.get("background").key !== "__MISSING") {
      this.add.tileSprite(1200, 300, 2400, 600, "background");
    } else {
      const bg = this.add.graphics();
      bg.fillStyle(0x1a237e, 1.0);
      bg.fillRect(0, 0, 2400, 600);
    }

    // 2. Draw Maple 2D Ground & Platforms
    const graphics = this.add.graphics();
    graphics.setDepth(1);
    
    // Main Ground (Grass)
    graphics.fillStyle(0x2e7d32, 1.0);
    graphics.fillRect(0, 520, 2400, 80);
    graphics.lineStyle(4, 0x1b5e20, 1.0);
    graphics.lineBetween(0, 520, 2400, 520);

    // Floating Wooden Platforms
    graphics.fillStyle(0x795548, 1.0);
    graphics.fillRect(300, 380, 400, 20);
    graphics.fillRect(1000, 380, 400, 20);
    graphics.fillRect(1700, 380, 400, 20);
    graphics.lineStyle(2, 0x4e342e, 1.0);
    graphics.strokeRect(300, 380, 400, 20);
    graphics.strokeRect(1000, 380, 400, 20);
    graphics.strokeRect(1700, 380, 400, 20);

    // 3. Bind Keyboard Controls
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.attackKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // 4. Fixed View UI Header
    this.myLevelText = this.add.text(15, 15, "LVL: 1", { fontSize: '22px', color: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4 }).setScrollFactor(0).setDepth(100);
    this.myExpText = this.add.text(15, 45, "EXP: 0 / 100", { fontSize: '18px', color: '#ffeb3b', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4 }).setScrollFactor(0).setDepth(100);

    this.statusText = this.add.text(400, 300, "Connecting to Game Server...", { fontSize: '22px', color: '#ffffff', backgroundColor: '#000000bb', padding: { x: 20, y: 12 } }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

    this.add.text(15, 565, "🎮 Controls: [Left / Right Arrow] Move | [Space] Attack Monster", { fontSize: '14px', color: '#ffffff', backgroundColor: '#000000cc', padding: { x: 10, y: 5 } }).setScrollFactor(0).setDepth(100);

    // 5. Connect Server
    this.connectServer();
  }

  async connectServer() {
    try {
      this.myUsername = (window as any).GAME_USERNAME || "Wrestler_Guest";
      this.room = await client.joinOrCreate("game", { username: this.myUsername });
      this.isConnected = true;
      if (this.statusText) this.statusText.destroy();
      console.log("[Client] Connected to Colyseus Room:", this.room.roomId);

      this.setupRoomEvents();
    } catch (e) {
      console.error("[Client] Connection Failed:", e);
      if (this.statusText) {
        this.statusText.setText("Connection Failed!\nPlease ensure server is running on port 2567.");
        this.statusText.setColor("#ff5252");
      }
    }
  }

  setupRoomEvents() {
    // Damage Popup Listener
    this.room.onMessage("damage", (data: { targetId: string; damage: number }) => {
      const container = this.monsterContainers[data.targetId] || this.playerContainers[data.targetId];
      if (container) {
        const dmgText = this.add.text(container.x, container.y - 60, `-${data.damage}`, { fontSize: '24px', color: '#ff1744', fontStyle: 'bold', stroke: '#ffffff', strokeThickness: 3 }).setDepth(50);
        this.tweens.add({
          targets: dmgText,
          y: container.y - 110,
          alpha: 0,
          duration: 900,
          onComplete: () => dmgText.destroy()
        });
      }
    });

    // Levelup Listener
    this.room.onMessage("levelup", (data: { playerId: string; level: number }) => {
      if (data.playerId === this.room.sessionId) {
        this.myLevelText.setText(`LVL: ${data.level}`);
        const lvlText = this.add.text(400, 200, "⚡ LEVEL UP! ⚡", { fontSize: '40px', color: '#ffea00', fontStyle: 'bold', stroke: '#000000', strokeThickness: 5 }).setOrigin(0.5).setScrollFactor(0).setDepth(200);
        this.tweens.add({
          targets: lvlText,
          y: 140,
          alpha: 0,
          duration: 1600,
          onComplete: () => lvlText.destroy()
        });
      }
    });

    // Player Sync Handler
    const syncPlayer = (player: any, sessionId: string) => {
      this.createOrUpdatePlayer(player, sessionId);
      player.onChange(() => {
        this.createOrUpdatePlayer(player, sessionId);
      });
    };

    this.room.state.players.onAdd((player: any, sessionId: string) => {
      syncPlayer(player, sessionId);
    });

    this.room.state.players.forEach((player: any, sessionId: string) => {
      syncPlayer(player, sessionId);
    });

    this.room.state.players.onRemove((player: any, sessionId: string) => {
      if (this.playerContainers[sessionId]) {
        this.playerContainers[sessionId].destroy();
        delete this.playerContainers[sessionId];
      }
    });

    // Monster Sync Handler
    const syncMonster = (monster: any, id: string) => {
      this.createOrUpdateMonster(monster, id);
      monster.onChange(() => {
        this.createOrUpdateMonster(monster, id);
      });
    };

    this.room.state.monsters.onAdd((monster: any, id: string) => {
      syncMonster(monster, id);
    });

    this.room.state.monsters.forEach((monster: any, id: string) => {
      syncMonster(monster, id);
    });

    this.room.state.monsters.onRemove((monster: any, id: string) => {
      if (this.monsterContainers[id]) {
        this.monsterContainers[id].destroy();
        delete this.monsterContainers[id];
      }
    });
  }

  createOrUpdatePlayer(player: any, sessionId: string) {
    let container = this.playerContainers[sessionId];
    const isMe = (sessionId === this.room.sessionId);

    if (!container) {
      container = this.add.container(player.x, player.y);
      container.setDepth(10);

      // Sprite or Graphics Fallback
      if (this.textures.exists("wrestler") && this.textures.get("wrestler").key !== "__MISSING") {
        const sprite = this.add.sprite(0, -25, "wrestler");
        sprite.setScale(0.25);
        container.add(sprite);
      } else {
        const gfx = this.add.graphics();
        gfx.fillStyle(isMe ? 0x29b6f6 : 0xab47bc, 1.0);
        gfx.fillRect(-16, -40, 32, 40);
        gfx.fillStyle(0xffe0b2, 1.0);
        gfx.fillCircle(0, -50, 16);
        gfx.fillStyle(0xffd54f, 1.0);
        gfx.fillRect(-16, -24, 32, 8);
        gfx.fillStyle(0x000000, 1.0);
        gfx.fillCircle(-5, -53, 3);
        gfx.fillCircle(5, -53, 3);
        container.add(gfx);
      }

      // Name Tag
      const nameColor = isMe ? '#00e676' : '#ffffff';
      const nameText = this.add.text(0, -80, `[Lv.${player.level}] ${player.name || "Wrestler"}`, { fontSize: '14px', color: nameColor, fontStyle: 'bold', stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5);
      nameText.setName("nameText");
      container.add(nameText);

      // HP Bar Graphic
      const hpGfx = this.add.graphics();
      hpGfx.setName("hpGfx");
      container.add(hpGfx);

      this.playerContainers[sessionId] = container;

      // Start Camera Follow for My Player
      if (isMe) {
        this.cameras.main.startFollow(container, true, 0.1, 0.1);
      }
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
      const barWidth = 40;
      const barHeight = 6;
      const hpRatio = Math.max(0, player.hp / player.maxHp);
      
      hpGfx.fillStyle(0x000000, 0.7);
      hpGfx.fillRect(-barWidth/2, -68, barWidth, barHeight);
      hpGfx.fillStyle(0x00e676, 1.0);
      hpGfx.fillRect(-barWidth/2, -68, barWidth * hpRatio, barHeight);
      hpGfx.lineStyle(1, 0xffffff, 0.8);
      hpGfx.strokeRect(-barWidth/2, -68, barWidth, barHeight);
    }

    if (isMe) {
      this.myLevelText.setText(`LVL: ${player.level}`);
      this.myExpText.setText(`EXP: ${player.exp} / ${player.maxExp}`);
    }
  }

  createOrUpdateMonster(monster: any, id: string) {
    let container = this.monsterContainers[id];

    if (!container) {
      container = this.add.container(monster.x, monster.y);
      container.setDepth(8);

      if (this.textures.exists("monster") && this.textures.get("monster").key !== "__MISSING") {
        const sprite = this.add.sprite(0, -25, "monster");
        sprite.setScale(0.35);
        container.add(sprite);
      } else {
        const gfx = this.add.graphics();
        gfx.fillStyle(monster.type === "Slime" ? 0x66bb6a : (monster.type === "RibbonPig" ? 0xef5350 : 0x8d6e63), 1.0);
        gfx.fillCircle(0, -20, 22);
        gfx.fillStyle(0xffffff, 1.0);
        gfx.fillCircle(-7, -25, 5);
        gfx.fillCircle(7, -25, 5);
        gfx.fillStyle(0x000000, 1.0);
        gfx.fillCircle(-7, -25, 2);
        gfx.fillCircle(7, -25, 2);
        container.add(gfx);
      }

      const typeText = this.add.text(0, -60, monster.type, { fontSize: '13px', color: '#ffeb3b', fontStyle: 'bold', stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5);
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
      hpGfx.fillRect(-barWidth/2, -50, barWidth, barHeight);
      hpGfx.fillStyle(0xff1744, 1.0);
      hpGfx.fillRect(-barWidth/2, -50, barWidth * hpRatio, barHeight);
      hpGfx.lineStyle(1, 0xffffff, 0.8);
      hpGfx.strokeRect(-barWidth/2, -50, barWidth, barHeight);
    }
  }

  update() {
    if (!this.isConnected || !this.room || !this.room.state) return;

    const myContainer = this.playerContainers[this.room.sessionId];
    if (!myContainer) return;

    let moved = false;
    let dx = 0;
    const speed = 5;

    if (this.cursors.left.isDown) {
      dx -= speed;
      moved = true;
    }
    if (this.cursors.right.isDown) {
      dx += speed;
      moved = true;
    }

    if (moved) {
      this.room.send("move", { x: myContainer.x + dx });
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
