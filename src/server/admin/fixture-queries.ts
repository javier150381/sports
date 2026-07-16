import { createSupabaseServerClient } from '@/server/supabase/server'

export type AdminFixture = {
  id: string
  external_fixture_id: string
  match_date: string
  venue: string | null
  status: string
  minute: number | null
  home_score: number | null
  away_score: number | null
  live_data: {
    league?: string
    season?: string
    round?: number
    homeBadge?: string
    awayBadge?: string
    results?: Record<string, unknown>[]
    lineup?: Record<string, unknown>[]
    timeline?: Record<string, unknown>[]
    stats?: Record<string, unknown>[]
    tv?: Record<string, unknown>[]
    highlights?: Record<string, unknown>[]
    enrichedAt?: string
  }
  home_team: { name: string; slug: string } | null
  away_team: { name: string; slug: string } | null
}

export type SyncableTeam = {
  id: string
  name: string
  slug: string
  external_api_id: string | null
}

export type AdminFixtureFilters = {
  dateFrom?: string
  dateTo?: string
  status?: string
  teamSlug?: string
}

type FixtureRow = Omit<AdminFixture, 'home_team' | 'away_team'> & {
  home_team: AdminFixture['home_team'] | AdminFixture['home_team'][]
  away_team: AdminFixture['away_team'] | AdminFixture['away_team'][]
}

function firstRelation<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value
}

export async function getSyncableTeams() {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('teams')
    .select('id, name, slug, external_api_id')
    .eq('active', true)
    .not('external_api_id', 'is', null)
    .order('name')

  if (error) {
    throw new Error(error.message)
  }

  return data as SyncableTeam[]
}

export async function getFixtureFilterTeams() {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('teams')
    .select('id, name, slug, external_api_id')
    .eq('active', true)
    .order('name')

  if (error) {
    throw new Error(error.message)
  }

  return data as SyncableTeam[]
}

function getDateBoundary(value: string | undefined, endOfDay = false) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null
  }

  return new Date(
    `${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}-05:00`,
  ).toISOString()
}

export async function getAdminFixtures(filters: AdminFixtureFilters = {}) {
  const supabase = await createSupabaseServerClient()
  const from = getDateBoundary(filters.dateFrom)
  const to = getDateBoundary(filters.dateTo, true)
  let teamId: string | null = null

  if (filters.teamSlug) {
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id')
      .eq('slug', filters.teamSlug)
      .maybeSingle()

    if (teamError) {
      throw new Error(teamError.message)
    }

    teamId = team?.id ?? null
  }

  if (filters.teamSlug && !teamId) {
    return []
  }

  let query = supabase
    .from('fixtures')
    .select(
      'id, external_fixture_id, match_date, venue, status, minute, home_score, away_score, live_data, home_team:home_team_id(name, slug), away_team:away_team_id(name, slug)',
    )

  if (from) {
    query = query.gte('match_date', from)
  }

  if (to) {
    query = query.lte('match_date', to)
  }

  if (filters.status) {
    query = query.eq('status', filters.status)
  }

  if (teamId) {
    query = query.or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
  }

  const { data, error } = await query
    .order('match_date', { ascending: true })
    .limit(80)

  if (error) {
    throw new Error(error.message)
  }

  return (data as unknown as FixtureRow[]).map((fixture) => ({
    ...fixture,
    home_team: firstRelation(fixture.home_team),
    away_team: firstRelation(fixture.away_team),
  }))
}
