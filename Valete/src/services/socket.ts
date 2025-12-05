
import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '../../../Joker/src/types/events.js'; 

type BlackjackSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
const NAMESPACE = '/blackjack';

export const blackjackSocket: BlackjackSocket = io(SERVER_URL + NAMESPACE, {
    autoConnect: false,
});