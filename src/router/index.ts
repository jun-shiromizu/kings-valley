import { createRouter, createWebHashHistory } from 'vue-router'
import GameView from '../views/GameView.vue'
import TopView from '../views/TopView.vue'

export const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'top', component: TopView },
    { path: '/game', name: 'game', component: GameView },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})
