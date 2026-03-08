import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import { useAuth } from '@/composables'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
  }
}

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
    name: 'league-game',
    component: () => import('@/views/GameView.vue'),
    props: true,
  },
  {
    path: '/game/:tournamentId',
    name: 'game',
    component: () => import('@/views/GameView.vue'),
    props: (route) => ({
      tournamentId: route.params.tournamentId,
      leagueSlug: route.query.league || undefined,
    }),
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('@/views/AdminView.vue'),
    meta: { requiresAuth: true },
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

let authInitialized = false

router.beforeEach(async (to, _from, next) => {
  if (to.meta.requiresAuth && !authInitialized) {
    const { initialize } = useAuth()
    await initialize()
    authInitialized = true
  }
  next()
})
