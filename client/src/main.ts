import Phaser from "phaser";
import * as Colyseus from "colyseus.js";

const client = new Colyseus.Client("ws://localhost:2567");

class GameScene extends Phaser.Scene {
  private room!: Colyseus.Room;
  private myUsername!: string;
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
  private myQuestText!: Phaser.GameObjects.Text;
  private myLeaderboardText!: Phaser.GameObjects.Text;
  private questKey!: Phaser.Input.Keyboard.Key;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private fighterKey!: Phaser.Input.Keyboard.Key;
  private grapplerKey!: Phaser.Input.Keyboard.Key;
  private isChatting: boolean = false;
  private minimapGraphics!: Phaser.GameObjects.Graphics;
  private bgImage!: Phaser.GameObjects.Image;

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
    this.bgImage = this.add.image(400, 300, "background");
    this.bgImage.setDisplaySize(800, 600);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.attackKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.pickupKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.skillKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.buyKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.B);
    this.statVitKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
    this.questKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    this.enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.fighterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    this.grapplerKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.G);

    this.myLevelText = this.add.text(10, 10, "LVL: 1", { fontSize: '24px', color: '#fff' });
    this.myExpText = this.add.text(10, 40, "EXP: 0/100", { fontSize: '24px', color: '#fff' });
    this.myMpText = this.add.text(10, 70, "MP: 50/50", { fontSize: '24px', color: '#00ffff' });
    this.myGoldText = this.add.text(10, 100, "GOLD: 0", { fontSize: '24px', color: '#ffff00' });
    this.myStatsText = this.add.text(600, 10, "SP: 0\n1: STR 10\n2: AGI 10\n3: VIT 10", { fontSize: '20px', color: '#ffcc00', align: 'right' });
    this.myQuestText = this.add.text(600, 120, "No Quest", { fontSize: '20px', color: '#ff00ff', align: 'right' });
    this.myLeaderboardText = this.add.text(600, 200, "👑 TOP RANKERS 👑\n...", { fontSize: '20px', color: '#ffffff', align: 'right' });
    this.add.text(10, 550, "Z:Skill | Shift:Pick | B:Heal | Q:Quest | F:Fighter | G:Grappler", { fontSize: '18px', color: '#fff' });

    this.minimapGraphics = this.add.graphics();

    try {
      this.myUsername = (window as any).GAME_USERNAME || "Guest";
      this.room = await client.joinOrCreate("game", { username: this.myUsername });
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

      this.room.onMessage("kill_log", (message) => {
         const { killer, victim } = message;
         const logText = this.add.text(400, 200, `[${killer}] killed [${victim}]!`, { fontSize: '32px', color: '#ff0000', fontStyle: 'bold', backgroundColor: '#00000088' });
         logText.setOrigin(0.5);
         this.tweens.add({
             targets: logText,
             y: 100,
             alpha: 0,
             duration: 3000,
             onComplete: () => logText.destroy()
         });
      });

      this.room.onMessage("quest_complete", (message) => {
         const { targetId } = message;
         const playerSprite = this.players[targetId];
         if (playerSprite) {
             const effect = this.add.text(playerSprite.x, playerSprite.y - 80, "QUEST CLEAR!", { fontSize: '28px', color: '#ffff00', fontStyle: 'bold' });
             effect.setOrigin(0.5);
             this.tweens.add({
                targets: effect,
                y: playerSprite.y - 120,
                alpha: 0,
                duration: 2000,
                onComplete: () => effect.destroy()
             });
         }
      });

      this.room.onMessage("chat_message", (message) => {
         const { targetId, message: chatMsg } = message;
         const playerSprite = this.players[targetId];
         if (playerSprite) {
             const effect = this.add.text(playerSprite.x, playerSprite.y - 70, chatMsg, { fontSize: '18px', color: '#000000', backgroundColor: '#ffffcc', padding: { x: 5, y: 5 } });
             effect.setOrigin(0.5);
             this.tweens.add({
                targets: effect,
                y: playerSprite.y - 100,
                alpha: 0,
                duration: 3000,
                delay: 2000,
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

      this.room.state.onChange((changes: any) => {
         changes.forEach((change: any) => {
             if (change.field === "isNight") {
                 if (change.value) {
                     this.bgImage.setTint(0x333355);
                     const effect = this.add.text(400, 300, "NIGHT HAS FALLEN", { fontSize: '48px', color: '#ff0000', fontStyle: 'bold' });
                     effect.setOrigin(0.5);
                     this.tweens.add({ targets: effect, alpha: 0, duration: 3000, onComplete: () => effect.destroy() });
                 } else {
                     this.bgImage.clearTint();
                     const effect = this.add.text(400, 300, "DAY HAS BROKEN", { fontSize: '48px', color: '#ffff00', fontStyle: 'bold' });
                     effect.setOrigin(0.5);
                     this.tweens.add({ targets: effect, alpha: 0, duration: 3000, onComplete: () => effect.destroy() });
                 }
             }
         });
      });

      this.room.state.players.onAdd((player: any, sessionId: string) => {
        const sprite = this.add.sprite(player.x, player.y, "wrestler");
        sprite.setScale(0.25);
        this.players[sessionId] = sprite;

        const hpText = this.add.text(player.x, player.y - 40, `HP: ${player.hp}/${player.maxHp}`, { fontSize: '12px', color: '#0f0' });
        hpText.setOrigin(0.5);
        this.uiTexts[sessionId] = hpText;

        const nameStr = player.guildName !== "None" 
            ? `[${player.guildName}] [${player.jobClass}] ${player.name || "Wrestler"}`
            : `[${player.jobClass}] ${player.name || "Wrestler"}`;
        const nameText = this.add.text(player.x, player.y - 70, nameStr, { fontSize: '14px', color: '#fff', fontStyle: 'bold' });
        nameText.setOrigin(0.5);
        this.uiTexts[sessionId + "_name"] = nameText;

        let beltIcon: Phaser.GameObjects.Sprite | null = null;
        if (player.hasBelt) {
            beltIcon = this.add.sprite(player.x + 30, player.y - 30, "belt");
            beltIcon.setScale(0.2);
            this.uiTexts[sessionId + "_belt"] = beltIcon as any;
        }

        player.onChange(() => {
          sprite.x = player.x;
          sprite.y = player.y;
          
          if (player.invincibleUntil > Date.now()) {
              sprite.alpha = 0.5; // blinking effect could be added, just translucent for now
          } else {
              sprite.alpha = 1.0;
          }

          if (player.isMounted) {
              sprite.setTint(0x88ccff);
          } else {
              sprite.clearTint();
          }

          if (this.uiTexts[sessionId]) {
              this.uiTexts[sessionId].x = player.x;
              this.uiTexts[sessionId].y = player.y - 40;
              this.uiTexts[sessionId].setText(`HP: ${player.hp}/${player.maxHp}`);
          }
          if (this.uiTexts[sessionId + "_name"]) {
              this.uiTexts[sessionId + "_name"].x = player.x;
              this.uiTexts[sessionId + "_name"].y = player.y - 70;
              const updatedNameStr = player.guildName !== "None" 
                 ? `[${player.guildName}] [${player.jobClass}] ${player.name || "Wrestler"}`
                 : `[${player.jobClass}] ${player.name || "Wrestler"}`;
              this.uiTexts[sessionId + "_name"].setText(updatedNameStr);
          }
          
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
              
              if (player.questStatus === 0) {
                  this.myQuestText.setText("Quest: (Q at NPC)");
              } else if (player.questStatus === 1) {
                  this.myQuestText.setText(`Quest: Kill 5 Mobs (${player.questProgress}/5)`);
              } else if (player.questStatus === 2) {
                  this.myQuestText.setText("Quest: Completed!");
              }

              if (player.inventory) {
                 const gold = player.inventory.gold || 0;
                 this.myGoldText.setText(`GOLD: ${gold}`);
              }
          }
          this.updateLeaderboard();
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
        this.updateLeaderboard();
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
        this.add.text(npc.x - 40, npc.y - 60, `[${npc.name}]\n!`, { fontSize: '18px', color: '#00ff00', fontStyle: 'bold', align: 'center' });
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

  updateLeaderboard() {
      if (!this.room || !this.room.state) return;
      const playersList: any[] = [];
      this.room.state.players.forEach((p: any) => playersList.push(p));
      playersList.sort((a, b) => b.level === a.level ? b.exp - a.exp : b.level - a.level);
      
      let topText = "👑 TOP RANKERS 👑\n";
      for (let i = 0; i < Math.min(3, playersList.length); i++) {
          topText += `${i+1}. ${playersList[i].name} - Lv.${playersList[i].level}\n`;
      }
      this.myLeaderboardText.setText(topText);
  }

  drawMinimap() {
      this.minimapGraphics.clear();
      const mapWidth = 800;
      const mapHeight = 600;
      const miniWidth = 150;
      const miniHeight = 110;
      const startX = 800 - miniWidth - 10;
      const startY = 600 - miniHeight - 30; // Above keyboard hints

      // Draw minimap background
      this.minimapGraphics.fillStyle(0x000000, 0.5);
      this.minimapGraphics.fillRect(startX, startY, miniWidth, miniHeight);
      this.minimapGraphics.lineStyle(2, 0xffffff, 0.8);
      this.minimapGraphics.strokeRect(startX, startY, miniWidth, miniHeight);

      if (!this.room || !this.room.state) return;

      // Draw players
      this.room.state.players.forEach((p: any, id: string) => {
          if (p.hp > 0) {
              const mx = startX + (p.x / mapWidth) * miniWidth;
              const my = startY + (p.y / mapHeight) * miniHeight;
              this.minimapGraphics.fillStyle(id === this.room.sessionId ? 0xffffff : 0x0000ff, 1);
              this.minimapGraphics.fillCircle(mx, my, 3);
          }
      });

      // Draw monsters
      this.room.state.monsters.forEach((m: any) => {
          if (m.hp > 0) {
              const mx = startX + (m.x / mapWidth) * miniWidth;
              const my = startY + (m.y / mapHeight) * miniHeight;
              this.minimapGraphics.fillStyle(m.isBoss ? 0xff0000 : 0xffaa00, 1);
              this.minimapGraphics.fillCircle(mx, my, m.isBoss ? 5 : 2);
          }
      });
  }

  update() {
    this.drawMinimap();

    if (!this.room) return;

    if (Phaser.Input.Keyboard.JustDown(this.fighterKey)) {
        this.room.send("change_job", { job: "Fighter" });
    }
    if (Phaser.Input.Keyboard.JustDown(this.grapplerKey)) {
        this.room.send("change_job", { job: "Grappler" });
    }

    if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
        if (!this.isChatting) {
            this.isChatting = true;
            document.getElementById("chat-overlay")!.style.display = "block";
            const chatInput = document.getElementById("chatInput") as HTMLInputElement;
            chatInput.focus();
        } else {
            const chatInput = document.getElementById("chatInput") as HTMLInputElement;
            if (chatInput.value.trim() !== "") {
                this.room.send("chat", { message: chatInput.value });
                chatInput.value = "";
            }
            chatInput.blur();
            document.getElementById("chat-overlay")!.style.display = "none";
            this.isChatting = false;
        }
    }

    if (this.isChatting) return;

    let moved = false;
    let dx = 0;
    let dy = 0;

    let speed = 5;
    const myState = this.room.state.players.get(this.room.sessionId);
    if (myState && myState.isMounted) {
        speed = 10;
    }

    if (this.cursors.left.isDown) { dx -= speed; moved = true; }
    if (this.cursors.right.isDown) { dx += speed; moved = true; }
    if (this.cursors.up.isDown) { dy -= speed; moved = true; }
    if (this.cursors.down.isDown) { dy += speed; moved = true; }

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

    if (Phaser.Input.Keyboard.JustDown(this.questKey)) {
        // Only works if near NPC
        if (this.npcs["npc_shop"]) {
           const npc = this.npcs["npc_shop"];
           const myPlayer = this.players[this.room.sessionId];
           if (myPlayer) {
               const dist = Math.sqrt(Math.pow(myPlayer.x - npc.x, 2) + Math.pow(myPlayer.y - npc.y, 2));
               if (dist < 100) {
                   this.room.send("accept_quest");
               }
           }
        }
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
            const username = usernameInput.value.trim() || "Guest_" + Math.floor(Math.random() * 1000);
            (window as any).GAME_USERNAME = username;
            
            loginScreen.style.display = "none";
            gameContainer.style.display = "block";
            
            new Phaser.Game(config);
        });
    }
};
