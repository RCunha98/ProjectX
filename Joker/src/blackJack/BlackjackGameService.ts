
import type { IGameState, IPlayerState, IGameRules } from './types.js';
import { GamePhase } from './types.js';
import { Deck } from '../core/card-games/Deck.js';
import { BlackjackHand } from './BlackJackHand.js';
import { DealerHand } from './DealerHand.js';

export class BlackjackGameService {
    private games: Map<string, IGameState> = new Map();

    private DEFAULT_RULES: IGameRules = {
        deckCount: 6,
        blackjackPayout: '3:2',
        dealerSoft17Rule: 'STAND',
        minBet: 10,
        maxBet: 500,
    };

    public joinGame(roomId: string, playerId: string, playerName: string): IGameState {
        if (!this.games.has(roomId)) {
            const newGame: IGameState = {
                roomId,
                phase: GamePhase.Idle,
                deck: new Deck(),
                dealerHand: new DealerHand(),
                players: new Map(),
                currentPlayerId: null,
            };
            newGame.deck.initialize(this.DEFAULT_RULES.deckCount);
            this.games.set(roomId, newGame);
            
            newGame.phase = GamePhase.Betting;
        }

        const game = this.games.get(roomId)!;
        
        if (!game.players.has(playerId)) {
            const newPlayer: IPlayerState = {
                id: playerId,
                name: playerName,
                chips: 1000,
                currentBet: 0,
                hand: new BlackjackHand(),
                handStatus: 'Playing',
                isActive: false,
            };
            game.players.set(playerId, newPlayer);
        }
        
        return game;
    }


    public handlePlayerAction(roomId: string, playerId: string, actionType: 'BET' | 'HIT' | 'STAND', payload?: any): IGameState {
        const game = this.games.get(roomId);
        if (!game) throw new Error("Sala não encontrada.");
        const player = game.players.get(playerId);
        if (!player) throw new Error("Jogador não encontrado na sala.");

        if (actionType === 'BET' && game.phase!== GamePhase.Betting) {
            throw new Error("Não é fase de apostas.");
        }
        if ((actionType === 'HIT' || actionType === 'STAND') && game.phase!== GamePhase.PlayerTurn) {
            throw new Error("Não é fase de jogada.");
        }

        switch (actionType) {
            case 'BET':
                this.handleBet(game, player, payload.amount);
                break;
            case 'HIT':
                this.handleHit(game, player);
                break;
            case 'STAND':
                this.handleStand(game, player);
                break;
        }
        
        return game;
    }
    
    
    private handleBet(game: IGameState, player: IPlayerState, amount: number): void {
        if (amount < this.DEFAULT_RULES.minBet || amount > player.chips) {
            throw new Error("Aposta inválida.");
        }
        player.chips -= amount;
        player.currentBet = amount;
    }
    
    private handleHit(game: IGameState, player: IPlayerState): void {
        const newCard = game.deck.drawCard();
        if (!newCard) throw new Error("Baralho vazio, é necessário rebaralhar.");
        
        player.hand.addCard(newCard);
        
        if (player.hand.isBust()) {
            player.handStatus = 'Busted';
        }
    }
    
    private handleStand(game: IGameState, player: IPlayerState): void {
        player.handStatus = 'Standing';
    }

    async removePlayer(roomId: string, playerId: string): Promise<void> {
        const game = this.games.get(roomId);
        if (game) {
            game.players.delete(playerId);
            if (game.players.size === 0) {
                this.games.delete(roomId);
            }   
        }
  }      
}