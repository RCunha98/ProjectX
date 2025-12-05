// valete-client/src/stores/blackjackStore.ts

import { defineStore } from 'pinia';
import { blackjackSocket } from '../services/socket.js'; 
import type { IFeGameState } from '../../../Joker/src/types/events.js';

export const useBlackjackStore = defineStore('blackjack', {
    state: () => ({
        gameState: {
            roomId: '',
            phase: 'IDLE',
            dealerHand:[],
            players:[],
        } as IFeGameState,
        isConnected: false,
        clientId: '',
        playerName: '',
        error: '',
    }),
    actions: {
        connectAndListen() {
            if (this.isConnected) return;

            blackjackSocket.connect();
            this.isConnected = true;

            blackjackSocket.on('blackjack:stateUpdate', (newState) => {
                this.gameState = newState;
            });

            blackjackSocket.on('blackjack:error', (message) => {
                this.error = message;
            });
            
            blackjackSocket.on('disconnect', () => {
                this.isConnected = false;
                this.clientId = '';
            });
            blackjackSocket.on('connect', () => {
                this.isConnected = true;
                // store the socket id so the UI can identify the local player
                this.clientId = (blackjackSocket as any).id || '';
            });
        },
        
        joinGame(roomId: string, playerName: string) {
            // remember the playerName locally
            this.playerName = playerName;
            blackjackSocket.emit('blackjack:join', roomId, playerName);
        },
        
        placeBet(roomId: string, amount: number) {
            // only allow betting in BETTING phase
            if (this.gameState.phase !== 'BETTING') {
                this.error = 'Não é fase de apostas.';
                return;
            }
            if (!this.gameState.roomId) return;
            const bet = Math.max(0, Math.floor(amount));
            blackjackSocket.emit('blackjack:bet', roomId, bet);
        },
        
        sendAction(actionType: 'HIT' | 'STAND') {
            if (this.gameState.roomId) {
                const event: 'blackjack:hit' | 'blackjack:stand' = actionType === 'HIT' ? 'blackjack:hit' : 'blackjack:stand';
                blackjackSocket.emit(event, this.gameState.roomId);
            }
        },
        
        // Notify backend that the phase timer expired (client-side fallback)
        notifyPhaseTimeout(roomId?: string) {
            const id = roomId || this.gameState.roomId;
            if (!id) return;
            try {
                // socket typings restrict allowed event names; cast to any to emit custom event
                (blackjackSocket as any).emit('blackjack:phaseTimeout', id, this.gameState.phase);
                console.log('[blackjackStore] emitted blackjack:phaseTimeout', { roomId: id, phase: this.gameState.phase });
            } catch (err) {
                console.error('[blackjackStore] failed to emit phase timeout', err);
            }
        },
    },
});