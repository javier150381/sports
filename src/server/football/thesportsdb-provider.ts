import { z } from 'zod'

const sportsDbEventSchema = z.object({
  idEvent: z.string(),
  idLeague: z.string().nullable(),
  idHomeTeam: z.string().nullable(),
  idAwayTeam: z.string().nullable(),
  strEvent: z.string().nullable(),
  strHomeTeam: z.string().nullable(),
  strAwayTeam: z.string().nullable(),
  strHomeTeamBadge: z.string().nullable(),
  strAwayTeamBadge: z.string().nullable(),
  strTimestamp: z.string().nullable(),
  dateEvent: z.string().nullable(),
  dateEventLocal: z.string().nullable(),
  strTime: z.string().nullable(),
  strTimeLocal: z.string().nullable(),
  strVenue: z.string().nullable(),
  strLeague: z.string().nullable(),
  strSeason: z.string().nullable(),
  intRound: z.string().nullable(),
  strGroup: z.string().nullable(),
  intHomeScore: z.string().nullable(),
  intAwayScore: z.string().nullable(),
  strStatus: z.string().nullable(),
})

const sportsDbEventsResponseSchema = z.object({
  events: z.array(sportsDbEventSchema).nullable().optional(),
  results: z.array(sportsDbEventSchema).nullable().optional(),
})

const unknownRecordSchema = z.record(z.string(), z.unknown())

const eventDetailsResponseSchema = z.object({
  events: z.array(unknownRecordSchema).nullable().optional(),
})

const eventResultsResponseSchema = z.object({
  eventresults: z.array(unknownRecordSchema).nullable().optional(),
  results: z.array(unknownRecordSchema).nullable().optional(),
  events: z.array(unknownRecordSchema).nullable().optional(),
})

const eventLineupResponseSchema = z.object({
  lineup: z.array(unknownRecordSchema).nullable().optional(),
})

const eventTimelineResponseSchema = z.object({
  timeline: z.array(unknownRecordSchema).nullable().optional(),
})

const eventStatsResponseSchema = z.object({
  eventstats: z.array(unknownRecordSchema).nullable().optional(),
})

const eventTvResponseSchema = z.object({
  tvevent: z.array(unknownRecordSchema).nullable().optional(),
})

const eventHighlightsResponseSchema = z.object({
  tvhighlights: z.array(unknownRecordSchema).nullable().optional(),
})

const leagueTableRowSchema = z.object({
  intRank: z.string().nullable(),
  strTeam: z.string().nullable(),
  intPlayed: z.string().nullable(),
  intWin: z.string().nullable(),
  intDraw: z.string().nullable(),
  intLoss: z.string().nullable(),
  intGoalDifference: z.string().nullable(),
  intPoints: z.string().nullable(),
})

const leagueTableResponseSchema = z.object({
  table: z.array(leagueTableRowSchema).nullable().optional(),
})

const teamPlayersResponseSchema = z.object({
  player: z.array(unknownRecordSchema).nullable().optional(),
})

const teamEquipmentResponseSchema = z.object({
  equipment: z.array(unknownRecordSchema).nullable().optional(),
})

export type ExternalTeamEvent = {
  id: string
  leagueExternalId: string | null
  homeTeamExternalId: string | null
  awayTeamExternalId: string | null
  title: string
  homeTeam: string | null
  awayTeam: string | null
  homeBadge: string | null
  awayBadge: string | null
  startsAt: string | null
  localDate: string | null
  localTime: string | null
  venue: string | null
  league: string | null
  season: string | null
  round: number | null
  group: string | null
  homeScore: number | null
  awayScore: number | null
  status: string | null
}

export type ExternalEventBundle = {
  details: Record<string, unknown> | null
  results: Record<string, unknown>[]
  lineup: Record<string, unknown>[]
  timeline: Record<string, unknown>[]
  stats: Record<string, unknown>[]
  tv: Record<string, unknown>[]
  highlights: Record<string, unknown>[]
}

export type ExternalLeagueTableRow = {
  rank: number | null
  team: string | null
  played: number | null
  won: number | null
  drawn: number | null
  lost: number | null
  goalDifference: number | null
  points: number | null
}

