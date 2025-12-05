
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { GameRegistry } from './registry/GameRegistry.js';
import type { ClientToServerEvents, ServerToClientEvents, SocketData } from './types/events.js';

const app = express();
const httpServer = createServer(app);

type MainIo = Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>;

const CORS_OPTIONS = {
    origin: ["http://localhost:5173"], 
    methods: ["GET", "POST"]
};

const io: MainIo = new Server(httpServer, {
    cors: CORS_OPTIONS
});

GameRegistry.initialize(io); [1, 2]

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Joker Server rodando na porta ${PORT}`);
});