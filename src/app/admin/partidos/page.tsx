import { syncMacaraFixturesAction } from '@/server/admin/fixture-actions'
import { getAdminFixtures } from '@/server/admin/fixture-queries'

export const dynamic = 'force-dynamic'

type AdminFixturesPageProps = {
  searchParams?: Promise<{
    synced?: string
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

export default async function AdminFixturesPage({ searchParams }: AdminFixturesPageProps) {
  const params = await searchParams
  const fixtures = await getAdminFixtures()

  return (
    <div>
      <h1 className="text-3xl font-black">Partidos</h1>
      <p className="mt-3 text-muted">
        Sincroniza partidos desde TheSportsDB y prepara pronosticos de marcador.
      </p>

      {params?.synced ? (
        <div className="mt-5 rounded border border-emerald-500/60 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-200">
          Partidos de Macara sincronizados: {params.synced}
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
        <h2 className="mt-2 text-2xl font-black">Sincronizar Macara</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Trae los proximos partidos de Macara, crea rivales si no existen y actualiza el
          calendario sin duplicar eventos.
        </p>
        <form action={syncMacaraFixturesAction}>
          <button type="submit" className="mt-5 rounded bg-accent px-5 py-3 font-black text-white">
            Sincronizar partidos de Macara
          </button>
        </form>
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
