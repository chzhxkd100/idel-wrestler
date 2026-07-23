import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

// Serve static files in production
app.use(express.static(path.join(__dirname, '../dist')));

// Game State: Only players
const players = {};

// Server Game Tick (30 FPS) - Broadcast player state
setInterval(() => {
  io.emit('gameState', {
    players
  });
}, 1000 / 30);

// Socket Connection Handler
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Handle Player Login / Init
  socket.on('joinGame', (data) => {
    const { nickname } = data;
    
    players[socket.id] = {
      id: socket.id,
      nickname: nickname || `모험가_${socket.id.slice(0, 4)}`,
      mapId: 'map1',
      x: 200 + Math.random() * 100,
      y: 880,
      vx: 0,
      vy: 0,
      facing: 1,
      animState: 'idle',
      isClimbing: false
    };

    // Send init payload to joined client
    socket.emit('initSelf', {
      selfId: socket.id,
      player: players[socket.id]
    });
  });

  // Handle Movement & State Sync from client
  socket.on('playerUpdate', (data) => {
    const p = players[socket.id];
    if (!p) return;

    p.mapId = data.mapId || p.mapId || 'map1';
    p.x = data.x;
    p.y = data.y;
    p.vx = data.vx;
    p.vy = data.vy;
    p.facing = data.facing;
    p.animState = data.animState;
    p.isClimbing = data.isClimbing;
  });

  // Handle Map Transition via Portal
  socket.on('changeMap', (data) => {
    const p = players[socket.id];
    if (!p) return;

    const { targetMap, targetX, targetY } = data;
    p.mapId = targetMap;
    p.x = targetX;
    p.y = targetY;
    p.vx = 0;
    p.vy = 0;
    p.isClimbing = false;

    // Confirm map change to client
    socket.emit('mapChanged', {
      mapId: p.mapId,
      x: p.x,
      y: p.y
    });
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    delete players[socket.id];
    io.emit('playerLeft', socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`🎮 Game Server running on port ${PORT}`);
});
