
import { Server } from 'socket.io';
import { BlackjackController } from '../blackJack/BlackjackController.js';
import { BlackjackGameService } from '../blackJack/BlackjackGameService.js';
import type { ClientToServerEvents, ServerToClientEvents, SocketData } from '../types/events.js';

type MainIo = Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>;

export class GameRegistry {
    
    public static readonly NAMESPACES = {
        BLACKJACK: '/blackjack',
    };

    public static initialize(io: MainIo): void {
        

        const blackjackService = new BlackjackGameService();

        const blackjackNamespace = io.of(GameRegistry.NAMESPACES.BLACKJACK);


        new BlackjackController(blackjackNamespace, blackjackService);
        
    }
}