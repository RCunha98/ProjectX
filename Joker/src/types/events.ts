import { Suit, Rank } from '../core/card-games/types.js';

export interface IFeCard {
    suit: Suit | '?';
    rank: Rank | '?'; 
}

export interface IFePlayerState {
    id: string;
    name: string;
    chips: number;
    currentBet: number;
    hand: IFeCard[]; 
    score: number;
    handStatus: string; 
    isTurn: boolean;
}

export interface IFeGameState {
    roomId: string;
    phase: string; 
    dealerHand: IFeCard[]; 
    players: IFePlayerState[];
    timerRemaining?: number; // seconds remaining in current phase (optional)
}

export interface ClientToServerEvents {
    'blackjack:join': (roomId: string, playerName: string) => void;
    'blackjack:hit': (roomId: string) => void;
    'blackjack:stand': (roomId: string) => void;
    'blackjack:bet': (roomId: string, amount: number) => void;
    'blackjack:phaseTimeout': (roomId: string, phase: string) => void;
}

export interface ServerToClientEvents {
    'blackjack:stateUpdate': (gameState: IFeGameState) => void;
    'blackjack:error': (message: string) => void;
}

// 5. Dados de Sessão (Armazenados no objeto Socket)
export interface SocketData {
    userId: string;
    roomId: string; 
}