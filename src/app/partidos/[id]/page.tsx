import { notFound, redirect } from 'next/navigation'
import { savePredictionAction } from '@/server/fixtures/prediction-actions'
import { getFixtureDetail } from '@/server/fixtures/queries'
import { getCurrentUser } from '@/server/auth/session'

type MatchPageProps = {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ message?: string }>
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-EC', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'America/Guayaquil',
  }).format(new Date(value))
}

export default async function MatchPage({ params, searchParams }: MatchPageProps) {
  const { id } = await params
  const query = await searchParams
  const [fixture, user] = await Promise.all([getFixtureDetail(id), getCurrentUser()])

  if (!fixture) {
    notFound()
  }

  const matchStarted = new Date(fixture.match_date) <= new Date()

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-accent-strong">Partido</p>
      <h1 className="mt-2 text-3xl font-black">
        {fixture.home_team?.name} vs {fixture.away_team?.name}
      </h1>
      <p className="mt-3 text-muted">{formatDate(fixture.match_date)}</p>
      {fixture.venue ? <p className="mt-1 text-muted">{fixture.venue}</p> : null}

      {query?.message === 'saved' ? (
        <div className="mt-6 rounded border border-emerald-500/60 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-200">
          Pronostico guardado.
        </div>
      ) : null}

      {query?.message === 'closed' ? (
        <div className="mt-6 rounded border border-accent/70 bg-accent/10 px-4 py-3 text-sm font-bold text-accent-strong">
          Este partido ya empezo. El pronostico esta cerrado.
        </div>
      ) : null}

      <section className="mt-8 grid gap-5 md:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded border border-border bg-panel p-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent-strong">
            {fixture.live_data?.league ?? 'Competicion'}{' '}
            {fixture.live_data?.round ? `- Jornada ${fixture.live_data.round}` : ''}
          </p>
          <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-center">
            <h2 className="text-xl font-black">{fixture.home_team?.name}</h2>
            <span className="text-sm font-black text-muted">
              {fixture.home_score === null || fixture.away_score === null
                ? 'vs.'
                : `${fixture.home_score} - ${fixture.away_score}`}
            </span>
            <h2 className="text-xl font-black">{fixture.away_team?.name}</h2>
          </div>
          <p className="mt-6 text-center text-sm font-bold text-muted">{fixture.status}</p>
        </article>

        <article className="rounded border border-border bg-panel p-5">
          <h2 className="text-xl font-black">Pronostico de marcador</h2>
          {user ? (
            matchStarted ? (
              <div className="mt-4">
                <p className="text-muted">Pronostico cerrado.</p>
                {fixture.prediction ? (
                  <p className="mt-3 font-bold">
                    Tu marcador: {fixture.prediction.home_score} - {fixture.prediction.away_score}
                    {fixture.prediction.points_awarded > 0
                      ? ` · ${fixture.prediction.points_awarded} puntos`
                      : ''}
                  </p>
                ) : null}
              </div>
            ) : (
              <form action={savePredictionAction} className="mt-4 grid gap-4">
                <input type="hidden" name="fixtureId" value={fixture.id} />
                <div className="grid grid-cols-2 gap-3">
                  <label className="grid gap-2 text-sm font-bold">
                    {fixture.home_team?.short_name ?? 'Local'}
                    <input
                      name="homeScore"
                      type="number"
                      min="0"
                      max="30"
                      defaultValue={fixture.prediction?.home_score ?? 0}
                      className="rounded border border-border bg-background px-3 py-3 text-lg font-black"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-bold">
                    {fixture.away_team?.short_name ?? 'Visitante'}
                    <input
                      name="awayScore"
                      type="number"
                      min="0"
                      max="30"
                      defaultValue={fixture.prediction?.away_score ?? 0}
                      className="rounded border border-border bg-background px-3 py-3 text-lg font-black"
                    />
                  </label>
                </div>
                <button type="submit" className="rounded bg-accent px-5 py-3 font-black text-white">
                  Guardar pronostico
                </button>
              </form>
            )
          ) : (
            <form
              action={async () => {
                'use server'
                redirect('/login')
              }}
            >
              <button type="submit" className="mt-4 rounded bg-accent px-5 py-3 font-black text-white">
                Ingresar para pronosticar
              </button>
            </form>
          )}
          <p className="mt-4 text-xs leading-5 text-muted">
            Marcador exacto: 10 puntos. Ganador/empate correcto: 3 puntos.
          </p>
        </article>
      </section>
    </main>
  )
}
