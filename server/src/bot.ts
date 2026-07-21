import { Client } from "colyseus.js";

const client = new Client("ws://localhost:2567");

async function startBot() {
  try {
    const room = await client.joinOrCreate("game", { userId: "dummy_bot" });
    console.log("Bot joined room:", room.roomId);

    setInterval(() => {
      // Find nearest monster
      let nearestMonsterId: string | null = null;
      let minDistance = 1000;
      let targetX = -1;
      let targetY = -1;
      
      const myPlayer = room.state.players.get(room.sessionId);
      if (!myPlayer) return;

      room.state.monsters.forEach((monster: any, id: string) => {
          if (monster.hp > 0) {
             const dist = Math.sqrt(Math.pow(myPlayer.x - monster.x, 2) + Math.pow(myPlayer.y - monster.y, 2));
             if (dist < minDistance) {
                 minDistance = dist;
                 nearestMonsterId = id;
                 targetX = monster.x;
                 targetY = monster.y;
             }
          }
      });

      if (nearestMonsterId) {
          if (minDistance > 40) {
              // Move towards monster
              const dx = targetX - myPlayer.x;
              const dy = targetY - myPlayer.y;
              room.send("move", { 
                  x: myPlayer.x + (dx/minDistance) * 10, 
                  y: myPlayer.y + (dy/minDistance) * 10 
              });
              // console.log(`Bot chasing monster ${nearestMonsterId}`);
          } else {
              // Attack
              room.send("attack", { targetId: nearestMonsterId, isMonster: true });
              console.log(`Bot attacking monster ${nearestMonsterId}`);
          }
      } else {
          // Random movement
          const x = Math.floor(Math.random() * 100);
          const y = Math.floor(Math.random() * 100);
          room.send("move", { x, y });
          console.log(`Bot wandering to ${x}, ${y}`);
      }
    }, 200);

  } catch (e) {
    console.error("Join error", e);
  }
}

startBot();
