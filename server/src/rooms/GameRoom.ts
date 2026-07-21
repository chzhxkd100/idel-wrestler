import { Room, Client } from "@colyseus/core";
import { GameState, Player, Monster, Item, Npc } from "./schema/GameState";
import { prisma } from "../db";

export class GameRoom extends Room<GameState> {
  maxClients = 100;
  private gameLoop: any;

  onCreate(options: any) {
    this.setState(new GameState());

    this.onMessage("move", (client, data) => {
      const player = this.state.players.get(client.sessionId);
      if (player && player.hp > 0) {
        player.x = data.x;
        player.y = data.y;
      }
    });

    this.onMessage("pickup", (client) => {
      const player = this.state.players.get(client.sessionId);
      if (!player || player.hp <= 0) return;

      let pickedUp = false;
      this.state.items.forEach((item, id) => {
        if (pickedUp) return; // one per click
        const dist = Math.sqrt(Math.pow(player.x - item.x, 2) + Math.pow(player.y - item.y, 2));
        if (dist < 50) { // pickup range
          const currentAmount = player.inventory.get(item.type) || 0;
          player.inventory.set(item.type, currentAmount + item.amount);
          this.state.items.delete(id);
          pickedUp = true;
          console.log(`${player.name} picked up ${item.amount} ${item.type}`);
        }
      });
    });

    this.onMessage("buy_heal", (client) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;

      const healCost = 50;
      const currentGold = player.inventory.get("gold") || 0;

      if (currentGold >= healCost) {
         player.inventory.set("gold", currentGold - healCost);
         player.hp = player.maxHp;
         player.mp = player.maxMp;
         console.log(`${player.name} bought a heal!`);
         this.broadcast("heal_effect", { targetId: player.id });
      }
    });

    this.onMessage("skill_cast", (client, data) => {
      const player = this.state.players.get(client.sessionId);
      if (!player || player.hp <= 0) return;
      
      const skillName = data.skill || "lariat";
      const mpCost = 20;

      if (player.mp >= mpCost) {
        player.mp -= mpCost;
        
        // Broadcast skill effect to all clients
        this.broadcast("skill_effect", { skill: skillName, x: player.x, y: player.y, playerId: player.id });

        // AOE Damage
        const damage = 30;
        this.state.monsters.forEach((monster, id) => {
          const dist = Math.sqrt(Math.pow(player.x - monster.x, 2) + Math.pow(player.y - monster.y, 2));
          if (dist < 100) { // AOE radius
             monster.hp -= damage;
             this.broadcast("damage", { targetId: id, damage });

             if (monster.hp <= 0) {
                monster.hp = 0;
                player.exp += 20;
                if (player.exp >= player.maxExp) {
                   player.level++;
                   player.exp = 0;
                   player.maxExp = Math.floor(player.maxExp * 1.5);
                   player.maxHp += 20;
                   player.hp = player.maxHp;
                   player.maxMp += 10;
                   player.mp = player.maxMp;
                   this.broadcast("levelup", { playerId: player.id, level: player.level });
                }
                
                // Drop Item
                if (Math.random() < 0.5) { // 50% drop rate
                  const dropAmount = Math.floor(Math.random() * 50) + 10;
                  const item = new Item(`item_${Date.now()}_${id}`, "gold", dropAmount, monster.x, monster.y);
                  this.state.items.set(item.id, item);
                }

                this.state.monsters.delete(id);
             }
          }
        });
      }
    });

    this.onMessage("attack", (client, data) => {
      const attacker = this.state.players.get(client.sessionId);
      const target = this.state.players.get(data.targetId);
      
      if (attacker && target && target.hp > 0) {
        const damage = Math.floor(Math.random() * 10) + 5; // 5-14 damage
        target.hp -= damage;
        
        // Broadcast damage text
        this.broadcast("damage", { targetId: data.targetId, damage });

        if (target.hp <= 0) {
          target.hp = 0;
          console.log(`${target.name} was defeated by ${attacker.name}!`);
          
            if (data.isMonster) {
            attacker.exp += 20; // Hardcoded exp reward
            if (attacker.exp >= attacker.maxExp) {
               attacker.level++;
               attacker.exp = 0;
               attacker.maxExp = Math.floor(attacker.maxExp * 1.5);
               attacker.maxHp += 20;
               attacker.hp = attacker.maxHp;
               attacker.maxMp += 10;
               attacker.mp = attacker.maxMp;
               this.broadcast("levelup", { playerId: attacker.id, level: attacker.level });
            }

            // Drop Item
            let isTargetBoss = false;
            if (target instanceof Monster) {
               isTargetBoss = target.isBoss;
            }

            if (isTargetBoss || Math.random() < 0.5) { // Boss drops guaranteed, 50% for normal
              const dropAmount = isTargetBoss ? Math.floor(Math.random() * 200) + 100 : Math.floor(Math.random() * 50) + 10;
              const item = new Item(`item_${Date.now()}_${data.targetId}`, "gold", dropAmount, target.x, target.y);
              this.state.items.set(item.id, item);
            }

            this.state.monsters.delete(data.targetId);
          }
        }
      }
    });

