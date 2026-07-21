import { Room, Client } from "@colyseus/core";
import { GameState, Player, Monster } from "./schema/GameState";
import { prisma } from "../db";

export class GameRoom extends Room<GameState> {
  maxClients = 100;
  private gameLoop: any;

  onCreate(options: any) {
    this.setState(new GameState());

    this.onMessage("move", (client, data) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.x = data.x;
        player.y = data.y;
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
               this.broadcast("levelup", { playerId: attacker.id, level: attacker.level });
            }
            this.state.monsters.delete(data.targetId);
          }
        }
      }
    });

    // Spawn initial monsters
    for (let i = 0; i < 5; i++) {
      const m = new Monster(`monster_${i}`);
      this.state.monsters.set(m.id, m);
    }

    // Set up game loop (server tick)
    this.setSimulationInterval((deltaTime) => this.update(deltaTime));
  }

  update(deltaTime: number) {
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
