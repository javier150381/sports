import { z } from 'zod'

const sportsDbEventSchema = z.object({
  idEvent: z.string(),
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
  events: z.array(sportsDbEventSchema).nullable(),
})

export type ExternalTeamEvent = {
  id: string
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

export async function getNextExternalTeamEvents(teamExternalId: string | null) {
  const baseUrl = getFootballApiBaseUrl()

  if (!baseUrl || !teamExternalId || !/^\d+$/.test(teamExternalId)) {
    return []
  }

  const url = new URL(`${baseUrl}/eventsnext.php`)
  url.searchParams.set('id', teamExternalId)

  try {
    const response = await fetch(url, {
      next: { revalidate: 900 },
    })

    if (!response.ok) {
      return []
    }

    const parsed = sportsDbEventsResponseSchema.safeParse(await response.json())

    if (!parsed.success) {
      return []
    }

    return (parsed.data.events ?? []).map(
      (event): ExternalTeamEvent => ({
        id: event.idEvent,
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
  } catch {
    return []
  }
}
