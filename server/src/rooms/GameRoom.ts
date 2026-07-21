import { Room, Client } from "@colyseus/core";
import { GameState, Player, Monster, Item, Npc } from "./schema/GameState";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class GameRoom extends Room<GameState> {
  maxClients = 100;
  private gameLoop: any;
  private dayNightTimer: number = 0;
  private hotTimeTimer: number = 0;
  private weatherTimer: number = 0;

  onCreate(options: any) {
    this.setState(new GameState());

    this.onMessage("move", (client, data) => {
      const player = this.state.players.get(client.sessionId);
      if (player && player.hp > 0) {
        player.x = data.x;
        player.y = data.y;
        player.lastMoveTime = Date.now();
        if (player.isAFK) player.isAFK = false;
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
          } else if (item.type === "weapon" && !player.hasWeapon) {
              player.hasWeapon = true;
              console.log(`${player.name} obtained the Legendary Weapon!`);
              this.broadcast("chat_message", { targetId: "SYSTEM", message: `${player.name} obtained the Legendary Weapon!` });
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

    this.onMessage("chat", async (client, data) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      
      const msg: string = data.message;
      if (msg.startsWith("/guild ")) {
          const parts = msg.split(" ");
          if (parts.length >= 2) {
             const guildName = parts.slice(1).join(" ");
             player.guildName = guildName;
             this.broadcast("chat_message", { targetId: player.id, message: `Joined guild [${guildName}]!` });
             return;
          }
      }
      if (msg.trim() === "/mount") {
          player.isMounted = !player.isMounted;
          const status = player.isMounted ? "mounted" : "dismounted";
          this.broadcast("chat_message", { targetId: player.id, message: `[System] You have ${status}!` });
          return;
      }
      if (msg.trim() === "/rebirth") {
          if (player.level >= 50) {
              player.rebirthCount += 1;
              player.level = 1;
              player.exp = 0;
              player.maxExp = 100;
              player.sp = 0;
              const bonus = player.rebirthCount * 10;
              player.str = 10 + bonus;
              player.agi = 10 + bonus;
              player.vit = 10 + bonus;
              player.maxHp = 100 + (player.vit * 10);
              player.maxMp = 50 + (player.str * 5);
              player.hp = player.maxHp;
              player.mp = player.maxMp;
              
              this.broadcast("chat_message", { targetId: "SYSTEM", message: `[REBIRTH] ${player.name} has transcended! (Rebirth Count: ${player.rebirthCount})` });
          } else {
              this.broadcast("chat_message", { targetId: player.id, message: `[System] You must be Level 50 to rebirth.` });
          }
          return;
      }
      if (msg.trim() === "/pet") {
          player.hasPet = !player.hasPet;
          const status = player.hasPet ? "summoned" : "unsummoned";
          this.broadcast("chat_message", { targetId: player.id, message: `[System] You have ${status} your pet!` });
          return;
      }

      this.broadcast("chat_message", { targetId: player.id, message: msg });
      console.log(`[Chat] ${player.name}: ${msg}`);
    });

    this.onMessage("change_job", (client, data) => {
      const player = this.state.players.get(client.sessionId);
      if (!player || player.level < 10 || player.jobClass !== "Novice") return;
      
      if (data.job === "Fighter" || data.job === "Grappler") {
          player.jobClass = data.job;
          console.log(`${player.name} advanced to ${player.jobClass}!`);
          this.broadcast("quest_complete", { targetId: player.id }); // Reuse effect
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
        const isCrit = Math.random() < 0.1;
        const baseDamage = (player.str * 3) + (player.hasBelt ? 50 : 0) + (player.hasWeapon ? 100 : 0);
        const damage = isCrit ? baseDamage * 2 : baseDamage;

        this.state.monsters.forEach((monster, id) => {
          const dist = Math.sqrt(Math.pow(player.x - monster.x, 2) + Math.pow(player.y - monster.y, 2));
          if (dist < 100) { // AOE radius
             monster.hp -= damage;
             this.broadcast("damage", { targetId: id, damage, isCrit });

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
                   
                   // Job Bonus
                   if (player.jobClass === "Fighter") {
                       player.str += 2; // Fighter gets extra STR
                   } else if (player.jobClass === "Grappler") {
                       player.vit += 2; // Grappler gets extra VIT
                       player.maxHp += 20;
                       player.hp += 20;
                   }

                   this.broadcast("levelup", { playerId: player.id, level: player.level });
                }
                
                // Drop Item
                if (monster.isWorldBoss) {
                   const weapon = new Item(`item_weapon_${Date.now()}_${id}`, "weapon", 1, monster.x, monster.y);
                   this.state.items.set(weapon.id, weapon);
                   this.broadcast("chat_message", { targetId: "SYSTEM", message: "WORLD BOSS DEFEATED!" });
                } else if (monster.isBoss && Math.random() < 0.2) {
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
               // Friendly Fire check
               if (player.guildName !== "None" && player.guildName === otherPlayer.guildName) return;
               
               const dist = Math.sqrt(Math.pow(player.x - otherPlayer.x, 2) + Math.pow(player.y - otherPlayer.y, 2));
               if (dist < 100) {
                  // Invincibility check
                  if (otherPlayer.invincibleUntil > Date.now()) {
                      this.broadcast("chat_message", { targetId: id, message: "IMMUNE" });
                      return;
                  }

                  otherPlayer.hp -= damage;
                  this.broadcast("damage", { targetId: id, damage, isCrit });
                  
                  if (otherPlayer.hp <= 0) {
                      otherPlayer.hp = 0;
                      this.broadcast("kill_log", { killer: player.name, victim: otherPlayer.name });
                      
                      // EXP Penalty
                      const expLoss = Math.floor(otherPlayer.exp * 0.1);
                      otherPlayer.exp = Math.max(0, otherPlayer.exp - expLoss);
                      this.broadcast("chat_message", { targetId: otherPlayer.id, message: `[System] You lost ${expLoss} EXP (10%) due to death.` });

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
                      otherPlayer.invincibleUntil = Date.now() + 3000;
                  }
               }
           }
        });
      }
    });

      this.onMessage("buy_shop_item", (client, data) => {
          const player = this.state.players.get(client.sessionId);
          if (!player) return;

          const gold = player.inventory.get("gold") || 0;
          if (data.item === "heal") {
              if (gold >= 50) {
                  player.inventory.set("gold", gold - 50);
                  player.hp = player.maxHp;
                  player.mp = player.maxMp;
                  this.broadcast("chat_message", { targetId: player.id, message: "[System] Fully Healed!" });
              } else {
                  this.broadcast("chat_message", { targetId: player.id, message: "[System] Not enough gold (50 required)." });
              }
          } else if (data.item === "reset") {
              if (gold >= 500) {
                  player.inventory.set("gold", gold - 500);
                  const totalSpent = (player.str - 10) + (player.agi - 10) + (player.vit - 10);
                  player.sp += totalSpent;
                  player.str = 10;
                  player.agi = 10;
                  player.vit = 10;
                  player.maxHp = 100 + (player.vit * 10);
                  player.hp = player.maxHp;
                  this.broadcast("chat_message", { targetId: player.id, message: "[System] Stats Reset! SP refunded." });
              } else {
                  this.broadcast("chat_message", { targetId: player.id, message: "[System] Not enough gold (500 required)." });
              }
          }
      });

      this.onMessage("attack", (client, data) => {
      const attacker = this.state.players.get(client.sessionId);
      const target = this.state.players.get(data.targetId) || this.state.monsters.get(data.targetId);
      
      if (attacker && target && attacker.hp > 0 && target.hp > 0) {
          if (attacker.x >= 350 && attacker.x <= 450) {
              this.broadcast("chat_message", { targetId: attacker.id, message: "[System] You cannot attack in the Safe Zone." });
              return;
          }
          if ((target as any).x >= 350 && (target as any).x <= 450 && !(target as any).isBoss) {
              this.broadcast("chat_message", { targetId: attacker.id, message: "[System] Target is in the Safe Zone." });
              return;
          }

          if (data.targetId === attacker.id) return;
          let isCrit = Math.random() < 0.1;
          const baseDamage = data.isMonster ? attacker.str + (attacker.hasBelt ? 20 : 0) + (attacker.hasWeapon ? 100 : 0) : ((target as any).damage || 10);
          let damage = isCrit ? baseDamage * 2 : baseDamage;
          let isMiss = false;

          // Dodge calculation for Player target
          if (!data.isMonster) {
              const targetPlayer = target as Player;
              const dodgeChance = Math.min(50, targetPlayer.agi * 0.5) / 100;
              if (Math.random() < dodgeChance) {
                  damage = 0;
                  isMiss = true;
                  isCrit = false;
              }
          }
          
          if (data.isMonster) {
              target.hp -= damage;
              this.broadcast("damage", { targetId: data.targetId, damage, isCrit, isMiss, jobClass: attacker.jobClass });

              if (target.hp <= 0) {
                  target.hp = 0;
                  console.log(`${(target as any).type || "Monster"} was defeated by ${attacker.name}!`);
                  
                  const expMultiplier = this.state.isHotTime ? 2 : 1;
                  attacker.exp += (target as Monster).expReward * expMultiplier; 
                  
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

                     if (attacker.jobClass === "Fighter") {
                         attacker.str += 2;
                     } else if (attacker.jobClass === "Grappler") {
                         attacker.vit += 2;
                         attacker.maxHp += 20;
                         attacker.hp += 20;
                     }

                     this.broadcast("levelup", { playerId: attacker.id, level: attacker.level });
                  }

                  let isTargetWorldBoss = (target as Monster).isWorldBoss;
                  let isTargetBoss = (target as Monster).isBoss;
                  
                  if (isTargetWorldBoss) {
                     const weapon = new Item(`item_weapon_${Date.now()}_${data.targetId}`, "weapon", 1, target.x, target.y);
                     this.state.items.set(weapon.id, weapon);
                     this.broadcast("chat_message", { targetId: "SYSTEM", message: "WORLD BOSS DEFEATED!" });
                  } else if (isTargetBoss && Math.random() < 0.2) {
                     const belt = new Item(`item_belt_${Date.now()}_${data.targetId}`, "belt", 1, target.x, target.y);
                     this.state.items.set(belt.id, belt);
                  } else if (isTargetBoss || Math.random() < 0.5) { 
                    const dropAmount = isTargetBoss ? Math.floor(Math.random() * 200) + 100 : Math.floor(Math.random() * 50) + 10;
                    const item = new Item(`item_${Date.now()}_${data.targetId}`, "gold", dropAmount, target.x, target.y);
                    this.state.items.set(item.id, item);
                  }

                  this.state.monsters.delete(data.targetId);
              }
          } else {
             // PvP Death
             const deadPlayer = target as Player;
             
             // Friendly Fire Check
             if (attacker.guildName !== "None" && attacker.guildName === deadPlayer.guildName) return;

             // Invincibility check
             if (deadPlayer.invincibleUntil > Date.now()) {
                 this.broadcast("chat_message", { targetId: data.targetId, message: "IMMUNE" });
                 return;
             }

             if (isMiss) {
                 this.broadcast("damage", { targetId: data.targetId, damage: 0, isCrit: false, isMiss: true, jobClass: attacker.jobClass });
             } else {
                 deadPlayer.hp -= damage;
                 this.broadcast("damage", { targetId: data.targetId, damage, isCrit, isMiss: false, jobClass: attacker.jobClass });
             }

             if (deadPlayer.hp <= 0) {
                 deadPlayer.hp = 0;
                 console.log(`${deadPlayer.name} was defeated by ${attacker.name}!`);
                 this.broadcast("kill_log", { killer: attacker.name, victim: deadPlayer.name });
                 
                 // EXP Penalty
                 const expLoss = Math.floor(deadPlayer.exp * 0.1);
                 deadPlayer.exp = Math.max(0, deadPlayer.exp - expLoss);
                 this.broadcast("chat_message", { targetId: deadPlayer.id, message: `[System] You lost ${expLoss} EXP (10%) due to death.` });
                 
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
                 deadPlayer.invincibleUntil = Date.now() + 3000;
             }
          }
      }
    });

    // Spawn NPC
    const shopNpc = new Npc("npc_shop", "Manager", 400, 300);
    this.state.npcs.set(shopNpc.id, shopNpc);

    // Spawn initial monsters
    if (this.state.monsters.size < 10 && !this.state.isNight) {
        const m = new Monster(`monster_${Date.now()}`);
        if (m.x >= 350 && m.x <= 450) m.x = 200; // Push out of safe zone
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
    // Day/Night Cycle
    this.dayNightTimer += deltaTime;
    if (this.dayNightTimer >= 60000) { // 60 seconds
        this.dayNightTimer -= 60000;
        this.state.isNight = !this.state.isNight;
        const timeStr = this.state.isNight ? "NIGHT" : "DAY";
        console.log(`Time changed to ${timeStr}`);

        if (this.state.isNight) {
            const wb = new Monster(`world_boss_${Date.now()}`, true, true);
            this.state.monsters.set(wb.id, wb);
            this.broadcast("chat_message", { targetId: "SYSTEM", message: "THE WORLD BOSS HAS AWAKENED!" });
        }
    }

    // Hot Time Cycle
    this.hotTimeTimer += deltaTime;
    if (this.hotTimeTimer >= 120000) { // 120 seconds
        this.hotTimeTimer -= 120000;
        this.state.isHotTime = !this.state.isHotTime;
        if (this.state.isHotTime) {
            this.broadcast("chat_message", { targetId: "SYSTEM", message: "🔥 HOT TIME STARTED! 2X EXP! 🔥" });
        } else {
            this.broadcast("chat_message", { targetId: "SYSTEM", message: "HOT TIME ENDED." });
        }
    }

    // Weather Cycle
    this.weatherTimer += deltaTime;
    if (this.weatherTimer >= 90000) { // 90 seconds
        this.weatherTimer -= 90000;
        const roll = Math.random();
        if (roll < 0.33) {
            this.state.weather = "clear";
            this.broadcast("chat_message", { targetId: "SYSTEM", message: "The sky clears up." });
        } else if (roll < 0.66) {
            this.state.weather = "rain";
            this.broadcast("chat_message", { targetId: "SYSTEM", message: "It started to rain." });
        } else {
            this.state.weather = "snow";
            this.broadcast("chat_message", { targetId: "SYSTEM", message: "Snow is falling from the sky." });
        }
    }

    // Regenerate MP & Safe Zone HP
    this.state.players.forEach(player => {
       if (player.hp > 0 && player.mp < player.maxMp) {
           player.mp = Math.min(player.maxMp, player.mp + 1);
       }
       if (player.hp > 0 && player.x >= 350 && player.x <= 450) {
           player.hp = Math.min(player.maxHp, player.hp + 5);
           player.mp = Math.min(player.maxMp, player.mp + 5);
       }
       
       // AFK Check
       if (!player.isAFK && Date.now() - player.lastMoveTime > 60000) {
           player.isAFK = true;
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
          if (m.x >= 350 && m.x <= 450) m.x = 200; // Push out of safe zone
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
             if (nearestPlayer.invincibleUntil > Date.now()) {
                 // IMMUNE
             } else {
                 const nightDamageMultiplier = this.state.isNight ? 1.5 : 1.0;
                 const dmg = Math.floor(monster.damage * nightDamageMultiplier);
                 
                 nearestPlayer.hp -= dmg;
                 this.broadcast("damage", { targetId: nearestPlayer.id, damage: dmg });
                 if (nearestPlayer.hp <= 0) {
                   nearestPlayer.hp = 0;
                   
                   // EXP Penalty
                   const expLoss = Math.floor(nearestPlayer.exp * 0.1);
                   nearestPlayer.exp = Math.max(0, nearestPlayer.exp - expLoss);
                   this.broadcast("chat_message", { targetId: nearestPlayer.id, message: `[System] You lost ${expLoss} EXP (10%) due to death.` });
                   
                   nearestPlayer.hp = nearestPlayer.maxHp;
                   nearestPlayer.mp = nearestPlayer.maxMp;
                   nearestPlayer.x = 400; // Respawn near NPC
                   nearestPlayer.y = 300;
                   nearestPlayer.invincibleUntil = Date.now() + 3000;
                 }
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
    
    const username = options.username || "Guest_" + client.sessionId;
    
    // Fetch or create user in DB
    let dbUser = await prisma.user.findUnique({ where: { username } });
    if (!dbUser) {
        dbUser = await prisma.user.create({
            data: { username, password: "dummy_password" }
        });
    }

    const player = new Player(client.sessionId, username);
    player.x = 400;
    player.y = 300;
    
    // Load state from DB
    player.level = dbUser.level;
    player.exp = dbUser.exp;
    player.hp = dbUser.hp;
    player.maxHp = dbUser.maxHp;
    player.mp = dbUser.mp;
    player.maxMp = dbUser.maxMp;
    player.sp = dbUser.sp;
    player.str = dbUser.str;
    player.agi = dbUser.agi;
    player.vit = dbUser.vit;
    player.hasBelt = dbUser.hasBelt;
    player.questStatus = dbUser.questStatus;
    player.questProgress = dbUser.questProgress;
    player.jobClass = dbUser.jobClass;
    player.guildName = dbUser.guildName;
    player.hasWeapon = dbUser.hasWeapon;
    player.rebirthCount = dbUser.rebirthCount;
    player.inventory.set("gold", dbUser.gold);

    this.state.players.set(client.sessionId, player);
  }

  async onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
    const player = this.state.players.get(client.sessionId);
    if (player) {
       // Save to DB
       await prisma.user.update({
           where: { username: player.name },
           data: {
               level: player.level,
               exp: player.exp,
               hp: player.hp,
               maxHp: player.maxHp,
               mp: player.mp,
               maxMp: player.maxMp,
               gold: player.inventory.get("gold") || 0,
               sp: player.sp,
               str: player.str,
               agi: player.agi,
               vit: player.vit,
               hasBelt: player.hasBelt,
               questStatus: player.questStatus,
               questProgress: player.questProgress,
               jobClass: player.jobClass,
               guildName: player.guildName,
               hasWeapon: player.hasWeapon,
               rebirthCount: player.rebirthCount
           }
       });
    }
    this.state.players.delete(client.sessionId);
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }
}
