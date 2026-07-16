'use server'

import type { Route } from 'next'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireRole } from '@/server/auth/authorization'
import {
  getExternalEventBundle,
  getNextExternalTeamEvents,
  getPreviousExternalTeamEvents,
} from '@/server/football/thesportsdb-provider'
import { getSupabaseAdminClient } from '@/server/supabase/admin'
import { createSupabaseServerClient } from '@/server/supabase/server'

type TeamRecord = {
  id: string
  name: string
  slug: string
  external_api_id: string | null
}

type SyncedFixture = {
  id: string
  home_score: number | null
  away_score: number | null
  status: string
}

const fixtureStatuses = [
  'PRE_MATCH',
  'LIVE',
  'POST_MATCH',
  'POSTPONED',
  'CANCELLED',
] as const

function adminFixturesPath(message: {
  synced?: number
  team?: string
  error?: string
}): Route {
  const params = new URLSearchParams()

  if (typeof message.synced === 'number') {
    params.set('synced', String(message.synced))
  }

  if (message.team) {
    params.set('team', message.team)
  }

  if (message.error) {
    params.set('error', message.error)
  }

  return `/admin/partidos?${params.toString()}` as Route
}

function createSlug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function mapFixtureStatus(status: string | null) {
  if (status === 'FT' || status === 'AET' || status === 'PEN') {
    return 'POST_MATCH'
  }

  if (status === 'PST') {
    return 'POSTPONED'
  }

  if (status === 'CANC') {
    return 'CANCELLED'
  }

  if (status && status !== 'NS') {
    return 'LIVE'
  }

  return 'PRE_MATCH'
}

async function findOrCreateTeam(input: {
  externalId: string | null
  name: string | null
  badge: string | null
}) {
  const supabase = await createSupabaseServerClient()

  if (!input.name) {
    throw new Error('El partido vino sin nombre de equipo.')
  }

  if (input.externalId) {
    const { data: existingByExternalId, error: externalIdError } =
      await supabase
        .from('teams')
        .select('id, name, slug, external_api_id')
        .eq('external_api_id', input.externalId)
        .maybeSingle()

    if (externalIdError) {
      throw new Error(externalIdError.message)
    }

    if (existingByExternalId) {
      return existingByExternalId as TeamRecord
    }
  }

  const slug = createSlug(input.name)

  if (!slug) {
    throw new Error(`No se pudo crear slug para ${input.name}.`)
  }

  const { data: existingBySlug, error: slugError } = await supabase
    .from('teams')
    .select('id, name, slug, external_api_id')
    .eq('slug', slug)
    .maybeSingle()

  if (slugError) {
    throw new Error(slugError.message)
  }

  if (existingBySlug) {
    if (
      input.externalId &&
      existingBySlug.external_api_id !== input.externalId
    ) {
      const { data: updatedTeam, error: updateError } = await supabase
        .from('teams')
        .update({ external_api_id: input.externalId, logo_url: input.badge })
        .eq('id', existingBySlug.id)
        .select('id, name, slug, external_api_id')
        .single()

      if (updateError) {
        throw new Error(updateError.message)
      }

      return updatedTeam as TeamRecord
    }

    return existingBySlug as TeamRecord
  }

  const { data: createdTeam, error: createError } = await supabase
    .from('teams')
    .insert({
      name: input.name,
      slug,
      short_name: input.name.slice(0, 8).toUpperCase(),
      logo_url: input.badge,
      external_api_id: input.externalId,
      active: true,
    })
    .select('id, name, slug, external_api_id')
    .single()

  if (createError) {
    throw new Error(createError.message)
  }

  return createdTeam as TeamRecord
}

async function ensureAutomatedContent(input: {
  fixtureId: string
  teamId: string
  teamName: string
  title: string
  description: string
  contentType: 'ANNOUNCEMENT' | 'HIGHLIGHT'
  externalUrl?: string | null
  imageUrl?: string | null
  createdBy: string
}) {
  const supabase = await createSupabaseServerClient()
  const { data: existing, error: existingError } = await supabase
    .from('content_posts')
    .select('id')
    .eq('fixture_id', input.fixtureId)
    .eq('content_type', input.contentType)
    .maybeSingle()

  if (existingError || existing) {
    return
  }

  await supabase.from('content_posts').insert({
    title: input.title,
    description: input.description,
    content_type: input.contentType,
    external_url: input.externalUrl,
    image_url: input.imageUrl,
    alt_text: input.title,
    team_id: input.teamId,
    fixture_id: input.fixtureId,
    status: 'PUBLISHED',
    is_featured: true,
    display_order: input.contentType === 'ANNOUNCEMENT' ? -10 : -5,
    published_at: new Date().toISOString(),
    created_by: input.createdBy,
  })
}

