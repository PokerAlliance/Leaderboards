/**
 * ReplayPoker API Response Types
 * Based on actual API responses from casino.org/replaypoker
 */

export type TournamentState = 'announced' | 'registering' | 'running' | 'finished'

export interface ApiPlayer {
  id: number
  username: string
  chips?: number
  bounty?: number
  url: string
  avatar: string
  country: string
}

export interface ApiSeat extends ApiPlayer {
  chips?: number
  bounty?: number
}

export interface ApiWinner {
  username: string
  prizes: string[]
  position: number
}

export interface ApiTablePlayer {
  id: number
  username: string
  chips: number
  url: string
  avatar: string
  country: string
}

export interface ApiTable {
  id: number
  stacks: {
    max: number
    min: number
  }
  players: ApiTablePlayer[]
  url: string
  server_version: number
}

export interface ApiBlindLevel {
  level: number | null
  small: number | null
  big: number | null
  minutes?: number
  ante?: number | null
}

export interface ApiPrizes {
  chips: number
  guarantee?: number
  bounty?: number
  tickets: Record<string, unknown>
  distribution: string[]
}

export interface ApiBountyWinner {
  username: string
  prizes: string[]
}

export interface ApiBuyIns {
  chips: number
  fee: number
  tickets: string[]
  rebuy: boolean
  level: string
}

export interface ApiGame {
  name: string
  variation: string
  limit: string
}

export interface ApiBlinds {
  current: {
    level: number
    small: number
    big: number
    ante: number
  }
  next?: {
    level: number
    small: number
    big: number
    time: string
    ante: number
  }
}

export interface ApiStacks {
  min: number
  max: number
  avg: number
}

export interface ApiTimers {
  unregistrationClosed: number
  startingPeriod: number
  lateRegistration: number
}

export interface ApiUserSeat {
  id: number
  avatar: string
  country: string
}

export interface ApiPromotion {
  name: string
  url: string
}

export interface ApiTournamentResponse {
  id: number
  name: string
  state: TournamentState
  url: string
  color: string
  prizes: ApiPrizes
  format: string
  type: 'mtt' | 'league' | 'sng'
  description: string
  promotions?: ApiPromotion[]
  rebuy: unknown | null
  server_version: number
  hide_unregister_option: boolean
  password: boolean
  tableSeats: number
  userSelectorId: number | null
  playersIds: number[]
  playersLeftIds?: number[]
  startingChips: number
  fast: boolean
  template: number
  master_template: number
  start: string
  end?: string
  registration: string
  buyIns: ApiBuyIns
  userSeats: ApiUserSeat[]
  timers: ApiTimers
  game: ApiGame
  blinds?: ApiBlinds
  stacks?: ApiStacks
  tables: ApiTable[]
  seats: ApiSeat[]
  winners?: ApiWinner[]
  bounty_winners?: ApiBountyWinner[]
  blindLevels: ApiBlindLevel[]
  pageTitle: string
  messages: unknown[]
  user?: {
    id: number
    isAdmin: boolean
  }
}

export interface ApiLeagueTournament {
  id: number
  name: string
  state: TournamentState
  url: string
  color: string
  prizes: ApiPrizes
  format: string
  type: string
  description: string
  rebuy: unknown | null
  server_version: number
  hide_unregister_option: boolean
  password: boolean
  tableSeats: number
  userSelectorId: number | null
  playersIds: number[]
  startingChips: number
  fast: boolean
  template: number
  master_template: number
  start: string
  registration: string
  buyIns: ApiBuyIns
  userSeats: ApiUserSeat[]
  timers: ApiTimers
  game: ApiGame
}

export interface ApiLeague {
  id: number
  name: string
  description: string
  url: string
  membersCount: number
  tournaments: ApiLeagueTournament[]
}

export interface ApiLeagueResponse {
  league: ApiLeague
}
