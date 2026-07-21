import Phaser from "phaser";
import * as Colyseus from "colyseus.js";

const client = new Colyseus.Client("ws://localhost:2567");

class GameScene extends Phaser.Scene {
  private room!: Colyseus.Room;
  private players: { [id: string]: Phaser.GameObjects.Sprite } = {};
  private monsters: { [id: string]: Phaser.GameObjects.Sprite } = {};
  private npcs: { [id: string]: Phaser.GameObjects.Sprite } = {};
  private items: { [id: string]: Phaser.GameObjects.Sprite } = {};
  private uiTexts: { [id: string]: Phaser.GameObjects.Text } = {};
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private attackKey!: Phaser.Input.Keyboard.Key;
  private pickupKey!: Phaser.Input.Keyboard.Key;
  private skillKey!: Phaser.Input.Keyboard.Key;
  private buyKey!: Phaser.Input.Keyboard.Key;
  private statStrKey!: Phaser.Input.Keyboard.Key;
  private statAgiKey!: Phaser.Input.Keyboard.Key;
  private statVitKey!: Phaser.Input.Keyboard.Key;
  private myLevelText!: Phaser.GameObjects.Text;
  private myExpText!: Phaser.GameObjects.Text;
  private myMpText!: Phaser.GameObjects.Text;
  private myGoldText!: Phaser.GameObjects.Text;
  private myStatsText!: Phaser.GameObjects.Text;

  constructor() {
    super("GameScene");
  }

  preload() {
    this.load.image("background", "assets/background.png");
    this.load.image("wrestler", "assets/wrestler.png");
    this.load.image("monster", "assets/monster.png");
    this.load.image("boss", "assets/boss.png");
    this.load.image("gold", "assets/gold.png");
    this.load.image("belt", "assets/belt.png");
    this.load.image("skill", "assets/skill.png");
    this.load.image("npc", "assets/npc.png");
  }

