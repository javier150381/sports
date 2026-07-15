import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/server/auth/session'
import { createSupabaseServerClient } from '@/server/supabase/server'

type PredictionRow = {
  id: string
  home_score: number
  away_score: number
  points_awarded: number
  fixture:
    | {
        id: string
        match_date: string
        status: string
        home_score: number | null
        away_score: number | null
        home_team: { name: string } | { name: string }[] | null
        away_team: { name: string } | { name: string }[] | null
      }
    | {
        id: string
        match_date: string
        status: string
        home_score: number | null
        away_score: number | null
        home_team: { name: string } | { name: string }[] | null
        away_team: { name: string } | { name: string }[] | null
      }[]
    | null
}

function firstRelation<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-EC', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Guayaquil',
  }).format(new Date(value))
}

export default async function AccountPredictionsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('predictions')
    .select(
      'id, home_score, away_score, points_awarded, fixture:fixture_id(id, match_date, status, home_score, away_score, home_team:home_team_id(name), away_team:away_team_id(name))',
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const predictions = (data ?? []) as unknown as PredictionRow[]

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-black">Mis pronosticos</h1>
      <p className="mt-3 text-muted">Historial de marcadores enviados por tu cuenta.</p>
      <div className="mt-8 grid gap-4">
        {predictions.map((prediction) => {
          const fixture = firstRelation(prediction.fixture)
          const homeTeam = firstRelation(fixture?.home_team ?? null)
          const awayTeam = firstRelation(fixture?.away_team ?? null)

          return (
            <article key={prediction.id} className="rounded border border-border bg-panel p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent-strong">
                {fixture?.status ?? 'Partido'}
              </p>
              <h2 className="mt-3 text-xl font-black">
                {homeTeam?.name} vs {awayTeam?.name}
              </h2>
              {fixture ? <p className="mt-2 text-sm text-muted">{formatDate(fixture.match_date)}</p> : null}
              <p className="mt-3 font-bold">
                Tu pronostico: {prediction.home_score} - {prediction.away_score}
              </p>
              {fixture && fixture.home_score !== null && fixture.away_score !== null ? (
                <p className="mt-1 text-sm text-muted">
                  Resultado: {fixture.home_score} - {fixture.away_score}
                </p>
              ) : null}
              <p className="mt-3 text-sm font-black text-accent-strong">
                Puntos: {prediction.points_awarded}
              </p>
            </article>
          )
        })}

        {predictions.length === 0 ? (
          <p className="rounded border border-border bg-panel p-5 text-muted">
            Aun no has enviado pronosticos.
          </p>
        ) : null}
      </div>
    </main>
  )
}
