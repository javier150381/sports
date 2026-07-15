import { syncTeamFixturesAction } from '@/server/admin/fixture-actions'
import { getAdminFixtures, getSyncableTeams } from '@/server/admin/fixture-queries'

export const dynamic = 'force-dynamic'

type AdminFixturesPageProps = {
  searchParams?: Promise<{
    synced?: string
    team?: string
    error?: string
  }>
}

function formatFixtureDate(value: string) {
  return new Intl.DateTimeFormat('es-EC', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Guayaquil',
  }).format(new Date(value))
}

function countItems(items?: unknown[]) {
  return Array.isArray(items) ? items.length : 0
}

export default async function AdminFixturesPage({ searchParams }: AdminFixturesPageProps) {
  const params = await searchParams
  const [fixtures, syncableTeams] = await Promise.all([getAdminFixtures(), getSyncableTeams()])

  return (
    <div>
      <h1 className="text-3xl font-black">Partidos</h1>
      <p className="mt-3 text-muted">
        Sincroniza partidos desde TheSportsDB y prepara pronosticos de marcador con datos
        automaticos.
      </p>

      {params?.synced ? (
        <div className="mt-5 rounded border border-emerald-500/60 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-200">
          Partidos sincronizados{params.team ? ` para ${params.team}` : ''}: {params.synced}
        </div>
      ) : null}

      {params?.error ? (
        <div className="mt-5 rounded border border-accent/70 bg-accent/10 px-4 py-3 text-sm font-bold text-accent-strong">
          No se pudo sincronizar: {params.error}
        </div>
      ) : null}

      <section className="mt-8 rounded border border-border bg-panel p-5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent-strong">
          TheSportsDB
        </p>
        <h2 className="mt-2 text-2xl font-black">Sincronizar equipos</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Trae proximos partidos, ultimo resultado, alineaciones, eventos, estadisticas, TV y
          highlights cuando TheSportsDB los tenga. Tambien crea rivales si no existen y actualiza
          el calendario sin duplicar eventos.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          {syncableTeams.map((team) => (
            <form key={team.id} action={syncTeamFixturesAction}>
              <input type="hidden" name="teamSlug" value={team.slug} />
              <button
                type="submit"
                className="rounded bg-accent px-5 py-3 font-black text-white transition hover:bg-accent-strong"
              >
                Sincronizar {team.name}
              </button>
            </form>
          ))}
        </div>
        {syncableTeams.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            Todavia no hay equipos activos con ID API deportiva.
          </p>
        ) : null}
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-black">Partidos registrados</h2>
        <div className="mt-4 grid gap-4">
          {fixtures.map((fixture) => (
            <article key={fixture.id} className="rounded border border-border bg-panel p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent-strong">
                {fixture.live_data?.league ?? 'Competicion'} - {fixture.status}
              </p>
              <h3 className="mt-3 text-xl font-black">
                {fixture.home_team?.name} vs {fixture.away_team?.name}
              </h3>
              <p className="mt-2 text-sm text-muted">{formatFixtureDate(fixture.match_date)}</p>
              {fixture.venue ? <p className="mt-2 text-sm text-muted">{fixture.venue}</p> : null}
              <p className="mt-3 text-xs text-muted">
                API: {fixture.external_fixture_id}
                {fixture.live_data?.round ? ` - Jornada ${fixture.live_data.round}` : ''}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-muted">
                <span className="rounded border border-border px-3 py-1">
                  Resultado: {countItems(fixture.live_data?.results)}
                </span>
                <span className="rounded border border-border px-3 py-1">
                  Alineaciones: {countItems(fixture.live_data?.lineup)}
                </span>
                <span className="rounded border border-border px-3 py-1">
                  Eventos: {countItems(fixture.live_data?.timeline)}
                </span>
                <span className="rounded border border-border px-3 py-1">
                  Stats: {countItems(fixture.live_data?.stats)}
                </span>
                <span className="rounded border border-border px-3 py-1">
                  TV: {countItems(fixture.live_data?.tv)}
                </span>
                <span className="rounded border border-border px-3 py-1">
                  Highlights: {countItems(fixture.live_data?.highlights)}
                </span>
              </div>
            </article>
          ))}

          {fixtures.length === 0 ? (
            <p className="rounded border border-border bg-panel p-5 text-muted">
              Todavia no hay partidos registrados.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  )
}
