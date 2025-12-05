import type { IGameState, IPlayerState, IGameRules } from './types.js';
import { GamePhase } from './types.js';
import { Deck } from '../core/card-games/Deck.js';
import { BlackjackHand } from './BlackJackHand.js';
import { DealerHand } from './DealerHand.js';

export class BlackjackGameService {
    private games: Map<string, IGameState> = new Map();
    // per-room timers (returned value from setInterval)
    private phaseTimers: Map<string, ReturnType<typeof setInterval>> = new Map();
    // per-room phase start timestamp (ms since epoch)
    private phaseStart: Map<string, number> = new Map();
    private readonly PHASE_DURATION_MS = 15 * 1000; // 15 seconds

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
            // record phase start time
            this.phaseStart.set(roomId, Date.now());
            // newly created game: timers are not started here by default; controller should call startPhaseTimer
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

    // Start automatic cycling of phases for a room.
    // onPhaseChange will be called with the updated game state after each phase advancement.
    public startPhaseTimer(roomId: string, onPhaseChange?: (game: IGameState) => void) {
        // avoid starting multiple timers
        if (this.phaseTimers.has(roomId)) return;
        // ensure phase start exists
        if (!this.phaseStart.has(roomId)) this.phaseStart.set(roomId, Date.now());
         const timer = setInterval(() => {
             try {
                 const updated = this.advancePhase(roomId);
                 if (onPhaseChange && updated) onPhaseChange(updated);
             } catch (err) {
                 // swallow errors to avoid timer crash
                 console.error('[BlackjackGameService] error advancing phase for', roomId, err);
             }
         }, this.PHASE_DURATION_MS);
         this.phaseTimers.set(roomId, timer);
     }

    public stopPhaseTimer(roomId: string) {
        const t = this.phaseTimers.get(roomId);
        if (t) {
            clearInterval(t as unknown as number);
            this.phaseTimers.delete(roomId);
        }
    }

    // Advance the game to the next phase (basic cycling). Returns updated game state.
    public advancePhase(roomId: string): IGameState | undefined {
         const game = this.games.get(roomId);
         if (!game) return undefined;
 
         switch (game.phase) {
             case GamePhase.Betting:
                game.phase = GamePhase.Dealing;
                // prepare dealer hand
                game.dealerHand = new DealerHand();
                // reset players hands before dealing
                for (const p of game.players.values()) {
                    p.hand = new BlackjackHand();
                    p.handStatus = 'Playing';
                    p.isActive = p.currentBet > 0;
                }
                break;
             case GamePhase.Dealing:
                // perform initial dealing: two rounds
                // deal first card to each active player
                console.log(`[BlackjackGameService] dealing: room=${roomId} — starting dealing round 1`);
                 for (const p of game.players.values()) {
                     if (p.currentBet > 0) {
                         const c1 = game.deck.drawCard();
                         if (c1) p.hand.addCard(c1);
                       console.log(`[BlackjackGameService] dealt to player ${p.id}: ${c1?.rank}${c1?.suit}`);
                     }
                 }
                 // dealer first card
                 const d1 = game.deck.drawCard();
                 if (d1) game.dealerHand.addCard(d1);
               console.log(`[BlackjackGameService] dealt to dealer: ${d1?.rank}${d1?.suit}`);
 
                 // second round
               console.log(`[BlackjackGameService] dealing: room=${roomId} — starting dealing round 2`);
                 for (const p of game.players.values()) {
                     if (p.currentBet > 0) {
                         const c2 = game.deck.drawCard();
                         if (c2) p.hand.addCard(c2);
                       console.log(`[BlackjackGameService] dealt to player ${p.id}: ${c2?.rank}${c2?.suit}`);
                     }
                 }
                 // dealer second card (hole card)
                 const d2 = game.deck.drawCard();
                 if (d2) game.dealerHand.addCard(d2);
               console.log(`[BlackjackGameService] dealt hole to dealer: ${d2?.rank}${d2?.suit}`);
 
                // set current player to first active player with a bet
                const firstActive = Array.from(game.players.values()).find(p => p.currentBet > 0);
                game.currentPlayerId = firstActive ? firstActive.id : null;
                game.phase = GamePhase.PlayerTurn;
                 break;
             case GamePhase.PlayerTurn:
                 game.phase = GamePhase.DealerTurn;
               // reveal dealer hole card when entering dealer turn
               game.dealerHand.revealHoleCard();
               console.log(`[BlackjackGameService] revealing dealer hole card for room=${roomId}`);
                 break;
             case GamePhase.DealerTurn:
                 game.phase = GamePhase.Payout;
                 break;
             case GamePhase.Payout:
                 game.phase = GamePhase.Cleanup;
                 break;
             case GamePhase.Cleanup:
                 for (const p of game.players.values()) {
                     p.currentBet = 0;
                     p.hand = new BlackjackHand();
                     p.handStatus = 'Playing';
                     p.isActive = false;
                 }
                 game.dealerHand = new DealerHand();
                 game.currentPlayerId = null;
                 game.phase = GamePhase.Betting;
               console.log(`[BlackjackGameService] cleanup finished for room=${roomId}, entering BETTING`);
                 break;
             default:
                 game.phase = GamePhase.Betting;
         }
         // record phase start timestamp for new phase
         this.phaseStart.set(roomId, Date.now());
 
         return game;
     }

    // Return remaining seconds for current phase, or undefined if room not found
    public getTimerRemaining(roomId: string): number | undefined {
        const start = this.phaseStart.get(roomId);
        if (!start) return undefined;
        const elapsed = Date.now() - start;
        const remMs = this.PHASE_DURATION_MS - elapsed;
        return remMs > 0 ? Math.ceil(remMs / 1000) : 0;
    }

    async removePlayer(roomId: string, playerId: string): Promise<void> {
        const game = this.games.get(roomId);
        if (game) {
            game.players.delete(playerId);
            if (game.players.size === 0) {
                // stop timer and delete game
                this.stopPhaseTimer(roomId);
                this.phaseStart.delete(roomId);
                this.games.delete(roomId);
             }   
         }
   }      
 }