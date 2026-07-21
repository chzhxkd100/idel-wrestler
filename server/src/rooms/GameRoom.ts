import { Room, Client } from "@colyseus/core";
import { GameState, Player } from "./schema/GameState";
import { prisma } from "../db";

export class GameRoom extends Room<GameState> {
  maxClients = 100;

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
        if (target.hp <= 0) {
          target.hp = 0;
          console.log(`${target.name} was defeated by ${attacker.name}!`);
          // Respawn logic or death state handling could go here
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
