export interface MockTeam {
  id: string
  name: string
  slug: string
  totalPoints: number
  monthPoints: number
  playerCount: number
}

export interface MockPlayer {
  id: number
  username: string
  avatar?: string
  teamId: string | null
  teamName: string | null
  teamSlug: string | null
  finishPosition: number
  pointsEarned: number
  chips?: number
}

export interface MockTournament {
  id: number
  name: string
  state: 'finished' | 'running' | 'registering'
  start: string
  end?: string
  leagueSlug: string
  leagueName: string
  totalPlayers: number
  teams: MockTeam[]
  players: MockPlayer[]
  unassignedPlayers: MockPlayer[]
}

const DREAMWEAVER_POINTS = [21, 18, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]

function getPoints(position: number): number {
  if (position < 1 || position > 18) return 0
  return DREAMWEAVER_POINTS[position - 1] ?? 0
}

export const mockDreamweaverGame: MockTournament = {
  id: 8093458,
  name: 'Monday Dream Team',
  state: 'finished',
  start: '2026-03-02T21:30:00.000-05:00',
  end: '2026-03-02T23:34:02.000-05:00',
  leagueSlug: 'dreamweaver',
  leagueName: 'Dream Weaver Team',
  totalPlayers: 22,
  teams: [
    {
      id: 'pirates',
      name: 'Pirates',
      slug: 'pirates',
      totalPoints: 45,
      monthPoints: 4,
      playerCount: 5,
    },
    {
      id: 'renegades',
      name: 'Renegades',
      slug: 'renegades',
      totalPoints: 38,
      monthPoints: 3,
      playerCount: 6,
    },
    {
      id: 'con',
      name: 'Con Artist',
      slug: 'con',
      totalPoints: 32,
      monthPoints: 2,
      playerCount: 5,
    },
    {
      id: 'outlaws',
      name: 'Outlaws',
      slug: 'outlaws',
      totalPoints: 28,
      monthPoints: 1,
      playerCount: 4,
    },
  ],
  players: [
    {
      id: 3687499,
      username: 'genio02',
      teamId: 'pirates',
      teamName: 'Pirates',
      teamSlug: 'pirates',
      finishPosition: 1,
      pointsEarned: getPoints(1),
    },
    {
      id: 3687502,
      username: 'bea-ganadora7',
      teamId: 'renegades',
      teamName: 'Renegades',
      teamSlug: 'renegades',
      finishPosition: 2,
      pointsEarned: getPoints(2),
    },
    {
      id: 3687503,
      username: 'vaskok',
      teamId: 'renegades',
      teamName: 'Renegades',
      teamSlug: 'renegades',
      finishPosition: 3,
      pointsEarned: getPoints(3),
    },
    {
      id: 3687504,
      username: 'mrzick',
      teamId: 'con',
      teamName: 'Con Artist',
      teamSlug: 'con',
      finishPosition: 4,
      pointsEarned: getPoints(4),
    },
    {
      id: 3687505,
      username: 'WS66',
      teamId: 'con',
      teamName: 'Con Artist',
      teamSlug: 'con',
      finishPosition: 5,
      pointsEarned: getPoints(5),
    },
    {
      id: 3687506,
      username: 'SilverFox99',
      teamId: 'pirates',
      teamName: 'Pirates',
      teamSlug: 'pirates',
      finishPosition: 6,
      pointsEarned: getPoints(6),
    },
    {
      id: 3687507,
      username: 'PokerProX',
      teamId: 'outlaws',
      teamName: 'Outlaws',
      teamSlug: 'outlaws',
      finishPosition: 7,
      pointsEarned: getPoints(7),
    },
    {
      id: 3687508,
      username: 'LuckyAce22',
      teamId: 'renegades',
      teamName: 'Renegades',
      teamSlug: 'renegades',
      finishPosition: 8,
      pointsEarned: getPoints(8),
    },
    {
      id: 3687509,
      username: 'CardShark88',
      teamId: 'pirates',
      teamName: 'Pirates',
      teamSlug: 'pirates',
      finishPosition: 9,
      pointsEarned: getPoints(9),
    },
    {
      id: 3687510,
      username: 'NightOwl777',
      teamId: 'con',
      teamName: 'Con Artist',
      teamSlug: 'con',
      finishPosition: 10,
      pointsEarned: getPoints(10),
    },
    {
      id: 3687511,
      username: 'RiverRat55',
      teamId: 'outlaws',
      teamName: 'Outlaws',
      teamSlug: 'outlaws',
      finishPosition: 11,
      pointsEarned: getPoints(11),
    },
    {
      id: 3687512,
      username: 'BluffMaster',
      teamId: 'renegades',
      teamName: 'Renegades',
      teamSlug: 'renegades',
      finishPosition: 12,
      pointsEarned: getPoints(12),
    },
    {
      id: 3687513,
      username: 'StackKing',
      teamId: 'pirates',
      teamName: 'Pirates',
      teamSlug: 'pirates',
      finishPosition: 13,
      pointsEarned: getPoints(13),
    },
    {
      id: 3687514,
      username: 'FeltWarrior',
      teamId: 'con',
      teamName: 'Con Artist',
      teamSlug: 'con',
      finishPosition: 14,
      pointsEarned: getPoints(14),
    },
    {
      id: 3687515,
      username: 'AllInAndy',
      teamId: 'outlaws',
      teamName: 'Outlaws',
      teamSlug: 'outlaws',
      finishPosition: 15,
      pointsEarned: getPoints(15),
    },
    {
      id: 3687516,
      username: 'PocketRockets',
      teamId: 'renegades',
      teamName: 'Renegades',
      teamSlug: 'renegades',
      finishPosition: 16,
      pointsEarned: getPoints(16),
    },
    {
      id: 3687517,
      username: 'ChipLeader',
      teamId: 'pirates',
      teamName: 'Pirates',
      teamSlug: 'pirates',
      finishPosition: 17,
      pointsEarned: getPoints(17),
    },
    {
      id: 3687518,
      username: 'DealersDream',
      teamId: 'con',
      teamName: 'Con Artist',
      teamSlug: 'con',
      finishPosition: 18,
      pointsEarned: getPoints(18),
    },
  ],
  unassignedPlayers: [
    {
      id: 3687519,
      username: 'newplayer123',
      teamId: null,
      teamName: null,
      teamSlug: null,
      finishPosition: 19,
      pointsEarned: 0,
    },
    {
      id: 3687520,
      username: 'guestplayer',
      teamId: null,
      teamName: null,
      teamSlug: null,
      finishPosition: 20,
      pointsEarned: 0,
    },
    {
      id: 3687521,
      username: 'visitor2026',
      teamId: null,
      teamName: null,
      teamSlug: null,
      finishPosition: 21,
      pointsEarned: 0,
    },
    {
      id: 3687522,
      username: 'observer99',
      teamId: null,
      teamName: null,
      teamSlug: null,
      finishPosition: 22,
      pointsEarned: 0,
    },
  ],
}

