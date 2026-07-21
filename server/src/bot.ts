import { Client } from "colyseus.js";

const client = new Client("ws://localhost:2567");

async function startBot() {
  try {
    const room = await client.joinOrCreate("game", { userId: "dummy_bot" });
    console.log("Bot joined room:", room.id);

    setInterval(() => {
      // Random movement
      const x = Math.floor(Math.random() * 100);
      const y = Math.floor(Math.random() * 100);
      room.send("move", { x, y });
      console.log(`Bot moved to ${x}, ${y}`);
    }, 2000);

  } catch (e) {
    console.error("Join error", e);
  }
}

startBot();
