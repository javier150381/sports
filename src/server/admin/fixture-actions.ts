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
import { createSupabaseServerClient } from '@/server/supabase/server'

type TeamRecord = {
  id: string
  name: string
  slug: string
  external_api_id: string | null
}

function adminFixturesPath(message: { synced?: number; error?: string }): Route {
  const params = new URLSearchParams()

  if (typeof message.synced === 'number') {
    params.set('synced', String(message.synced))
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
    const { data: existingByExternalId, error: externalIdError } = await supabase
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
    if (input.externalId && existingBySlug.external_api_id !== input.externalId) {
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

export async function syncMacaraFixturesAction() {
  const profile = await requireRole(['ADMIN'])

  if (!profile) {
    redirect('/login')
  }

  const supabase = await createSupabaseServerClient()
  const { data: macara, error: macaraError } = await supabase
    .from('teams')
    .select('id, name, slug, external_api_id')
    .eq('slug', 'macara')
    .single()

  if (macaraError || !macara) {
    redirect(adminFixturesPath({ error: macaraError?.message ?? 'Macara no esta registrado.' }))
  }

  if (!macara.external_api_id || !/^\d+$/.test(macara.external_api_id)) {
    redirect(adminFixturesPath({ error: 'Macara no tiene ID API deportiva valido.' }))
  }

  const [nextEvents, previousEvents] = await Promise.all([
    getNextExternalTeamEvents(macara.external_api_id),
    getPreviousExternalTeamEvents(macara.external_api_id),
  ])
  const events = Array.from(
    new Map([...previousEvents, ...nextEvents].map((event) => [event.id, event])).values(),
  )

  if (events.length === 0) {
    redirect(adminFixturesPath({ error: 'La API no devolvio partidos de Macara.' }))
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

    const { error } = await supabase.from('fixtures').upsert(
      {
        external_fixture_id: `thesportsdb-${event.id}`,
        home_team_id: homeTeam.id,
        away_team_id: awayTeam.id,
        match_date: event.startsAt,
        venue: event.venue,
        status: mapFixtureStatus(event.status),
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

    if (error) {
      redirect(adminFixturesPath({ error: error.message }))
    }

    synced += 1
  }

  revalidatePath('/admin/partidos')
  revalidatePath('/equipos')
  revalidatePath('/equipos/[slug]', 'page')
  redirect(adminFixturesPath({ synced }))
}
