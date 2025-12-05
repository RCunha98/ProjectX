<template>
  <div class="lobby-view">
    <h2>Entrar / Criar Mesa (Blackjack)</h2>
    <div :class="store.isConnected? 'status-connected' : 'status-disconnected'">
      Status do Socket: {{ store.isConnected? 'CONECTADO' : 'AGUARDANDO CONEXÃO' }}
    </div>

    <p v-if="store.error" class="error-message">{{ store.error }}</p>

    <input type="text" v-model="playerName" placeholder="Seu Nome (Valete)">
    <input type="text" v-model="roomId" placeholder="Código da Mesa (ex: MESA001)">
    <button @click="join" :disabled="!store.isConnected">
      Entrar na Mesa
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useBlackjackStore } from '../stores/blackjackStore'; 

const store = useBlackjackStore();
const router = useRouter();

const playerName = ref('Valete-' + Math.floor(Math.random() * 100));
const roomId = ref('MESA001');

onMounted(() => {
  store.connectAndListen();
});

watch(() => store.gameState.roomId, (newRoomId) => {
  if (newRoomId) {
    router.push(`/blackjack/${newRoomId}`);
  }
});

function join() {
  if (store.isConnected && roomId.value && playerName.value) {
    store.joinGame(roomId.value, playerName.value);
  }
}
</script>

<style scoped>
.lobby-view { max-width: 400px; margin: 40px auto; text-align: center; padding: 20px; border: 1px solid #eee; border-radius: 8px; }
.status-connected { color: green; font-weight: bold; }
.status-disconnected { color: red; font-weight: bold; }
.error-message { color: darkred; background: #ffe0e0; padding: 10px; border-radius: 5px; margin-top: 10px; }
input, button { margin: 5px; padding: 10px; display: block; width: calc(100% - 10px); box-sizing: border-box; }
</style>