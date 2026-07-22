import Phaser from "phaser";
import * as Colyseus from "colyseus.js";

const client = new Colyseus.Client("ws://localhost:2567");

class GameScene extends Phaser.Scene {
  private room!: Colyseus.Room;
  private myUsername!: string;
  private players: { [id: string]: Phaser.GameObjects.Sprite } = {};
  private monsters: { [id: string]: Phaser.GameObjects.Sprite } = {};
  private uiTexts: { [id: string]: Phaser.GameObjects.Text } = {};
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
    this.load.image("background", "assets/background.png");
    this.load.image("wrestler", "assets/wrestler.png");
    this.load.image("monster", "assets/monster.png");
  }

  create() {
    // 1. World Bounds & Background Setup
    this.cameras.main.setBounds(0, 0, 2400, 600);
    this.add.tileSprite(1200, 300, 2400, 600, "background");

    // 2. Draw 2D Ground & Platforms Graphics
    const graphics = this.add.graphics();
    graphics.setDepth(5);
    
    // Ground Floor
    graphics.fillStyle(0x2e7d32, 1.0);
    graphics.fillRect(0, 520, 2400, 80);
    graphics.lineStyle(4, 0x1b5e20, 1.0);
    graphics.lineBetween(0, 520, 2400, 520);

    // Platforms
    graphics.fillStyle(0x8d6e63, 1.0);
    graphics.fillRect(300, 380, 400, 20);
    graphics.fillRect(1000, 380, 400, 20);
    graphics.fillRect(1700, 380, 400, 20);

    // 3. Setup Controls
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.attackKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // 4. Fixed UI Overlay
    this.myLevelText = this.add.text(15, 15, "LVL: 1", { fontSize: '22px', color: '#ffffff', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setScrollFactor(0);
    this.myExpText = this.add.text(15, 45, "EXP: 0 / 100", { fontSize: '18px', color: '#ffeb3b', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setScrollFactor(0);
    
    this.statusText = this.add.text(400, 300, "Connecting to Server...", { fontSize: '24px', color: '#ffffff', backgroundColor: '#000000aa', padding: { x: 15, y: 10 } }).setOrigin(0.5).setScrollFactor(0);
    
    this.add.text(15, 565, "🎮 Controls: [Left / Right Arrow] Move | [Space] Attack Monster", { fontSize: '15px', color: '#ffffff', backgroundColor: '#000000bb', padding: { x: 10, y: 5 } }).setScrollFactor(0);

    // 5. Connect Server
    this.connectServer();
  }

  async connectServer() {
    try {
      this.myUsername = (window as any).GAME_USERNAME || "Guest";
      this.room = await client.joinOrCreate("game", { username: this.myUsername });
      this.isConnected = true;
      this.statusText.destroy();
      console.log("Connected to room:", this.room.roomId);

      this.setupRoomEvents();
    } catch (e) {
      console.error("Connection Error:", e);
      this.statusText.setText("Connection Failed!\nMake sure server is running.");
      this.statusText.setColor("#ff5252");
    }
  }

  setupRoomEvents() {
    // Damage popup
    this.room.onMessage("damage", (data: { targetId: string; damage: number }) => {
      const target = this.monsters[data.targetId] || this.players[data.targetId];
      if (target) {
        const dmgText = this.add.text(target.x, target.y - 40, `-${data.damage}`, { fontSize: '22px', color: '#ff1744', fontStyle: 'bold', stroke: '#ffffff', strokeThickness: 2 });
        this.tweens.add({
          targets: dmgText,
          y: target.y - 80,
          alpha: 0,
          duration: 800,
          onComplete: () => dmgText.destroy()
        });
      }
    });

    // Level up popup
    this.room.onMessage("levelup", (data: { playerId: string; level: number }) => {
      if (data.playerId === this.room.sessionId) {
        this.myLevelText.setText(`LVL: ${data.level}`);
        const lvlText = this.add.text(400, 200, "⚡ LEVEL UP! ⚡", { fontSize: '36px', color: '#ffea00', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5).setScrollFactor(0);
        this.tweens.add({
          targets: lvlText,
          y: 150,
          alpha: 0,
          duration: 1500,
          onComplete: () => lvlText.destroy()
        });
      }
    });

    // Players Sync
    this.room.state.players.onAdd((player: any, sessionId: string) => {
      const sprite = this.add.sprite(player.x, player.y, "wrestler");
      sprite.setScale(0.25);
      this.players[sessionId] = sprite;

      const label = this.add.text(player.x, player.y - 50, `[Lv.${player.level}] ${player.name}`, { fontSize: '14px', color: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 2 }).setOrigin(0.5);
      this.uiTexts[sessionId] = label;

      // Camera Follow My Player
      if (sessionId === this.room.sessionId) {
        this.cameras.main.startFollow(sprite, true, 0.1, 0.1);
      }

      player.onChange(() => {
        sprite.x = player.x;
        sprite.y = player.y;

        if (this.uiTexts[sessionId]) {
          this.uiTexts[sessionId].x = player.x;
          this.uiTexts[sessionId].y = player.y - 50;
          this.uiTexts[sessionId].setText(`[Lv.${player.level}] ${player.name}`);
        }

        if (sessionId === this.room.sessionId) {
          this.myExpText.setText(`EXP: ${player.exp} / ${player.maxExp}`);
          this.myLevelText.setText(`LVL: ${player.level}`);
        }
      });
    });

    this.room.state.players.onRemove((player: any, sessionId: string) => {
      if (this.players[sessionId]) {
        this.players[sessionId].destroy();
        delete this.players[sessionId];
      }
      if (this.uiTexts[sessionId]) {
        this.uiTexts[sessionId].destroy();
        delete this.uiTexts[sessionId];
      }
    });

    // Monsters Sync
    this.room.state.monsters.onAdd((monster: any, id: string) => {
      const sprite = this.add.sprite(monster.x, monster.y, "monster");
      sprite.setScale(0.35);
      this.monsters[id] = sprite;

      const hpText = this.add.text(monster.x, monster.y - 45, `${monster.type} HP: ${monster.hp}/${monster.maxHp}`, { fontSize: '13px', color: '#ff8a80', fontStyle: 'bold', stroke: '#000000', strokeThickness: 2 }).setOrigin(0.5);
      this.uiTexts[id] = hpText;

      monster.onChange(() => {
        sprite.x = monster.x;
        sprite.y = monster.y;
        if (this.uiTexts[id]) {
          this.uiTexts[id].x = monster.x;
          this.uiTexts[id].y = monster.y - 45;
          this.uiTexts[id].setText(`${monster.type} HP: ${monster.hp}/${monster.maxHp}`);
        }
      });
    });

    this.room.state.monsters.onRemove((monster: any, id: string) => {
      if (this.monsters[id]) {
        this.monsters[id].destroy();
        delete this.monsters[id];
      }
      if (this.uiTexts[id]) {
        this.uiTexts[id].destroy();
        delete this.uiTexts[id];
      }
    });
  }

  update() {
    if (!this.isConnected || !this.room || !this.room.state) return;

    const mySprite = this.players[this.room.sessionId];
    if (!mySprite) return;

    let moved = false;
    let dx = 0;
    const speed = 5;

    if (this.cursors.left.isDown) {
      dx -= speed;
      mySprite.flipX = true;
      moved = true;
    }
    if (this.cursors.right.isDown) {
      dx += speed;
      mySprite.flipX = false;
      moved = true;
    }

    if (moved) {
      this.room.send("move", { x: mySprite.x + dx });
    }

    // Attack Key
    if (Phaser.Input.Keyboard.JustDown(this.attackKey)) {
      let targetId: string | null = null;
      let minDistance = 120;

      for (const id in this.monsters) {
        const mob = this.monsters[id];
        const dist = Phaser.Math.Distance.Between(mySprite.x, mySprite.y, mob.x, mob.y);
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

  if (loginBtn && usernameInput && loginScreen && gameContainer) {
    loginBtn.addEventListener("click", () => {
      const username = usernameInput.value.trim() || "Wrestler_" + Math.floor(Math.random() * 1000);
      (window as any).GAME_USERNAME = username;

      loginScreen.style.display = "none";
      gameContainer.style.display = "block";

      new Phaser.Game(config);
    });
  }
};
