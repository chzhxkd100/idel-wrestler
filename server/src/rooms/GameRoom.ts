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

    this.onMessage("add_stat", (client, data) => {
      const player = this.state.players.get(client.sessionId);
      if (!player || player.hp <= 0 || player.sp <= 0) return;
      
      const { stat } = data;
      if (stat === "str") player.str += 1;
      else if (stat === "agi") player.agi += 1;
      else if (stat === "vit") {
          player.vit += 1;
          player.maxHp += 10;
          player.hp += 10;
      } else return;
      
      player.sp -= 1;
      console.log(`${player.name} added +1 to ${stat}`);
    });

    this.onMessage("pickup", (client) => {
      const player = this.state.players.get(client.sessionId);
      if (!player || player.hp <= 0) return;

      let pickedUp = false;
      this.state.items.forEach((item, id) => {
        if (pickedUp) return; // one per click
        const dist = Math.sqrt(Math.pow(player.x - item.x, 2) + Math.pow(player.y - item.y, 2));
        if (dist < 50) { // pickup range
          if (item.type === "gold") {
              const currentAmount = player.inventory.get(item.type) || 0;
              player.inventory.set(item.type, currentAmount + item.amount);
              console.log(`${player.name} picked up ${item.amount} ${item.type}`);
          } else if (item.type === "belt" && !player.hasBelt) {
              player.hasBelt = true;
              console.log(`${player.name} obtained the Championship Belt!`);
              this.broadcast("belt_effect", { targetId: player.id });
          }
          this.state.items.delete(id);
          pickedUp = true;
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

    this.onMessage("accept_quest", (client) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;

      if (player.questStatus === 0) {
          player.questStatus = 1;
          player.questProgress = 0;
          console.log(`${player.name} accepted the quest!`);
      } else if (player.questStatus === 1 && player.questProgress >= 5) {
          player.questStatus = 2;
          const currentGold = player.inventory.get("gold") || 0;
          player.inventory.set("gold", currentGold + 500);
          player.exp += 500;
          console.log(`${player.name} completed the quest!`);
          this.broadcast("quest_complete", { targetId: player.id });
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
        const damage = (player.str * 3) + (player.hasBelt ? 50 : 0);
        this.state.monsters.forEach((monster, id) => {
          const dist = Math.sqrt(Math.pow(player.x - monster.x, 2) + Math.pow(player.y - monster.y, 2));
          if (dist < 100) { // AOE radius
             monster.hp -= damage;
             this.broadcast("damage", { targetId: id, damage });

             if (monster.hp <= 0) {
                monster.hp = 0;
                player.exp += monster.expReward;
                
                // Quest progress
                if (player.questStatus === 1 && !monster.isBoss) {
                    player.questProgress++;
                }

                if (player.exp >= player.maxExp) {
                   player.level++;
                   player.exp = 0;
                   player.maxExp = Math.floor(player.maxExp * 1.5);
                   player.maxHp += 20;
                   player.hp = player.maxHp;
                   player.maxMp += 10;
                   player.mp = player.maxMp;
                   player.sp += 5; // Give SP
                   this.broadcast("levelup", { playerId: player.id, level: player.level });
                }
                
                // Drop Item
                if (monster.isBoss && Math.random() < 0.2) {
                   const belt = new Item(`item_belt_${Date.now()}_${id}`, "belt", 1, monster.x, monster.y);
                   this.state.items.set(belt.id, belt);
                } else if (monster.isBoss || Math.random() < 0.5) { 
                  const dropAmount = monster.isBoss ? Math.floor(Math.random() * 200) + 100 : Math.floor(Math.random() * 50) + 10;
                  const item = new Item(`item_${Date.now()}_${id}`, "gold", dropAmount, monster.x, monster.y);
                  this.state.items.set(item.id, item);
                }

                this.state.monsters.delete(id);
             }
          }
        });

        // PvP AOE Damage
        this.state.players.forEach((otherPlayer, id) => {
           if (id !== player.id && otherPlayer.hp > 0) {
               const dist = Math.sqrt(Math.pow(player.x - otherPlayer.x, 2) + Math.pow(player.y - otherPlayer.y, 2));
               if (dist < 100) {
                  otherPlayer.hp -= damage;
                  this.broadcast("damage", { targetId: id, damage });
                  
                  if (otherPlayer.hp <= 0) {
                      otherPlayer.hp = 0;
                      this.broadcast("kill_log", { killer: player.name, victim: otherPlayer.name });
                      
                      // Drop some gold
                      const droppedGold = Math.floor((otherPlayer.inventory.get("gold") || 0) * 0.2);
                      if (droppedGold > 0) {
                          otherPlayer.inventory.set("gold", (otherPlayer.inventory.get("gold") || 0) - droppedGold);
                          const item = new Item(`item_pvp_${Date.now()}_${otherPlayer.id}`, "gold", droppedGold, otherPlayer.x, otherPlayer.y);
                          this.state.items.set(item.id, item);
                      }

                      // Respawn
                      otherPlayer.hp = otherPlayer.maxHp;
                      otherPlayer.mp = otherPlayer.maxMp;
                      otherPlayer.x = 400; // Respawn near NPC
                      otherPlayer.y = 300;
                  }
               }
           }
        });
      }
    });

    this.onMessage("attack", (client, data) => {
      const attacker = this.state.players.get(client.sessionId);
      const target = this.state.players.get(data.targetId) || this.state.monsters.get(data.targetId);
      
      if (attacker && target) {
          const damage = data.isMonster ? attacker.str + (attacker.hasBelt ? 20 : 0) : ((target as any).damage || 10);
          target.hp -= damage;
          
          this.broadcast("damage", { targetId: data.targetId, damage });

          if (target.hp <= 0) {
          target.hp = 0;
          console.log(`${(target as any).name || (target as any).type} was defeated by ${attacker.name}!`);
          
            if (data.isMonster) {
            attacker.exp += (target as Monster).expReward; 
            
            // Quest progress
            if (attacker.questStatus === 1 && !(target as Monster).isBoss) {
                attacker.questProgress++;
            }

            if (attacker.exp >= attacker.maxExp) {
               attacker.level++;
               attacker.exp = 0;
               attacker.maxExp = Math.floor(attacker.maxExp * 1.5);
               attacker.maxHp += 20;
               attacker.hp = attacker.maxHp;
               attacker.maxMp += 10;
               attacker.mp = attacker.maxMp;
               attacker.sp += 5;
               this.broadcast("levelup", { playerId: attacker.id, level: attacker.level });
            }

            // Drop Item
            let isTargetBoss = false;
            if (target instanceof Monster) {
               isTargetBoss = target.isBoss;
            }

            if (isTargetBoss && Math.random() < 0.2) {
               const belt = new Item(`item_belt_${Date.now()}_${data.targetId}`, "belt", 1, target.x, target.y);
               this.state.items.set(belt.id, belt);
            } else if (isTargetBoss || Math.random() < 0.5) { 
              const dropAmount = isTargetBoss ? Math.floor(Math.random() * 200) + 100 : Math.floor(Math.random() * 50) + 10;
              const item = new Item(`item_${Date.now()}_${data.targetId}`, "gold", dropAmount, target.x, target.y);
              this.state.items.set(item.id, item);
            }

            this.state.monsters.delete(data.targetId);
          } else {
             // PvP Death
             const deadPlayer = target as Player;
             this.broadcast("kill_log", { killer: attacker.name, victim: deadPlayer.name });
             
             // Drop some gold
             const droppedGold = Math.floor((deadPlayer.inventory.get("gold") || 0) * 0.2); // Drop 20%
             if (droppedGold > 0) {
                 deadPlayer.inventory.set("gold", (deadPlayer.inventory.get("gold") || 0) - droppedGold);
                 const item = new Item(`item_pvp_${Date.now()}_${deadPlayer.id}`, "gold", droppedGold, deadPlayer.x, deadPlayer.y);
                 this.state.items.set(item.id, item);
             }

             // Respawn
             deadPlayer.hp = deadPlayer.maxHp;
             deadPlayer.mp = deadPlayer.maxMp;
             deadPlayer.x = 400; // Respawn near NPC
             deadPlayer.y = 300;
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
