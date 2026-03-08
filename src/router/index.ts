import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
  },
  {
    path: '/league/:leagueSlug',
    name: 'league',
    component: () => import('@/views/LeagueView.vue'),
    props: true,
  },
  {
    path: '/league/:leagueSlug/game/:tournamentId',
    name: 'game',
    component: () => import('@/views/GameView.vue'),
    props: true,
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('@/views/AdminView.vue'),
  },
  {
    path: '/poc',
    name: 'poc',
    component: () => import('@/views/PocView.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
  },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
})
