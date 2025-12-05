// valete-client/src/router/index.ts

import { createRouter, createWebHistory } from 'vue-router'
import LobbyView from '../views/LobbyView.vue'
import BlackjackView from '../views/BlackjackView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'lobby',
      component: LobbyView
    },
    {
      path: '/blackjack/:roomId',
      name: 'Blackjack',
      component: () => import('../views/BlackjackView.vue')
    } 
  ]
})

export default router