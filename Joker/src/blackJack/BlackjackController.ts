import { Namespace, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents, SocketData, IFeGameState, IFeCard, IFePlayerState } from '../types/events.js';
import { BlackjackGameService } from './BlackjackGameService.js';
import type { IGameState, IPlayerState } from '../blackJack/types.js';
import { GamePhase } from '../blackJack/types.js';
import { PlayingCard } from '../core/card-games/PlayingCard.js';

type BlackjackSocket = Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>;
type BlackjackNamespace = Namespace<ClientToServerEvents, ServerToClientEvents, {}, SocketData>;


export class BlackjackController {
    private gameService: BlackjackGameService;
    private io: BlackjackNamespace; 

    constructor(io: BlackjackNamespace, gameService: BlackjackGameService) {
        this.io = io;
        this.gameService = gameService;
        
        this.io.on('connection', this.onConnection);
    }

    private onConnection = (socket: BlackjackSocket) => {
        socket.on('blackjack:join', (roomId, playerName) => this.handleJoin(socket, roomId, playerName));
        socket.on('blackjack:bet', (roomId, amount) => this.handleAction(socket, roomId, 'BET', { amount }));
        socket.on('blackjack:hit', (roomId) => this.handleAction(socket, roomId, 'HIT'));
        socket.on('blackjack:stand', (roomId) => this.handleAction(socket, roomId, 'STAND'));
        
        socket.on('disconnect', () => this.handleDisconnect(socket));
    }


    private handleJoin(socket: BlackjackSocket, roomId: string, playerName: string): void {
        try {
            const updatedState = this.gameService.joinGame(roomId, socket.id, playerName);

            socket.join(roomId);

            socket.data.roomId = roomId;
            socket.data.userId = socket.id; 

            this.broadcastStateUpdate(roomId, updatedState);
            
        } catch (error) {
            socket.emit('blackjack:error', (error as Error).message);
        }
    }
    
    private handleAction(socket: BlackjackSocket, roomId: string, actionType: 'HIT' | 'STAND' | 'BET', payload?: any): void {
        try {
            if (socket.data.roomId!== roomId) {
                socket.emit('blackjack:error', 'Socket não pertence a esta sala.');
                return;
            }

            const updatedState = this.gameService.handlePlayerAction(roomId, socket.id, actionType, payload);

            this.broadcastStateUpdate(roomId, updatedState);

        } catch (error) {
            socket.emit('blackjack:error', (error as Error).message);
        }
    }

    private mapToFeState(gameState: IGameState): IFeGameState {
        const playersMap = Array.from(gameState.players.values()).map(p => this.mapPlayerToFe(p, gameState.currentPlayerId));        
        return {
            roomId: gameState.roomId,
            phase: gameState.phase,
            dealerHand: this.mapDealerHand(gameState.dealerHand, gameState.phase), 
            players: playersMap,
        } as unknown as IFeGameState;
    }
    
    private mapDealerHand(dealerHand: any, currentPhase: GamePhase): IFeCard {
        const isHoleCardVisible = currentPhase === GamePhase.DealerTurn || currentPhase === GamePhase.Payout;
        
        return dealerHand.getCards().map((card: PlayingCard, index: number): IFeCard => {
            if (index === 1 &&!isHoleCardVisible) {
                return { suit: '?', rank: '?' };
            }
            return { suit: card.suit, rank: card.rank };
        });
    }

    private mapPlayerToFe(player: IPlayerState, currentPlayerId: string | null): IFePlayerState {
        return {
            id: player.id,
            name: player.name,
            chips: player.chips,
            currentBet: player.currentBet,
            hand: player.hand.getCards().map((card: PlayingCard) => ({ suit: card.suit, rank: card.rank })),
            score: player.hand.getScore(), 
            handStatus: player.handStatus,
            isTurn: player.id === currentPlayerId,
        };
    }
    
    private broadcastStateUpdate(roomId: string, gameState: IGameState): void {
        const feGameState = this.mapToFeState(gameState);
        
        this.io.to(roomId).emit('blackjack:stateUpdate', feGameState);
    }
    
    private handleDisconnect(socket: BlackjackSocket): void {
        if (socket.data.roomId) {
            this.gameService.removePlayer(socket.data.roomId, socket.id);
        }
    }
}