import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import express from "express";
import cors from "cors";
import http from "http";
import { GameRoom } from "./rooms/GameRoom";

import { authRouter } from "./routes/auth";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/auth", authRouter);

const server = http.createServer(app);

const gameServer = new Server({
  transport: new WebSocketTransport({
    server
  })
});

// Register rooms
gameServer.define("game", GameRoom);

const port = Number(process.env.PORT || 2567);
gameServer.listen(port).then(() => {
  console.log(`[GameServer] Listening on port: ${port}`);
});
