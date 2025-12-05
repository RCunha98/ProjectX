<template>
  <div class="blackjack-view">
    <h1>Mesa {{ roomId }}</h1>
    <p>Fase: {{ store.gameState.phase }}</p>

    <div v-if="!store.gameState.roomId" class="loading-state">
      Carregando estado do jogo...
    </div>

    <div v-else>
      <div class="dealer-area">
        </div>
      
      <div class="players-area">
        <div v-for="player in store.gameState.players" :key="player.id" class="player-slot">
          
          <h3 :class="{'is-turn': player.isTurn}">{{ player.name }} (Score: {{ player.score }})</h3>
          <p>Aposta: ${{ player.currentBet }} | Fichas: ${{ player.chips }}</p>
          
          <div class="hand">
            <span v-for="(card, index) in player.hand" :key="index" class="card">
              {{ card.rank }}{{ card.suit }}
            </span>
          </div>

          <div v-if="player.isTurn && store.gameState.phase === 'PLAYER_TURN'">
            <button @click="sendAction('HIT')">HIT</button>
            <button @click="sendAction('STAND')">STAND</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';
import { useBlackjackStore } from '../stores/blackjackStore'; 
defineProps<{
  roomId: string
}>();

const store = useBlackjackStore();

function sendAction(actionType: 'HIT' | 'STAND') {
  store.sendAction(actionType);
}
</script>

<style scoped>
.blackjack-view { max-width: 1200px; margin: 0 auto; text-align: center; }
.is-turn { color: orange; font-weight: bold; }
.hand { margin-top: 10px; }
.card { display: inline-block; padding: 5px 8px; margin: 3px; border: 1px solid #333; background: white; }
.player-slot { margin-top: 20px; padding: 15px; border: 1px solid #ccc; border-radius: 8px; }
</style>