    // Spawn NPC
    const shopNpc = new Npc("npc_shop", "Manager", 400, 300);
    this.state.npcs.set(shopNpc.id, shopNpc);

    // Spawn initial monsters
    for (let i = 0; i < 5; i++) {
      const m = new Monster(`monster_${i}`);
      this.state.monsters.set(m.id, m);
    }

    // Spawn initial boss (rarely)
    if (Math.random() < 0.5) {
       const boss = new Monster(`boss_${Date.now()}`, true);
       this.state.monsters.set(boss.id, boss);
    }

    // Set up game loop (server tick)
    this.setSimulationInterval((deltaTime) => this.update(deltaTime));
  }

  update(deltaTime: number) {
    // Regenerate MP
    this.state.players.forEach(player => {
       if (player.hp > 0 && player.mp < player.maxMp) {
           player.mp = Math.min(player.maxMp, player.mp + 0.1);
       }
    });

    // Respawn Monsters and Bosses
    let normalCount = 0;
    let bossCount = 0;
    this.state.monsters.forEach(m => {
        if (m.isBoss) bossCount++;
        else normalCount++;
    });

    if (normalCount < 5) {
       if (Math.random() < 0.05) { 
          const newId = `monster_${Date.now()}`;
          const m = new Monster(newId);
          this.state.monsters.set(newId, m);
       }
    }
    
    if (bossCount < 1) {
       if (Math.random() < 0.005) { // Very rare spawn rate for boss
          const newId = `boss_${Date.now()}`;
          const m = new Monster(newId, true);
          this.state.monsters.set(newId, m);
       }
    }

    // Monster AI Loop
    this.state.monsters.forEach((monster) => {
      // Find nearest player
      let nearestPlayer: any = null;
      let minDistance = 300; // Aggro range

      this.state.players.forEach((player) => {
        if (player.hp > 0) {
          const dist = Math.sqrt(Math.pow(player.x - monster.x, 2) + Math.pow(player.y - monster.y, 2));
          if (dist < minDistance) {
            minDistance = dist;
            nearestPlayer = player;
          }
        }
      });

      if (nearestPlayer) {
        // Move towards player
        const dx = nearestPlayer.x - monster.x;
        const dy = nearestPlayer.y - monster.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 30) { // Attack range
           monster.x += (dx / dist) * monster.speed;
           monster.y += (dy / dist) * monster.speed;
        } else {
           // Attack player (simple cooldown mechanism could be added)
           if (Math.random() < 0.05) { // 5% chance per tick to hit
             nearestPlayer.hp -= monster.damage;
             this.broadcast("damage", { targetId: nearestPlayer.id, damage: monster.damage });
             if (nearestPlayer.hp <= 0) {
               nearestPlayer.hp = 0;
             }
           }
        }
      } else {
         // Wander
         if (Math.random() < 0.02) {
           monster.x += (Math.random() - 0.5) * 50;
           monster.y += (Math.random() - 0.5) * 50;
         }
      }
    });
  }

  async onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined!");
    const { userId } = options;
    
    let playerName = "Guest";
    if (userId) {
      try {
        const dbPlayer = await prisma.player.findUnique({ where: { userId } });
        if (dbPlayer) {
          playerName = dbPlayer.name;
        }
      } catch (e) {
        console.error("DB load error:", e);
      }
    }

    const player = new Player(client.sessionId, playerName);
    this.state.players.set(client.sessionId, player);
  }

  onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
    this.state.players.delete(client.sessionId);
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }
}