export type ExternalTeamPlayer = {
  id: string | null
  name: string | null
  position: string | null
  nationality: string | null
  image: string | null
}

export type ExternalTeamEquipment = {
  id: string | null
  season: string | null
  type: string | null
  image: string | null
}

function getFootballApiBaseUrl() {
  return process.env.FOOTBALL_API_BASE_URL?.replace(/\/$/, '') ?? null
}

function getEventStart(event: z.infer<typeof sportsDbEventSchema>) {
  if (event.strTimestamp) {
    return event.strTimestamp.endsWith('Z') ? event.strTimestamp : `${event.strTimestamp}Z`
  }

  if (event.dateEvent) {
    return event.strTime ? `${event.dateEvent}T${event.strTime}` : event.dateEvent
  }

  return null
}

function parseScore(value: string | null) {
  if (!value) {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function parseNumber(value: string | null) {
  return parseScore(value)
}

async function fetchSportsDbJson(endpoint: string, params: Record<string, string>) {
  const baseUrl = getFootballApiBaseUrl()

  if (!baseUrl) {
    return null
  }

  const url = new URL(`${baseUrl}/${endpoint}`)
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value))

  try {
    const response = await fetch(url, {
      next: { revalidate: 900 },
    })

    if (!response.ok) {
      return null
    }

    return response.json()
  } catch {
    return null
  }
}

function mapSportsDbEvents(events: z.infer<typeof sportsDbEventSchema>[]) {
  return events.map(
    (event): ExternalTeamEvent => ({
      id: event.idEvent,
      leagueExternalId: event.idLeague,
      homeTeamExternalId: event.idHomeTeam,
      awayTeamExternalId: event.idAwayTeam,
      title: event.strEvent ?? [event.strHomeTeam, event.strAwayTeam].filter(Boolean).join(' vs '),
      homeTeam: event.strHomeTeam,
      awayTeam: event.strAwayTeam,
      homeBadge: event.strHomeTeamBadge,
      awayBadge: event.strAwayTeamBadge,
      startsAt: getEventStart(event),
      localDate: event.dateEventLocal,
      localTime: event.strTimeLocal,
      venue: event.strVenue,
      league: event.strLeague,
      season: event.strSeason,
      round: parseScore(event.intRound),
      group: event.strGroup,
      homeScore: parseScore(event.intHomeScore),
      awayScore: parseScore(event.intAwayScore),
      status: event.strStatus,
    }),
  )
}

async function getExternalTeamEvents(endpoint: string, teamExternalId: string | null) {
  if (!teamExternalId || !/^\d+$/.test(teamExternalId)) {
    return []
  }

  const parsed = sportsDbEventsResponseSchema.safeParse(
    await fetchSportsDbJson(endpoint, { id: teamExternalId }),
  )

  if (!parsed.success) {
    return []
  }

  return mapSportsDbEvents(parsed.data.events ?? parsed.data.results ?? [])
}

async function getExternalEventRecords(
  endpoint: string,
  keys: string[],
  responseSchema: z.ZodType<Record<string, Record<string, unknown>[] | null | undefined>>,
  params: Record<string, string>,
) {
  const parsed = responseSchema.safeParse(await fetchSportsDbJson(endpoint, params))

  if (!parsed.success) {
    return []
  }

  for (const key of keys) {
    const records = parsed.data[key]

    if (records) {
      return records
    }
  }

  return []
}

function getHighlightDate(event: ExternalTeamEvent) {
  if (event.localDate) {
    return event.localDate
  }

  if (event.startsAt) {
    return event.startsAt.slice(0, 10)
  }

  return null
}

export async function getNextExternalTeamEvents(teamExternalId: string | null) {
  return getExternalTeamEvents('eventsnext.php', teamExternalId)
}

export async function getPreviousExternalTeamEvents(teamExternalId: string | null) {
  return getExternalTeamEvents('eventslast.php', teamExternalId)
}

