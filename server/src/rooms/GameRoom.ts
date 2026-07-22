import { Room, Client } from "@colyseus/core";
import { GameState, Player, Monster } from "./schema/GameState";

export class GameRoom extends Room<GameState> {
  maxClients = 100;

  onCreate(options: any) {
    this.setState(new GameState());

    // Spawn initial monsters
    this.spawnInitialMonsters();

    // Handle Player Movement
    this.onMessage("move", (client: Client, data: { x: number; y?: number }) => {
      const player = this.state.players.get(client.sessionId);
      if (player && player.hp > 0) {
        player.x = Math.max(50, Math.min(2350, data.x));
        if (data.y !== undefined) {
          player.y = Math.max(100, Math.min(500, data.y));
        }
      }
    });

    // Handle Basic Attack
    this.onMessage("attack", (client: Client, data: { targetId: string }) => {
      const attacker = this.state.players.get(client.sessionId);
      if (!attacker || attacker.hp <= 0) return;

      const monster = this.state.monsters.get(data.targetId);
      if (monster && monster.hp > 0) {
        const damage = 20;
        monster.hp = Math.max(0, monster.hp - damage);
        
        this.broadcast("damage", { targetId: monster.id, damage });

        if (monster.hp <= 0) {
          // Grant EXP
          attacker.exp += 25;
          if (attacker.exp >= attacker.maxExp) {
            attacker.level += 1;
            attacker.exp = 0;
            attacker.maxExp = Math.floor(attacker.maxExp * 1.5);
            attacker.maxHp += 20;
            attacker.hp = attacker.maxHp;
            this.broadcast("levelup", { playerId: attacker.id, level: attacker.level });
          }

          // Respawn monster after 3 seconds
          const monsterType = monster.type;
          const spawnX = monster.x;
          const spawnY = monster.y;
          this.state.monsters.delete(monster.id);

          this.clock.setTimeout(() => {
            const respawned = new Monster(`mob_${Date.now()}_${Math.random()}`, monsterType, spawnX, spawnY);
            this.state.monsters.set(respawned.id, respawned);
          }, 3000);
        }
      }
    });

    // Server Tick Loop
    this.setSimulationInterval((deltaTime) => this.update(deltaTime));
  }

  onJoin(client: Client, options: any) {
    const username = options.username || `Player_${client.sessionId.substring(0, 4)}`;
    const player = new Player(client.sessionId, username);
    this.state.players.set(client.sessionId, player);
    console.log(`[GameRoom] Player joined: ${username} (${client.sessionId})`);
  }

  onLeave(client: Client, consented: boolean) {
    this.state.players.delete(client.sessionId);
    console.log(`[GameRoom] Player left: ${client.sessionId}`);
  }

  spawnInitialMonsters() {
    const defaultPositions = [
      { x: 500, y: 500, type: "Slime" },
      { x: 800, y: 500, type: "Slime" },
      { x: 1100, y: 500, type: "RibbonPig" },
      { x: 1400, y: 500, type: "RibbonPig" },
      { x: 1700, y: 500, type: "StoneGolem" },
      { x: 2000, y: 500, type: "StoneGolem" },
    ];

    defaultPositions.forEach((pos, index) => {
      const mob = new Monster(`mob_init_${index}`, pos.type, pos.x, pos.y);
      this.state.monsters.set(mob.id, mob);
    });
  }

  update(deltaTime: number) {
    // Basic AI or passive regeneration if needed
  }

  onDispose() {
    console.log("[GameRoom] Room disposed.");
  }
}
