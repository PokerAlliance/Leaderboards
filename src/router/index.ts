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

  // Dreamweaver League - Full Implementation
  {
    path: '/league/dreamweaver',
    name: 'dreamweaver-league',
    component: () => import('@/views/leagues/dreamweaver/DreamweaverLeagueView.vue'),
  },
  {
    path: '/league/dreamweaver/game/:tournamentId',
    name: 'dreamweaver-game',
    component: () => import('@/views/leagues/dreamweaver/DreamweaverGameView.vue'),
    props: true,
  },

  // Anarchy League - Full Implementation
  {
    path: '/league/anarchy',
    name: 'anarchy-league',
    component: () => import('@/views/leagues/anarchy/AnarchyLeagueView.vue'),
  },
  {
    path: '/league/anarchy/game/:tournamentId',
    name: 'anarchy-game',
    component: () => import('@/views/leagues/anarchy/AnarchyGameView.vue'),
    props: true,
  },

  // TPP League - Coming Soon
  {
    path: '/league/tpp',
    name: 'tpp-league',
    component: () => import('@/views/leagues/tpp/TPPComingSoon.vue'),
  },

  // FPL League - Coming Soon
  {
    path: '/league/fpl',
    name: 'fpl-league',
    component: () => import('@/views/leagues/fpl/FPLComingSoon.vue'),
  },

  // Generic game view (for testing with any tournament)
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
