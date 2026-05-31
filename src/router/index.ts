import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import { useAuth } from '@/composables'
import { useDonksStore } from '@/composables/useDonksStore'
import { getCurrentDonksQuarter } from '@/config/donks'
import { useMuckersStore } from '@/composables/useMuckersStore'
import { getCurrentMuckersQuarter } from '@/config/muckers'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    donksRoute?: boolean
    muckersRoute?: boolean
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

  // Donks League
  {
    path: '/league/donks',
    name: 'donks-home',
    component: () => import('@/views/leagues/donks/DonksHomeView.vue'),
    meta: { donksRoute: true },
  },
  {
    path: '/league/donks/holdem',
    name: 'donks-holdem',
    component: () => import('@/views/leagues/donks/DonksHoldemView.vue'),
    meta: { donksRoute: true },
  },
  {
    path: '/league/donks/omaha',
    name: 'donks-omaha',
    component: () => import('@/views/leagues/donks/DonksOmahaView.vue'),
    meta: { donksRoute: true },
  },
  {
    path: '/league/donks/cup/:cupSlug',
    name: 'donks-cup',
    component: () => import('@/views/leagues/donks/DonksCupView.vue'),
    props: true,
    meta: { donksRoute: true },
  },

  // Muckers League — parent layout wraps Vanta.js background across all sub-routes
  {
    path: '/league/muckers',
    component: () => import('@/views/leagues/muckers/MuckersLayout.vue'),
    children: [
      {
        path: '',
        name: 'muckers-home',
        component: () => import('@/views/leagues/muckers/MuckersHomeView.vue'),
      },
      {
        path: 'standings',
        name: 'muckers-standings',
        component: () => import('@/views/leagues/muckers/MuckersLeagueView.vue'),
        meta: { muckersRoute: true },
      },
      {
        path: 'players',
        name: 'muckers-players',
        component: () => import('@/views/leagues/muckers/MuckersPlayerStandingsView.vue'),
        meta: { muckersRoute: true },
      },
      {
        path: 'teams',
        name: 'muckers-teams',
        component: () => import('@/views/leagues/muckers/MuckersTeamsView.vue'),
        meta: { muckersRoute: true },
      },
    ],
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
    path: '/poc/sheets-api',
    name: 'sheets-api-poc',
    component: () => import('@/views/SheetsApiPoc.vue'),
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
  // Auth guard
  if (to.meta.requiresAuth && !authInitialized) {
    const { initialize } = useAuth()
    await initialize()
    authInitialized = true
  }

  // Donks guard: kick off data load when entering any Donks route
  // The store will no-op if the current quarter is already cached.
  if (to.meta.donksRoute) {
    const store = useDonksStore()
    if (!store.loadedQuarter.value) {
      // Fire-and-forget: the loading gate component in each Donks view watches
      // store.isLoading to display the animated loading screen.
      store.loadQuarter(getCurrentDonksQuarter()).catch((err) => {
        console.error('[router] Donks data load failed:', err)
      })
    }
  }

  // Muckers guard: kick off data load when entering any Muckers route
  if (to.meta.muckersRoute) {
    const store = useMuckersStore()
    if (!store.loadedQuarter.value) {
      store.loadQuarter(getCurrentMuckersQuarter()).catch((err) => {
        console.error('[router] Muckers data load failed:', err)
      })
    }
  }

  next()
})
