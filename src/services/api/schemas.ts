/**
 * Zod Schemas for ReplayPoker API Response Validation
 */

import { z } from 'zod'

export const TournamentStateSchema = z.enum(['announced', 'registering', 'running', 'finished'])

export const ApiPlayerSchema = z.object({
  id: z.number(),
  username: z.string(),
  chips: z.number().optional(),
  bounty: z.number().optional(),
  url: z.string(),
  avatar: z.string(),
  country: z.string(),
})

export const ApiSeatSchema = z.object({
  id: z.number(),
  username: z.string(),
  chips: z.number().optional(),
  bounty: z.number().optional(),
  url: z.string(),
  avatar: z.string(),
  country: z.string(),
})

export const ApiWinnerSchema = z.object({
  username: z.string(),
  prizes: z.array(z.string()),
  position: z.number(),
})

export const ApiTablePlayerSchema = z.object({
  id: z.number(),
  username: z.string(),
  chips: z.number(),
  url: z.string(),
  avatar: z.string(),
  country: z.string(),
})

export const ApiTableSchema = z.object({
  id: z.number(),
  stacks: z.object({
    max: z.number(),
    min: z.number(),
  }),
  players: z.array(ApiTablePlayerSchema),
  url: z.string(),
  server_version: z.number(),
})

export const ApiBlindLevelSchema = z.object({
  level: z.number().nullable(),
  small: z.number().nullable(),
  big: z.number().nullable(),
  minutes: z.number().optional(),
  ante: z.number().nullable().optional(),
})

export const ApiPrizesSchema = z.object({
  chips: z.number(),
  guarantee: z.number().optional(),
  tickets: z.record(z.string(), z.unknown()),
  distribution: z.array(z.string()),
})

export const ApiBuyInsSchema = z.object({
  chips: z.number(),
  fee: z.number(),
  tickets: z.array(z.string()),
  rebuy: z.boolean(),
  level: z.string(),
})

export const ApiGameSchema = z.object({
  name: z.string(),
  variation: z.string(),
  limit: z.string(),
})

export const ApiBlindsSchema = z.object({
  current: z.object({
    level: z.number(),
    small: z.number(),
    big: z.number(),
    ante: z.number(),
  }),
  next: z
    .object({
      level: z.number(),
      small: z.number(),
      big: z.number(),
      time: z.string(),
      ante: z.number(),
    })
    .optional(),
})

export const ApiStacksSchema = z.object({
  min: z.number(),
  max: z.number(),
  avg: z.number(),
})

export const ApiTimersSchema = z.object({
  unregistrationClosed: z.number(),
  startingPeriod: z.number(),
  lateRegistration: z.number(),
})

export const ApiUserSeatSchema = z.object({
  id: z.number(),
  avatar: z.string(),
  country: z.string(),
})

export const ApiPromotionSchema = z.object({
  name: z.string(),
  url: z.string(),
})

export const ApiTournamentResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  state: TournamentStateSchema,
  url: z.string(),
  color: z.string(),
  prizes: ApiPrizesSchema,
  format: z.string(),
  type: z.enum(['mtt', 'league', 'sng']),
  description: z.string(),
  promotions: z.array(ApiPromotionSchema).optional(),
  rebuy: z.unknown().nullable(),
  server_version: z.number(),
  hide_unregister_option: z.boolean(),
  password: z.boolean(),
  tableSeats: z.number(),
  userSelectorId: z.number().nullable(),
  playersIds: z.array(z.number()),
  playersLeftIds: z.array(z.number()).optional(),
  startingChips: z.number(),
  fast: z.boolean(),
  template: z.number(),
  master_template: z.number(),
  start: z.string(),
  end: z.string().optional(),
  registration: z.string(),
  buyIns: ApiBuyInsSchema,
  userSeats: z.array(ApiUserSeatSchema),
  timers: ApiTimersSchema,
  game: ApiGameSchema,
  blinds: ApiBlindsSchema.optional(),
  stacks: ApiStacksSchema.optional(),
  tables: z.array(ApiTableSchema),
  seats: z.array(ApiSeatSchema),
  winners: z.array(ApiWinnerSchema).optional(),
  bounty_winners: z.array(z.unknown()),
  blindLevels: z.array(ApiBlindLevelSchema),
  pageTitle: z.string(),
  messages: z.array(z.unknown()),
  user: z.object({
    id: z.number(),
    isAdmin: z.boolean(),
  }).optional(),
})

export const ApiLeagueTournamentSchema = z.object({
  id: z.number(),
  name: z.string(),
  state: TournamentStateSchema,
  url: z.string(),
  color: z.string(),
  prizes: ApiPrizesSchema,
  format: z.string(),
  type: z.string(),
  description: z.string(),
  rebuy: z.unknown().nullable(),
  server_version: z.number(),
  hide_unregister_option: z.boolean(),
  password: z.boolean(),
  tableSeats: z.number(),
  userSelectorId: z.number().nullable(),
  playersIds: z.array(z.number()),
  startingChips: z.number(),
  fast: z.boolean(),
  template: z.number(),
  master_template: z.number(),
  start: z.string(),
  registration: z.string(),
  buyIns: ApiBuyInsSchema,
  userSeats: z.array(ApiUserSeatSchema),
  timers: ApiTimersSchema,
  game: ApiGameSchema,
})

export const ApiLeagueSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  url: z.string(),
  membersCount: z.number(),
  tournaments: z.array(ApiLeagueTournamentSchema),
})

export const ApiLeagueResponseSchema = z.object({
  league: ApiLeagueSchema,
})

export type ValidatedTournamentResponse = z.infer<typeof ApiTournamentResponseSchema>
export type ValidatedLeagueResponse = z.infer<typeof ApiLeagueResponseSchema>
