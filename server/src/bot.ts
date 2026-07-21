import { Client } from "colyseus.js";

const client = new Client("ws://localhost:2567");

async function startBot() {
  try {
    const botName = "Bot_" + Math.floor(Math.random() * 1000);
    const room = await client.joinOrCreate("game", { username: botName });
    console.log(`${botName} joined successfully!`);
    console.log("Bot joined room:", room.roomId);

    setInterval(() => {
      const myPlayer = room.state.players.get(room.sessionId);
      if (!myPlayer) return;

      // Random Chat Macro
      if (Math.random() < 0.01) {
          room.send("chat", { message: "I am the best wrestler! 👑" });
      }

      // Handle Quests
      if (myPlayer.questStatus === 0 || (myPlayer.questStatus === 1 && myPlayer.questProgress >= 5)) {
          const shopNpc = room.state.npcs.get("npc_shop");
          if (shopNpc) {
              const dist = Math.sqrt(Math.pow(myPlayer.x - shopNpc.x, 2) + Math.pow(myPlayer.y - shopNpc.y, 2));
              if (dist > 50) {
                 const dx = shopNpc.x - myPlayer.x;
                 const dy = shopNpc.y - myPlayer.y;
                 room.send("move", { x: myPlayer.x + (dx/dist) * 10, y: myPlayer.y + (dy/dist) * 10 });
                 return; // Focus on moving to NPC
              } else {
                 room.send("accept_quest");
                 console.log("Bot interacted with Quest NPC!");
                 return;
              }
          }
      }

      // Allocate SP to STR
      if (myPlayer.sp > 0) {
          room.send("add_stat", { stat: "str" });
          console.log("Bot allocated SP to STR");
            // Buy heal if hp is low
          if (myPlayer.hp < myPlayer.maxHp * 0.3) {
             room.send("buy_heal");
          }

          // Advance Job if Level >= 10
          if (myPlayer.level >= 10 && myPlayer.jobClass === "Novice") {
             const jobs = ["Fighter", "Grappler"];
             const pickedJob = jobs[Math.floor(Math.random() * jobs.length)];
             room.send("change_job", { job: pickedJob });
             console.log(`${botName} changed job to ${pickedJob}!`);
          }
      }

      // Heal if low HP
      if (myPlayer.hp < myPlayer.maxHp * 0.3) {
          const shopNpc = room.state.npcs.get("npc_shop");
          if (shopNpc) {
              const dist = Math.sqrt(Math.pow(myPlayer.x - shopNpc.x, 2) + Math.pow(myPlayer.y - shopNpc.y, 2));
              if (dist > 50) {
                 const dx = shopNpc.x - myPlayer.x;
                 const dy = shopNpc.y - myPlayer.y;
                 room.send("move", { x: myPlayer.x + (dx/dist) * 10, y: myPlayer.y + (dy/dist) * 10 });
                 return; // Focus on moving to NPC
              } else {
                 room.send("buy_heal");
                 console.log("Bot healed at NPC!");
                 return;
              }
          }
      }

      // Pick up item if nearby
      let nearItem = false;
      room.state.items.forEach((item: any, id: string) => {
          const dist = Math.sqrt(Math.pow(myPlayer.x - item.x, 2) + Math.pow(myPlayer.y - item.y, 2));
          if (dist < 50) {
             nearItem = true;
          }
      });
      if (nearItem) {
          room.send("pickup");
          // console.log("Bot picked up an item");
      }

      // Find nearest monster
      let nearestMonsterId: string | null = null;
      let minDistance = 1000;
      let targetX = -1;
      let targetY = -1;
      
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
          } else {
              // Attack (use skill if enough MP, otherwise normal attack)
              if (myPlayer.mp >= 20) {
                  room.send("skill_cast", { skill: "lariat" });
                  console.log(`Bot used skill Lariat!`);
              } else {
                  room.send("attack", { targetId: nearestMonsterId, isMonster: true });
                  console.log(`Bot attacking monster ${nearestMonsterId}`);
              }
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
