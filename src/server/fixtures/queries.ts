import { createSupabaseServerClient } from '@/server/supabase/server'

export type FixtureDetail = {
  id: string
  match_date: string
  venue: string | null
  status: string
  home_score: number | null
  away_score: number | null
  live_data: {
    league?: string
    round?: number
  } | null
  home_team: { name: string; short_name: string | null; slug: string } | null
  away_team: { name: string; short_name: string | null; slug: string } | null
  prediction: {
    home_score: number
    away_score: number
    points_awarded: number
  } | null
}

type FixtureRow = Omit<FixtureDetail, 'home_team' | 'away_team' | 'prediction'> & {
  home_team: FixtureDetail['home_team'] | FixtureDetail['home_team'][]
  away_team: FixtureDetail['away_team'] | FixtureDetail['away_team'][]
}

function firstRelation<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value
}

export async function getFixtureDetail(id: string): Promise<FixtureDetail | null> {
  const supabase = await createSupabaseServerClient()
  const { data: fixture, error } = await supabase
    .from('fixtures')
    .select(
      'id, match_date, venue, status, home_score, away_score, live_data, home_team:home_team_id(name, short_name, slug), away_team:away_team_id(name, short_name, slug)',
    )
    .eq('id', id)
    .single()

  if (error || !fixture) {
    return null
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let prediction: FixtureDetail['prediction'] = null

  if (user) {
    const { data: userPrediction } = await supabase
      .from('predictions')
      .select('home_score, away_score, points_awarded')
      .eq('fixture_id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    prediction = userPrediction as FixtureDetail['prediction']
  }

  const row = fixture as unknown as FixtureRow

  return {
    ...row,
    home_team: firstRelation(row.home_team),
    away_team: firstRelation(row.away_team),
    prediction,
  }
}