  async create() {
    const bg = this.add.image(400, 300, "background");
    bg.setDisplaySize(800, 600);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.attackKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.pickupKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.skillKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.buyKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.B);
    this.statStrKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    this.statAgiKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
    this.statVitKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);

    this.myLevelText = this.add.text(10, 10, "LVL: 1", { fontSize: '24px', color: '#fff' });
    this.myExpText = this.add.text(10, 40, "EXP: 0/100", { fontSize: '24px', color: '#fff' });
    this.myMpText = this.add.text(10, 70, "MP: 50/50", { fontSize: '24px', color: '#00ffff' });
    this.myGoldText = this.add.text(10, 100, "GOLD: 0", { fontSize: '24px', color: '#ffff00' });
    this.myStatsText = this.add.text(600, 10, "SP: 0\n1: STR 10\n2: AGI 10\n3: VIT 10", { fontSize: '20px', color: '#ffcc00', align: 'right' });
    this.add.text(10, 550, "Z: Skill | Shift: Pickup | B: Buy Heal(50G)", { fontSize: '20px', color: '#fff' });

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

      this.room.onMessage("skill_effect", (message) => {
        const { x, y } = message;
        const effect = this.add.sprite(x, y, "skill");
        effect.setScale(0.5);
        this.tweens.add({
            targets: effect,
            scale: 1.5,
            alpha: 0,
            duration: 500,
            onComplete: () => effect.destroy()
        });
      });

      this.room.onMessage("heal_effect", (message) => {
         const { targetId } = message;
         const playerSprite = this.players[targetId];
         if (playerSprite) {
             const effect = this.add.text(playerSprite.x, playerSprite.y - 20, "+HEAL+", { fontSize: '24px', color: '#00ff00', fontStyle: 'bold' });
             this.tweens.add({
                targets: effect,
                y: playerSprite.y - 60,
                alpha: 0,
                duration: 1000,
                onComplete: () => effect.destroy()
             });
         }
      });

      this.room.onMessage("belt_effect", (message) => {
         const { targetId } = message;
         const playerSprite = this.players[targetId];
         if (playerSprite) {
             const effect = this.add.sprite(playerSprite.x, playerSprite.y - 60, "belt");
             this.tweens.add({
                targets: effect,
                y: playerSprite.y - 100,
                alpha: 0,
                duration: 2000,
                onComplete: () => effect.destroy()
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
        
        let beltIcon: Phaser.GameObjects.Sprite | null = null;
        if (player.hasBelt) {
            beltIcon = this.add.sprite(player.x + 30, player.y - 30, "belt");
            beltIcon.setScale(0.2);
            this.uiTexts[sessionId + "_belt"] = beltIcon as any;
        }

        player.onChange(() => {
          sprite.x = player.x;
          sprite.y = player.y;
          hpText.x = player.x;
          hpText.y = player.y - 40;
          hpText.setText(`HP: ${player.hp}/${player.maxHp}`);
          
          if (player.hasBelt && !beltIcon) {
              beltIcon = this.add.sprite(player.x + 30, player.y - 30, "belt");
              beltIcon.setScale(0.2);
              this.uiTexts[sessionId + "_belt"] = beltIcon as any;
          }
          if (beltIcon) {
              beltIcon.x = player.x + 30;
              beltIcon.y = player.y - 30;
          }

          if (sessionId === this.room.sessionId) {
              this.myExpText.setText(`EXP: ${player.exp}/${player.maxExp}`);
              this.myLevelText.setText(`LVL: ${player.level}`);
              this.myMpText.setText(`MP: ${Math.floor(player.mp)}/${player.maxMp}`);
              this.myStatsText.setText(`SP: ${player.sp}\n1: STR ${player.str}\n2: AGI ${player.agi}\n3: VIT ${player.vit}`);
              if (player.inventory) {
                 const gold = player.inventory.gold || 0;
                 this.myGoldText.setText(`GOLD: ${gold}`);
              }
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
        const spriteKey = monster.isBoss ? "boss" : "monster";
        const sprite = this.add.sprite(monster.x, monster.y, spriteKey);
        
        if (monster.isBoss) {
            sprite.setScale(0.8);
        } else {
            sprite.setScale(0.3);
        }

        this.monsters[id] = sprite;
        const color = monster.isBoss ? '#ff0000' : '#ffaaaa';
        const hpText = this.add.text(monster.x, monster.y - (monster.isBoss ? 80 : 40), `HP: ${monster.hp}/${monster.maxHp}`, { fontSize: '16px', color });
        hpText.setOrigin(0.5);
        this.uiTexts[id] = hpText;

        monster.onChange(() => {
          sprite.x = monster.x;
          sprite.y = monster.y;
          hpText.x = monster.x;
          hpText.y = monster.y - (monster.isBoss ? 80 : 40);
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

      this.room.state.items.onAdd((item: any, id: string) => {
        const sprite = this.add.sprite(item.x, item.y, item.type === "belt" ? "belt" : "gold");
        sprite.setScale(item.type === "belt" ? 0.5 : 0.2);
        this.items[id] = sprite;

        // Bounce effect
        this.tweens.add({
           targets: sprite,
           y: item.y - 15,
           yoyo: true,
           repeat: -1,
           duration: 500
        });
      });

      this.room.state.items.onRemove((item: any, id: string) => {
        if (this.items[id]) {
          this.items[id].destroy();
          delete this.items[id];
        }
      });

      this.room.state.npcs.onAdd((npc: any, id: string) => {
        const sprite = this.add.sprite(npc.x, npc.y, "npc");
        sprite.setScale(0.4);
        this.npcs[id] = sprite;
        this.add.text(npc.x - 40, npc.y - 60, `[${npc.name}]`, { fontSize: '18px', color: '#00ff00', fontStyle: 'bold' });
      });

      this.room.state.npcs.onRemove((npc: any, id: string) => {
        if (this.npcs[id]) {
          this.npcs[id].destroy();
          delete this.npcs[id];
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

    if (Phaser.Input.Keyboard.JustDown(this.pickupKey)) {
        this.room.send("pickup");
    }

    if (Phaser.Input.Keyboard.JustDown(this.buyKey)) {
        this.room.send("buy_heal");
    }

    if (Phaser.Input.Keyboard.JustDown(this.statStrKey)) {
        this.room.send("add_stat", { stat: "str" });
    }
    if (Phaser.Input.Keyboard.JustDown(this.statAgiKey)) {
        this.room.send("add_stat", { stat: "agi" });
    }
    if (Phaser.Input.Keyboard.JustDown(this.statVitKey)) {
        this.room.send("add_stat", { stat: "vit" });
    }

    if (Phaser.Input.Keyboard.JustDown(this.skillKey)) {
        this.room.send("skill_cast", { skill: "lariat" });
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
