<template>
  <div id="app">
    <header>
      <nav class="nav-bar">
        <router-link to="/" class="nav-link">← Lobby</router-link>
      </nav>
    </header>
    
    <main class="content">
      <RouterView /> 
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
// CRÍTICO: Importar o store aqui, mesmo que não seja usado diretamente no template,
// garante que o Pinia está ativo e pronto para ser injetado nas Views.
import { useBlackjackStore } from './stores/blackjackStore'; 

const store = useBlackjackStore();
</script>

<style>
/* Estilos globais (opcional) */
body { font-family: Arial, sans-serif; margin: 0; background-color: #f4f4f4; }
.nav-bar { background-color: #333; padding: 10px 20px; }
.nav-link { color: white; text-decoration: none; }
.content { padding: 20px; }
</style>