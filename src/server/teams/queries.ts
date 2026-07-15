import { createSupabaseServerClient } from '@/server/supabase/server'

export type TeamListItem = {
  id: string
  name: string
  slug: string
  short_name: string | null
  description: string | null
  logo_url: string | null
  primary_color: string | null
  secondary_color: string | null
  external_api_id: string | null
}

export type TeamDetail = TeamListItem & {
  fixtures: Array<{
    id: string
    match_date: string
    venue: string | null
    status: string
    minute: number | null
    home_score: number | null
    away_score: number | null
    live_data: {
      league?: string
      round?: number
      group?: string
      homeBadge?: string
      awayBadge?: string
      results?: Record<string, unknown>[]
      lineup?: Record<string, unknown>[]
      timeline?: Record<string, unknown>[]
      stats?: Record<string, unknown>[]
      tv?: Record<string, unknown>[]
      highlights?: Record<string, unknown>[]
    } | null
    home_team: { name: string; short_name: string | null } | null
    away_team: { name: string; short_name: string | null } | null
  }>
  content: Array<{
    id: string
    title: string
    description: string | null
    content_type: string
    external_url: string | null
    image_url: string | null
    alt_text: string | null
    is_featured: boolean
    nfc_exclusive: boolean
    published_at: string | null
    created_at: string
  }>
}

type FixtureRow = Omit<TeamDetail['fixtures'][number], 'home_team' | 'away_team'> & {
  home_team:
    | TeamDetail['fixtures'][number]['home_team']
    | Array<NonNullable<TeamDetail['fixtures'][number]['home_team']>>
  away_team:
    | TeamDetail['fixtures'][number]['away_team']
    | Array<NonNullable<TeamDetail['fixtures'][number]['away_team']>>
}

function firstRelation<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value
}

export async function getActiveTeams(): Promise<TeamListItem[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('teams')
    .select(
      'id, name, slug, short_name, description, logo_url, primary_color, secondary_color, external_api_id',
    )
    .eq('active', true)
    .order('name')

  if (error) {
    throw new Error(error.message)
  }

  return data as TeamListItem[]
}

export async function getTeamBySlug(slug: string): Promise<TeamDetail | null> {
  const supabase = await createSupabaseServerClient()
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select(
      'id, name, slug, short_name, description, logo_url, primary_color, secondary_color, external_api_id',
    )
    .eq('slug', slug)
    .eq('active', true)
    .single()

  if (teamError) {
    return null
  }

  const [fixturesResult, contentResult] = await Promise.all([
    supabase
      .from('fixtures')
      .select(
        'id, match_date, venue, status, minute, home_score, away_score, live_data, home_team:home_team_id(name, short_name), away_team:away_team_id(name, short_name)',
      )
      .or(`home_team_id.eq.${team.id},away_team_id.eq.${team.id}`)
      .order('match_date', { ascending: false })
      .limit(5),
    supabase
      .from('content_posts')
      .select(
        'id, title, description, content_type, external_url, image_url, alt_text, is_featured, nfc_exclusive, published_at, created_at',
      )
      .eq('team_id', team.id)
      .eq('status', 'PUBLISHED')
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  return {
    ...(team as TeamListItem),
    fixtures: fixturesResult.error
      ? []
      : (fixturesResult.data as unknown as FixtureRow[]).map((fixture) => ({
          ...fixture,
          home_team: firstRelation(fixture.home_team),
          away_team: firstRelation(fixture.away_team),
        })),
    content: contentResult.error ? [] : (contentResult.data as TeamDetail['content']),
  }
}