async function awardPredictionPoints(fixture: SyncedFixture) {
  if (
    fixture.status !== 'POST_MATCH' ||
    fixture.home_score === null ||
    fixture.away_score === null
  ) {
    return
  }

  const admin = getSupabaseAdminClient()
  const { data: predictions, error } = await admin
    .from('predictions')
    .select('id, user_id, home_score, away_score, points_awarded')
    .eq('fixture_id', fixture.id)
    .eq('points_awarded', 0)

  if (error || !predictions) {
    return
  }

  for (const prediction of predictions) {
    let points = 0

    if (
      prediction.home_score === fixture.home_score &&
      prediction.away_score === fixture.away_score
    ) {
      points = 10
    } else {
      const predictedDiff = prediction.home_score - prediction.away_score
      const realDiff = fixture.home_score - fixture.away_score

      if (Math.sign(predictedDiff) === Math.sign(realDiff)) {
        points = 3
      }
    }

    if (points === 0) {
      continue
    }

    await admin
      .from('predictions')
      .update({ points_awarded: points })
      .eq('id', prediction.id)
    const { data: profile } = await admin
      .from('profiles')
      .select('points')
      .eq('id', prediction.user_id)
      .single()

    await admin
      .from('profiles')
      .update({ points: (profile?.points ?? 0) + points })
      .eq('id', prediction.user_id)
  }
}

function getHighlightUrl(highlight: Record<string, unknown>) {
  const value = highlight.strVideo ?? highlight.strYoutube ?? highlight.strUrl
  return typeof value === 'string' ? value : null
}

async function syncFixturesForTeam(team: TeamRecord, createdBy: string) {
  const supabase = await createSupabaseServerClient()

  if (!team.external_api_id || !/^\d+$/.test(team.external_api_id)) {
    throw new Error(`${team.name} no tiene ID API deportiva valido.`)
  }

  const [nextEvents, previousEvents] = await Promise.all([
    getNextExternalTeamEvents(team.external_api_id),
    getPreviousExternalTeamEvents(team.external_api_id),
  ])
  const events = Array.from(
    new Map(
      [...previousEvents, ...nextEvents].map((event) => [event.id, event]),
    ).values(),
  )

  if (events.length === 0) {
    throw new Error(`La API no devolvio partidos de ${team.name}.`)
  }

  let synced = 0

  for (const event of events) {
    if (!event.startsAt) {
      continue
    }

    const [homeTeam, awayTeam] = await Promise.all([
      findOrCreateTeam({
        externalId: event.homeTeamExternalId,
        name: event.homeTeam,
        badge: event.homeBadge,
      }),
      findOrCreateTeam({
        externalId: event.awayTeamExternalId,
        name: event.awayTeam,
        badge: event.awayBadge,
      }),
    ])

    const bundle = await getExternalEventBundle(event)
    const fixtureStatus = mapFixtureStatus(event.status)

    const { data: syncedFixture, error } = await supabase
      .from('fixtures')
      .upsert(
        {
          external_fixture_id: `thesportsdb-${event.id}`,
          home_team_id: homeTeam.id,
          away_team_id: awayTeam.id,
          match_date: event.startsAt,
          venue: event.venue,
          status: fixtureStatus,
          home_score: event.homeScore,
          away_score: event.awayScore,
          live_data: {
            provider: 'thesportsdb',
            eventId: event.id,
            leagueExternalId: event.leagueExternalId,
            league: event.league,
            season: event.season,
            round: event.round,
            group: event.group,
            homeBadge: event.homeBadge,
            awayBadge: event.awayBadge,
            details: bundle.details,
            results: bundle.results,
            lineup: bundle.lineup,
            timeline: bundle.timeline,
            stats: bundle.stats,
            tv: bundle.tv,
            highlights: bundle.highlights,
            enrichedAt: new Date().toISOString(),
          },
          last_synced_at: new Date().toISOString(),
        },
        { onConflict: 'external_fixture_id' },
      )
      .select('id, home_score, away_score, status')
      .single()

    if (error) {
      throw new Error(error.message)
    }

    if (syncedFixture) {
      await ensureAutomatedContent({
        fixtureId: syncedFixture.id,
        teamId: team.id,
        teamName: team.name,
        title: `Previa: ${event.title}`,
        description: `${event.title} - ${event.league ?? 'Partido'}${
          event.round ? `, jornada ${event.round}` : ''
        }. Hora Ecuador: ${new Intl.DateTimeFormat('es-EC', {
          dateStyle: 'medium',
          timeStyle: 'short',
          timeZone: 'America/Guayaquil',
        }).format(new Date(event.startsAt))}.`,
        contentType: 'ANNOUNCEMENT',
        imageUrl: event.homeBadge ?? event.awayBadge,
        createdBy,
      })

      const firstHighlight = bundle.highlights[0]
      const highlightUrl = firstHighlight
        ? getHighlightUrl(firstHighlight)
        : null

      if (highlightUrl) {
        await ensureAutomatedContent({
          fixtureId: syncedFixture.id,
          teamId: team.id,
          teamName: team.name,
          title: `Highlights: ${event.title}`,
          description: `Resumen automatico post-partido de ${event.title}.`,
          contentType: 'HIGHLIGHT',
          externalUrl: highlightUrl,
          imageUrl: event.homeBadge ?? event.awayBadge,
          createdBy,
        })
      }

      await awardPredictionPoints(syncedFixture as SyncedFixture)
    }

    synced += 1
  }

  return synced
}

