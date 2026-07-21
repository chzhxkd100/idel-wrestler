import Phaser from "phaser";
import * as Colyseus from "colyseus.js";

const client = new Colyseus.Client("ws://localhost:2567");

class GameScene extends Phaser.Scene {
  private room!: Colyseus.Room;
  private players: { [id: string]: Phaser.GameObjects.Sprite } = {};
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private attackKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super("GameScene");
  }

  preload() {
    this.load.image("background", "assets/background.png");
    this.load.image("wrestler", "assets/wrestler.png");
  }

  async create() {
    // Add background
    const bg = this.add.image(400, 300, "background");
    bg.setDisplaySize(800, 600);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.attackKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    try {
      this.room = await client.joinOrCreate("game");
      console.log("Joined room:", this.room.id);

      // Listen for players joining
      this.room.state.players.onAdd((player: any, sessionId: string) => {
        console.log("Player joined:", sessionId);
        const sprite = this.add.sprite(player.x, player.y, "wrestler");
        // Scale down the AI generated image if it's too big
        sprite.setScale(0.25);
        this.players[sessionId] = sprite;

        // Listen for player updates
        player.onChange(() => {
          sprite.x = player.x;
          sprite.y = player.y;
        });
      });

      // Listen for players leaving
      this.room.state.players.onRemove((player: any, sessionId: string) => {
        console.log("Player left:", sessionId);
        if (this.players[sessionId]) {
          this.players[sessionId].destroy();
          delete this.players[sessionId];
        }
      });

    } catch (e) {
      console.error("Join error:", e);
    }
  }

  update() {
    if (!this.room) return;

    let moved = false;
    let dx = 0;
    let dy = 0;

    if (this.cursors.left.isDown) {
      dx -= 5;
      moved = true;
    }
    if (this.cursors.right.isDown) {
      dx += 5;
      moved = true;
    }
    if (this.cursors.up.isDown) {
      dy -= 5;
      moved = true;
    }
    if (this.cursors.down.isDown) {
      dy += 5;
      moved = true;
    }

    if (moved) {
      const mySprite = this.players[this.room.sessionId];
      if (mySprite) {
        this.room.send("move", {
          x: mySprite.x + dx,
          y: mySprite.y + dy
        });
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.attackKey)) {
      // Find nearest target to attack (dummy logic)
      let targetId = null;
      let minDistance = 100;

      const mySprite = this.players[this.room.sessionId];
      if (mySprite) {
        for (const id in this.players) {
          if (id !== this.room.sessionId) {
            const enemy = this.players[id];
            const dist = Phaser.Math.Distance.Between(mySprite.x, mySprite.y, enemy.x, enemy.y);
            if (dist < minDistance) {
              minDistance = dist;
              targetId = id;
            }
          }
        }
      }

      if (targetId) {
        console.log("Attacking target:", targetId);
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
  parent: "app",
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  }
};

new Phaser.Game(config);