export const mockLiveDreamweaverGame: MockTournament = {
  id: 8093500,
  name: 'Wednesday Dream Team',
  state: 'running',
  start: '2026-03-04T21:30:00.000-05:00',
  leagueSlug: 'dreamweaver',
  leagueName: 'Dream Weaver Team',
  totalPlayers: 20,
  teams: [
    {
      id: 'con',
      name: 'Con Artist',
      slug: 'con',
      totalPoints: 52,
      monthPoints: 0,
      playerCount: 5,
    },
    {
      id: 'pirates',
      name: 'Pirates',
      slug: 'pirates',
      totalPoints: 48,
      monthPoints: 0,
      playerCount: 5,
    },
    {
      id: 'renegades',
      name: 'Renegades',
      slug: 'renegades',
      totalPoints: 41,
      monthPoints: 0,
      playerCount: 5,
    },
    {
      id: 'outlaws',
      name: 'Outlaws',
      slug: 'outlaws',
      totalPoints: 35,
      monthPoints: 0,
      playerCount: 5,
    },
  ],
  players: [
    {
      id: 3687504,
      username: 'mrzick',
      teamId: 'con',
      teamName: 'Con Artist',
      teamSlug: 'con',
      finishPosition: 1,
      pointsEarned: 0,
      chips: 245000,
    },
    {
      id: 3687499,
      username: 'genio02',
      teamId: 'pirates',
      teamName: 'Pirates',
      teamSlug: 'pirates',
      finishPosition: 2,
      pointsEarned: 0,
      chips: 198000,
    },
    {
      id: 3687502,
      username: 'bea-ganadora7',
      teamId: 'renegades',
      teamName: 'Renegades',
      teamSlug: 'renegades',
      finishPosition: 3,
      pointsEarned: 0,
      chips: 156000,
    },
    {
      id: 3687505,
      username: 'WS66',
      teamId: 'con',
      teamName: 'Con Artist',
      teamSlug: 'con',
      finishPosition: 4,
      pointsEarned: 0,
      chips: 142000,
    },
    {
      id: 3687507,
      username: 'PokerProX',
      teamId: 'outlaws',
      teamName: 'Outlaws',
      teamSlug: 'outlaws',
      finishPosition: 5,
      pointsEarned: 0,
      chips: 128000,
    },
    {
      id: 3687503,
      username: 'vaskok',
      teamId: 'renegades',
      teamName: 'Renegades',
      teamSlug: 'renegades',
      finishPosition: 6,
      pointsEarned: 0,
      chips: 115000,
    },
    {
      id: 3687506,
      username: 'SilverFox99',
      teamId: 'pirates',
      teamName: 'Pirates',
      teamSlug: 'pirates',
      finishPosition: 7,
      pointsEarned: 0,
      chips: 98000,
    },
    {
      id: 3687511,
      username: 'RiverRat55',
      teamId: 'outlaws',
      teamName: 'Outlaws',
      teamSlug: 'outlaws',
      finishPosition: 8,
      pointsEarned: 0,
      chips: 87000,
    },
    {
      id: 3687508,
      username: 'LuckyAce22',
      teamId: 'renegades',
      teamName: 'Renegades',
      teamSlug: 'renegades',
      finishPosition: 9,
      pointsEarned: 0,
      chips: 72000,
    },
    {
      id: 3687509,
      username: 'CardShark88',
      teamId: 'pirates',
      teamName: 'Pirates',
      teamSlug: 'pirates',
      finishPosition: 10,
      pointsEarned: 0,
      chips: 65000,
    },
  ],
  unassignedPlayers: [],
}

