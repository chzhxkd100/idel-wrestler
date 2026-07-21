import Phaser from "phaser";
import * as Colyseus from "colyseus.js";

const client = new Colyseus.Client("ws://localhost:2567");

class GameScene extends Phaser.Scene {
  private room!: Colyseus.Room;
  private players: { [id: string]: Phaser.GameObjects.Sprite } = {};
  private monsters: { [id: string]: Phaser.GameObjects.Sprite } = {};
  private uiTexts: { [id: string]: Phaser.GameObjects.Text } = {};
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private attackKey!: Phaser.Input.Keyboard.Key;
  private myLevelText!: Phaser.GameObjects.Text;
  private myExpText!: Phaser.GameObjects.Text;

  constructor() {
    super("GameScene");
  }

  preload() {
    this.load.image("background", "assets/background.png");
    this.load.image("wrestler", "assets/wrestler.png");
    this.load.image("monster", "assets/monster.png");
  }

  async create() {
    const bg = this.add.image(400, 300, "background");
    bg.setDisplaySize(800, 600);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.attackKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.myLevelText = this.add.text(10, 10, "LVL: 1", { fontSize: '24px', color: '#fff' });
    this.myExpText = this.add.text(10, 40, "EXP: 0/100", { fontSize: '24px', color: '#fff' });

    try {
      this.room = await client.joinOrCreate("game");
      console.log("Joined room:", this.room.roomId);

      this.room.onMessage("damage", (message) => {
        const { targetId, damage } = message;
        let target = this.players[targetId] || this.monsters[targetId];
        if (target) {
          const dmgText = this.add.text(target.x, target.y - 50, `-${damage}`, { fontSize: '20px', color: '#ff0000', fontStyle: 'bold' });
          this.tweens.add({
            targets: dmgText,
            y: target.y - 100,
            alpha: 0,
            duration: 1000,
            onComplete: () => dmgText.destroy()
          });
        }
      });

      this.room.onMessage("levelup", (message) => {
        const { playerId, level } = message;
        if (playerId === this.room.sessionId) {
            this.myLevelText.setText(`LVL: ${level}`);
            const lvlUpText = this.add.text(400, 300, "LEVEL UP!", { fontSize: '48px', color: '#ffff00', fontStyle: 'bold' });
            lvlUpText.setOrigin(0.5);
            this.tweens.add({
                targets: lvlUpText,
                y: 200,
                alpha: 0,
                duration: 2000,
                onComplete: () => lvlUpText.destroy()
            });
        }
      });

      this.room.state.players.onAdd((player: any, sessionId: string) => {
        const sprite = this.add.sprite(player.x, player.y, "wrestler");
        sprite.setScale(0.25);
        this.players[sessionId] = sprite;

        const hpText = this.add.text(player.x, player.y - 40, `HP: ${player.hp}/${player.maxHp}`, { fontSize: '12px', color: '#0f0' });
        hpText.setOrigin(0.5);
        this.uiTexts[sessionId] = hpText;

        player.onChange(() => {
          sprite.x = player.x;
          sprite.y = player.y;
          hpText.x = player.x;
          hpText.y = player.y - 40;
          hpText.setText(`HP: ${player.hp}/${player.maxHp}`);
          if (sessionId === this.room.sessionId) {
              this.myExpText.setText(`EXP: ${player.exp}/${player.maxExp}`);
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

      this.room.state.monsters.onAdd((monster: any, id: string) => {
        const sprite = this.add.sprite(monster.x, monster.y, "monster");
        sprite.setScale(0.25);
        this.monsters[id] = sprite;
        
        const hpText = this.add.text(monster.x, monster.y - 40, `HP: ${monster.hp}/${monster.maxHp}`, { fontSize: '12px', color: '#f00' });
        hpText.setOrigin(0.5);
        this.uiTexts[id] = hpText;

        monster.onChange(() => {
          sprite.x = monster.x;
          sprite.y = monster.y;
          hpText.x = monster.x;
          hpText.y = monster.y - 40;
          hpText.setText(`HP: ${monster.hp}/${monster.maxHp}`);
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

    } catch (e) {
      console.error("Join error:", e);
    }
  }

  update() {
    if (!this.room) return;

    let moved = false;
    let dx = 0;
    let dy = 0;

    if (this.cursors.left.isDown) { dx -= 5; moved = true; }
    if (this.cursors.right.isDown) { dx += 5; moved = true; }
    if (this.cursors.up.isDown) { dy -= 5; moved = true; }
    if (this.cursors.down.isDown) { dy += 5; moved = true; }

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
      let targetId = null;
      let minDistance = 100;
      let isMonster = false;

      const mySprite = this.players[this.room.sessionId];
      if (mySprite) {
        // Check monsters first
        for (const id in this.monsters) {
            const enemy = this.monsters[id];
            const dist = Phaser.Math.Distance.Between(mySprite.x, mySprite.y, enemy.x, enemy.y);
            if (dist < minDistance) {
              minDistance = dist;
              targetId = id;
              isMonster = true;
            }
        }
        
        // Check players if no monster found
        if (!targetId) {
            for (const id in this.players) {
              if (id !== this.room.sessionId) {
                const enemy = this.players[id];
                const dist = Phaser.Math.Distance.Between(mySprite.x, mySprite.y, enemy.x, enemy.y);
                if (dist < minDistance) {
                  minDistance = dist;
                  targetId = id;
                  isMonster = false;
                }
              }
            }
        }
      }

      if (targetId) {
        console.log("Attacking target:", targetId);
        this.room.send("attack", { targetId, isMonster });
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
    arcade: { gravity: { x: 0, y: 0 }, debug: false }
  }
};

new Phaser.Game(config);
