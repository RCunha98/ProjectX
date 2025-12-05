import { BlackjackHand } from './BlackJackHand.js';
import { DealerHand } from './DealerHand.js'; 
import { Deck } from '../core/card-games/Deck.js';

// 1. Estados da Ronda
export enum GamePhase {
    Idle = 'IDLE',         
    Betting = 'BETTING',  
      Dealing = 'DEALING',
    PlayerTurn = 'PLAYER_TURN', 
    DealerTurn = 'DEALER_TURN',
    Payout = 'PAYOUT',    
    Cleanup = 'CLEANUP', 
}


export interface IGameRules {
    deckCount: number; 
    blackjackPayout: '3:2' | '6:5'; 
    dealerSoft17Rule: 'HIT' | 'STAND';
    minBet: number;
    maxBet: number;
}

export interface IPlayerState {
    id: string;
    name: string;
    chips: number;
    currentBet: number;
    hand: BlackjackHand; 
    handStatus: 'Playing' | 'Standing' | 'Busted' | 'Blackjack';
    isActive: boolean;
}

export interface IGameState {
    roomId: string;
    phase: GamePhase;
    deck: Deck;
    dealerHand: DealerHand;
    players: Map<string, IPlayerState>; 
    currentPlayerId: string | null; 
}