export interface MockLeague {
  slug: string
  name: string
  description: string
  teamCount: number
  format: string
  isActive?: boolean
  isNew?: boolean
  themeColor?: string
  nextGame?: {
    name: string
    date: string
  }
}

export const mockLeagues: MockLeague[] = [
  {
    slug: 'muckers',
    name: 'Barnyard Muckers',
    description: 'Team-based SNG league with 9 teams competing across 3 weekly tables for quarterly supremacy.',
    teamCount: 9,
    format: 'Team SNG',
    isActive: true,
    isNew: true,
    themeColor: '#00B4D8',
  },
  {
    slug: 'donks',
    name: "Badonk's Donks League",
    description: 'The toughest private poker tournaments on ReplayPoker. 6 weekly cups, 8 leaderboards, quarterly standings.',
    teamCount: 0,
    format: 'Individual MTT',
    isActive: true,
    isNew: true,
    themeColor: '#c9a227',
  },
  
  {
    slug: 'anarchy',
    name: 'Anarchy',
    description: 'Where silence is broken and strategy is shared. Bounty MTT with open table discussion.',
    teamCount: 3,
    format: 'Bounty MTT',
    isActive: true,
    isNew: true,
    themeColor: '#ef4444',
    nextGame: {
      name: 'Wednesday Anarchy',
      date: '2026-03-11T13:00:00-05:00',
    },
  },
 
  {
    slug: 'dreamweaver',
    name: 'Dreamweavers',
    description: 'Team poker league with 4 legendary teams competing weekly.',
    teamCount: 4,
    format: 'MTT',
    isActive: false,
    themeColor: '#3b82f6',
    nextGame: {
      name: 'Monday Dream Team',
      date: '2026-03-09T21:30:00-05:00',
    },
  },
  {
    slug: 'tpp',
    name: 'Team Play Poker',
    description: 'Team of the Week battles with 7 teams competing for quarterly glory.',
    teamCount: 7,
    format: 'MTT',
    isActive: false,
    themeColor: '#10b981',
    nextGame: {
      name: 'Team of Week',
      date: '2026-03-10T20:00:00-05:00',
    },
  },
  {
    slug: 'fpl',
    name: 'FPL Lightning Pairs',
    description: 'Fast-paced 6-max SNG action across 4 tables with paired teams.',
    teamCount: 3,
    format: '6-max SNG',
    isActive: false,
    themeColor: '#f59e0b',
    nextGame: {
      name: 'Lightning Pairs',
      date: '2026-03-06T20:00:00-05:00',
    },
  },
]
