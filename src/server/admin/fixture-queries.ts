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

export async function getAdminFixtures() {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('fixtures')
    .select(
      'id, external_fixture_id, match_date, venue, status, minute, home_score, away_score, live_data, home_team:home_team_id(name, slug), away_team:away_team_id(name, slug)',
    )
    .order('match_date', { ascending: true })
    .limit(25)

  if (error) {
    throw new Error(error.message)
  }

  return (data as unknown as FixtureRow[]).map((fixture) => ({
    ...fixture,
    home_team: firstRelation(fixture.home_team),
    away_team: firstRelation(fixture.away_team),
  }))
}