export async function syncTeamFixturesAction(formData: FormData) {
  const profile = await requireRole(['ADMIN'])

  if (!profile) {
    redirect('/login')
  }

  const supabase = await createSupabaseServerClient()
  const teamSlug = String(formData.get('teamSlug') ?? '').trim()

  if (!teamSlug) {
    redirect(
      adminFixturesPath({ error: 'Selecciona un equipo para sincronizar.' }),
    )
  }

  let synced = 0
  let teamName = ''

  try {
    if (teamSlug === '__all') {
      const { data: teams, error } = await supabase
        .from('teams')
        .select('id, name, slug, external_api_id')
        .eq('active', true)
        .not('external_api_id', 'is', null)

      if (error || !teams) {
        throw new Error(error?.message ?? 'No se pudieron cargar los equipos.')
      }

      teamName = 'todos los equipos'

      for (const team of teams as TeamRecord[]) {
        synced += await syncFixturesForTeam(team, profile.id)
      }
    } else {
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('id, name, slug, external_api_id')
        .eq('slug', teamSlug)
        .single()

      if (teamError || !team) {
        throw new Error(teamError?.message ?? 'El equipo no esta registrado.')
      }

      synced = await syncFixturesForTeam(team as TeamRecord, profile.id)
      teamName = team.name
    }
  } catch (error) {
    redirect(
      adminFixturesPath({
        error: error instanceof Error ? error.message : 'Error desconocido.',
      }),
    )
  }

  revalidatePath('/admin/partidos')
  revalidatePath('/equipos')
  revalidatePath('/equipos/[slug]', 'page')
  redirect(adminFixturesPath({ synced, team: teamName }))
}

export async function syncMacaraFixturesAction() {
  const formData = new FormData()
  formData.set('teamSlug', 'macara')
  return syncTeamFixturesAction(formData)
}

export async function updateFixtureResultAction(formData: FormData) {
  const profile = await requireRole(['ADMIN'])

  if (!profile) {
    redirect('/login')
  }

  const id = String(formData.get('id') ?? '')
  const status = String(formData.get('status') ?? '')
  const homeScoreValue = String(formData.get('home_score') ?? '').trim()
  const awayScoreValue = String(formData.get('away_score') ?? '').trim()
  const minuteValue = String(formData.get('minute') ?? '').trim()

  if (
    !id ||
    !fixtureStatuses.includes(status as (typeof fixtureStatuses)[number])
  ) {
    redirect(adminFixturesPath({ error: 'Partido o estado invalido.' }))
  }

  const homeScore = homeScoreValue === '' ? null : Number(homeScoreValue)
  const awayScore = awayScoreValue === '' ? null : Number(awayScoreValue)
  const minute = minuteValue === '' ? null : Number(minuteValue)

  if (
    (homeScore !== null && (!Number.isInteger(homeScore) || homeScore < 0)) ||
    (awayScore !== null && (!Number.isInteger(awayScore) || awayScore < 0)) ||
    (minute !== null &&
      (!Number.isInteger(minute) || minute < 0 || minute > 130))
  ) {
    redirect(adminFixturesPath({ error: 'Marcador o minuto invalido.' }))
  }

  const supabase = await createSupabaseServerClient()
  const { data: fixture, error } = await supabase
    .from('fixtures')
    .update({
      status,
      home_score: homeScore,
      away_score: awayScore,
      minute,
      last_synced_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id, home_score, away_score, status')
    .single()

  if (error || !fixture) {
    redirect(
      adminFixturesPath({
        error: error?.message ?? 'No se pudo guardar el resultado.',
      }),
    )
  }

  await awardPredictionPoints(fixture as SyncedFixture)

  revalidatePath('/admin/partidos')
  revalidatePath('/equipos')
  revalidatePath('/equipos/[slug]', 'page')
  revalidatePath(`/partidos/${id}`)
  redirect(adminFixturesPath({ synced: 1, team: 'resultado manual' }))
}
