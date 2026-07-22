import { Room, Client } from "@colyseus/core";
import { GameState, Player, Monster } from "./schema/GameState";

export class GameRoom extends Room<GameState> {
  maxClients = 100;

  onCreate(options: any) {
    this.setState(new GameState());

    this.spawnInitialMonsters();

    this.onMessage("move", (client: Client, data: { x: number; y?: number }) => {
      const player = this.state.players.get(client.sessionId);
      if (player && player.hp > 0) {
        player.x = Math.max(50, Math.min(2350, data.x));
        if (data.y !== undefined) {
          player.y = Math.max(100, Math.min(500, data.y));
        }
      }
    });

    this.onMessage("attack", (client: Client, data: { targetId: string }) => {
      const attacker = this.state.players.get(client.sessionId);
      if (!attacker || attacker.hp <= 0) return;

      const monster = this.state.monsters.get(data.targetId);
      if (monster && monster.hp > 0) {
        const damage = 25;
        monster.hp = Math.max(0, monster.hp - damage);
        
        this.broadcast("damage", { targetId: monster.id, damage });

        if (monster.hp <= 0) {
          attacker.exp += 30;
          if (attacker.exp >= attacker.maxExp) {
            attacker.level += 1;
            attacker.exp = 0;
            attacker.maxExp = Math.floor(attacker.maxExp * 1.5);
            attacker.maxHp += 25;
            attacker.hp = attacker.maxHp;
            this.broadcast("levelup", { playerId: attacker.id, level: attacker.level });
          }

          const mType = monster.type;
          const mX = monster.x;
          const mY = monster.y;
          this.state.monsters.delete(monster.id);

          this.clock.setTimeout(() => {
            const respawned = new Monster(`mob_${Date.now()}_${Math.floor(Math.random()*1000)}`, mType, mX, mY);
            this.state.monsters.set(respawned.id, respawned);
          }, 3000);
        }
      }
    });
  }

  onJoin(client: Client, options: any) {
    const username = (options && options.username) ? options.username : `Wrestler_${client.sessionId.substring(0, 4)}`;
    const player = new Player(client.sessionId, username);
    this.state.players.set(client.sessionId, player);
    console.log(`[GameRoom] Player joined: ${username} (${client.sessionId})`);
  }

  onLeave(client: Client, consented: boolean) {
    this.state.players.delete(client.sessionId);
    console.log(`[GameRoom] Player left: ${client.sessionId}`);
  }

  spawnInitialMonsters() {
    const initialMobs = [
      { type: "Slime", x: 600, y: 500 },
      { type: "Slime", x: 900, y: 500 },
      { type: "RibbonPig", x: 1200, y: 500 },
      { type: "RibbonPig", x: 1500, y: 500 },
      { type: "StoneGolem", x: 1800, y: 500 },
      { type: "StoneGolem", x: 2100, y: 500 },
    ];

    initialMobs.forEach((m, idx) => {
      const mob = new Monster(`mob_init_${idx}`, m.type, m.x, m.y);
      this.state.monsters.set(mob.id, mob);
    });
  }
}
