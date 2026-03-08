/**
 * Normalized Tournament Types
 * Application-level types derived from API responses
 */

import type { TournamentState } from './replay-api'

export interface TournamentPlayer {
  id: number
  username: string
  chips: number
  avatar: string
  country: string
  position?: number
  isEliminated: boolean
}

export interface TournamentWinner {
  playerId?: number
  username: string
  position: number
  prizes: string[]
}

export interface TournamentTable {
  id: number
  players: TournamentPlayer[]
  stackMin: number
  stackMax: number
}

export interface BlindLevel {
  level: number
  smallBlind: number
  bigBlind: number
  ante: number
  durationMinutes: number
}

export interface CurrentBlinds {
  level: number
  smallBlind: number
  bigBlind: number
  ante: number
  nextLevelAt?: Date
}

export interface Tournament {
  id: number
  name: string
  state: TournamentState
  url: string

  startTime: Date
  endTime?: Date
  registrationTime: Date

  totalPlayers: number
  playersRemaining: number
  startingChips: number

  buyIn: number
  fee: number
  prizePool: number

  tables: TournamentTable[]
  players: TournamentPlayer[]
  winners: TournamentWinner[]

  currentBlinds?: CurrentBlinds
  blindLevels: BlindLevel[]

  isFast: boolean
  tableSize: number
  gameType: string
  gameLimit: string
}

export interface LiveTournamentData {
  tournament: Tournament
  lastUpdated: Date
  isPolling: boolean
}