export async function getExternalLeagueTable(
  leagueExternalId: string | null,
  season: string | null,
): Promise<ExternalLeagueTableRow[]> {
  if (!leagueExternalId || !season || !/^\d+$/.test(leagueExternalId)) {
    return []
  }

  const parsed = leagueTableResponseSchema.safeParse(
    await fetchSportsDbJson('lookuptable.php', { l: leagueExternalId, s: season }),
  )

  if (!parsed.success) {
    return []
  }

  return (parsed.data.table ?? []).map((row) => ({
    rank: parseNumber(row.intRank),
    team: row.strTeam,
    played: parseNumber(row.intPlayed),
    won: parseNumber(row.intWin),
    drawn: parseNumber(row.intDraw),
    lost: parseNumber(row.intLoss),
    goalDifference: parseNumber(row.intGoalDifference),
    points: parseNumber(row.intPoints),
  }))
}

function getRecordString(record: Record<string, unknown>, key: string) {
  const value = record[key]
  return typeof value === 'string' && value.trim().length > 0 ? value : null
}

export async function getExternalTeamPlayers(
  teamExternalId: string | null,
): Promise<ExternalTeamPlayer[]> {
  if (!teamExternalId || !/^\d+$/.test(teamExternalId)) {
    return []
  }

  const parsed = teamPlayersResponseSchema.safeParse(
    await fetchSportsDbJson('lookup_all_players.php', { id: teamExternalId }),
  )

  if (!parsed.success) {
    return []
  }

  return (parsed.data.player ?? []).map((player) => ({
    id: getRecordString(player, 'idPlayer'),
    name: getRecordString(player, 'strPlayer'),
    position: getRecordString(player, 'strPosition'),
    nationality: getRecordString(player, 'strNationality'),
    image:
      getRecordString(player, 'strCutout') ??
      getRecordString(player, 'strThumb') ??
      getRecordString(player, 'strRender'),
  }))
}

export async function getExternalTeamEquipment(
  teamExternalId: string | null,
): Promise<ExternalTeamEquipment[]> {
  if (!teamExternalId || !/^\d+$/.test(teamExternalId)) {
    return []
  }

  const parsed = teamEquipmentResponseSchema.safeParse(
    await fetchSportsDbJson('lookupequipment.php', { id: teamExternalId }),
  )

  if (!parsed.success) {
    return []
  }

  return (parsed.data.equipment ?? []).map((equipment) => ({
    id: getRecordString(equipment, 'idEquipment'),
    season: getRecordString(equipment, 'strSeason'),
    type: getRecordString(equipment, 'strType'),
    image: getRecordString(equipment, 'strEquipment'),
  }))
}

export async function getExternalEventBundle(event: ExternalTeamEvent): Promise<ExternalEventBundle> {
  const [
    detailsResponse,
    eventResults,
    lineup,
    timeline,
    stats,
    tv,
    highlights,
  ] = await Promise.all([
    fetchSportsDbJson('lookupevent.php', { id: event.id }),
    getExternalEventRecords('eventresults.php', ['eventresults', 'results', 'events'], eventResultsResponseSchema, {
      id: event.id,
    }),
    getExternalEventRecords('lookuplineup.php', ['lineup'], eventLineupResponseSchema, {
      id: event.id,
    }),
    getExternalEventRecords('lookuptimeline.php', ['timeline'], eventTimelineResponseSchema, {
      id: event.id,
    }),
    getExternalEventRecords('lookupeventstats.php', ['eventstats'], eventStatsResponseSchema, {
      id: event.id,
    }),
    getExternalEventRecords('lookuptv.php', ['tvevent'], eventTvResponseSchema, { id: event.id }),
    getHighlightDate(event) && event.leagueExternalId
      ? getExternalEventRecords(
          'eventshighlights.php',
          ['tvhighlights'],
          eventHighlightsResponseSchema,
          { d: getHighlightDate(event) as string, l: event.leagueExternalId },
        )
      : Promise.resolve([]),
  ])

  const detailsParsed = eventDetailsResponseSchema.safeParse(detailsResponse)
  const details = detailsParsed.success ? (detailsParsed.data.events?.[0] ?? null) : null

  return {
    details,
    results: eventResults,
    lineup,
    timeline,
    stats,
    tv,
    highlights,
  }
}
