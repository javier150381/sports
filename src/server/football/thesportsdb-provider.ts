import { z } from 'zod'

const sportsDbEventSchema = z.object({
  idEvent: z.string(),
  strEvent: z.string().nullable(),
  strHomeTeam: z.string().nullable(),
  strAwayTeam: z.string().nullable(),
  strTimestamp: z.string().nullable(),
  dateEvent: z.string().nullable(),
  strTime: z.string().nullable(),
  strVenue: z.string().nullable(),
  strLeague: z.string().nullable(),
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
  startsAt: string | null
  venue: string | null
  league: string | null
  homeScore: number | null
  awayScore: number | null
  status: string | null
}

function getFootballApiBaseUrl() {
  return process.env.FOOTBALL_API_BASE_URL?.replace(/\/$/, '') ?? null
}

function getEventStart(event: z.infer<typeof sportsDbEventSchema>) {
  if (event.strTimestamp) {
    return event.strTimestamp
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
        startsAt: getEventStart(event),
        venue: event.strVenue,
        league: event.strLeague,
        homeScore: parseScore(event.intHomeScore),
        awayScore: parseScore(event.intAwayScore),
        status: event.strStatus,
      }),
    )
  } catch {
    return []
  }
}
