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
            });
            blackjackSocket.on('connect', () => {
                this.isConnected = true;
            });
        },
        
        joinGame(roomId: string, playerName: string) {
            blackjackSocket.emit('blackjack:join', roomId, playerName);
        },
        
        placeBet(roomId: string, amount: number) {
             blackjackSocket.emit('blackjack:bet', roomId, amount);
        },
        
        sendAction(actionType: 'HIT' | 'STAND') {
            if (this.gameState.roomId) {
                const event: 'blackjack:hit' | 'blackjack:stand' = actionType === 'HIT' ? 'blackjack:hit' : 'blackjack:stand';
                blackjackSocket.emit(event, this.gameState.roomId);
            }
        },
    },
});