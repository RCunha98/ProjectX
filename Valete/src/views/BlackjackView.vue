<template>
  <div class="blackjack-view">
    <h1>Mesa {{ roomId }}</h1>
    <p>
      Fase: {{ store.gameState.phase }}
      <span v-if="timeLeft !== null" class="phase-timer"> — Tempo restante: {{ timeLeft }}s</span>
    </p>

    <div v-if="store.error" class="error">{{ store.error }}</div>
    <div v-if="!store.gameState.roomId" class="loading-state">
      Carregando estado do jogo...
    </div>

    <div v-else>
      <div class="dealer-area">
        <h3>Dealer</h3>
        <div class="hand">
          <span v-for="(card, index) in store.gameState.dealerHand" :key="index" class="card">
            {{ card.rank }}{{ card.suit }}
          </span>
        </div>
        <p v-if="visibleDealerScore !== null">Score visível: {{ visibleDealerScore }}</p>
      </div>
      
      <!-- show local player's cards prominently during PLAYER_TURN -->
      <div v-if="store.gameState.phase === 'PLAYER_TURN' && localPlayer" class="local-player-area">
        <h3>Suas cartas — {{ localPlayer.name }}</h3>
        <div class="hand">
          <span v-for="(card, idx) in localPlayer.hand" :key="idx" class="card">{{ card.rank }}{{ card.suit }}</span>
        </div>
        <p>Score: {{ localPlayer.score }}</p>
      </div>
       
       <div class="players-area">
        <div v-for="player in store.gameState.players" :key="player.id" class="player-slot">
          
          <h3 :class="{'is-turn': player.isTurn}">{{ player.name }} (Score: {{ player.score }})</h3>
          <p>
            <template v-if="store.gameState.phase === 'BETTING' && store.clientId === player.id">
              <label v-if="player.currentBet === 0">
                Aposta: $
                <input type="number" v-model.number="betInputs[player.id]" :min="MIN_BET" :max="player.chips" step="1" />
              </label>
              <button v-if="player.currentBet === 0" @click="submitBet(player)">Bet</button>
              <template v-else>
                Aposta: ${{ player.currentBet }} (confirmada)
              </template>
              <span class="chips">| Fichas: ${{ player.chips }}</span>
            </template>
            <template v-else>
              Aposta: ${{ player.currentBet }} | Fichas: ${{ player.chips }}
            </template>
          </p>
          
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
import { defineProps, onMounted, onUnmounted, ref, watch, computed } from 'vue';
import { useBlackjackStore } from '../stores/blackjackStore'; 

const props = defineProps<{ roomId: string }>();
const store = useBlackjackStore();

const PHASE_DURATION = 15; // seconds
const timeLeft = ref<number | null>(null);
let timerId: number | null = null;
const MIN_BET = 10; // keep in sync with server DEFAULT_RULES.minBet

// bet inputs keyed by player id
const betInputs = ref<Record<string, number>>({});

// derived values
const localPlayer = computed(() => {
  return (store.gameState.players || []).find((p: any) => p.id === store.clientId) as any | undefined;
});

function computeScoreFromCards(cards: any[]): number | null {
  if (!cards || cards.length === 0) return null;
  // consider only visible cards (card.rank !== '?')
  const visible = cards.filter((c: any) => c && c.rank && c.rank !== '?');
  if (visible.length === 0) return null;
  let total = 0;
  let aces = 0;
  for (const c of visible) {
    const r = c.rank;
    if (r === 'A') { total += 11; aces += 1; }
    else if (['K','Q','J'].includes(r)) total += 10;
    else {
      const n = parseInt(r, 10);
      total += isNaN(n) ? 0 : n;
    }
  }
  while (total > 21 && aces > 0) { total -= 10; aces -= 1; }
  return total;
}

const visibleDealerScore = computed(() => {
  const cards = store.gameState.dealerHand || [];
  return computeScoreFromCards(cards);
});

function clearTimer() {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
  timeLeft.value = null;
}

function startTimer() {
  clearTimer();
  // only start if this view is for the same room as the store
  if (!props.roomId || store.gameState.roomId !== props.roomId) return;
  // prefer server-provided remaining time when available
  const serverRem = (store.gameState as any).timerRemaining;
  timeLeft.value = typeof serverRem === 'number' ? serverRem : PHASE_DURATION;
  timerId = window.setInterval(() => {
    if (timeLeft.value === null) return;
    timeLeft.value = Math.max(0, timeLeft.value - 1);
    if (timeLeft.value === 0) {
      clearTimer();
      // notify backend that the phase timed out for this room (fallback)
      store.notifyPhaseTimeout(props.roomId);
    }
  }, 1000);
}

onMounted(() => {
  console.log('[BlackjackView] mounted — roomId:', props.roomId);
  console.log('[BlackjackView] initial gameState:', JSON.stringify(store.gameState,null,2));
  console.log('[BlackjackView] initial players:', JSON.stringify(store.gameState.players,null,2));
  // start timer for the current phase (if relevant)
  startTimer();
});

onUnmounted(() => {
  clearTimer();
});

// Reset timer when the local route roomId prop changes
watch(() => props.roomId, (id, prev) => {
  console.log('[BlackjackView] prop roomId changed:', { prev, id });
  startTimer();
});

// Reset timer when the store phase changes for this room
watch(() => store.gameState.phase, (phase, prev) => {
  console.log('[BlackjackView] phase changed:', { prev, phase });
  // only act if this view is for the same room
  if (store.gameState.roomId === props.roomId) {
    startTimer();
  } else {
    clearTimer();
  }
});

// keep existing deep watches for debugging if needed
watch(() => store.gameState, (newState, oldState) => {
  console.log('[BlackjackView] gameState changed:', { oldState, newState });
}, { deep: true });

watch(() => store.gameState.players, (players) => {
  console.log('[BlackjackView] players updated:', players);
}, { deep: true });

// keep betInputs in sync with server state
watch(() => store.gameState.players, (players) => {
  if (!players) return;
  players.forEach((p: any) => {
    if (betInputs.value[p.id] === undefined) {
      betInputs.value[p.id] = p.currentBet || 0;
    }
  });
}, { deep: true });

function submitBet(player: any) {
  const amt = Math.max(0, Math.floor(betInputs.value[player.id] || 0));

  if (amt < MIN_BET) {
    store.error = `Aposta mínima é $${MIN_BET}`;
    return;
  }
  if (amt > player.chips) {
    store.error = 'Aposta não pode exceder as fichas disponíveis';
    betInputs.value[player.id] = player.chips;
    return;
  }
  // clear any previous error
  store.error = '';
  if (!props.roomId) return;
  store.placeBet(props.roomId, amt);
}

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
.phase-timer { font-size: 0.9em; color: red; }
.error { color: red; font-weight: bold; margin: 10px 0; }
.local-player-area { margin-top: 20px; padding: 15px; border: 2px solid green; border-radius: 8px; background-color: #f9fff9; }
</style>