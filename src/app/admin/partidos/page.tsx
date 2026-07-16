import {
  syncTeamFixturesAction,
  updateFixtureResultAction,
} from '@/server/admin/fixture-actions'
import {
  getAdminFixtures,
  getFixtureFilterTeams,
  getSyncableTeams,
} from '@/server/admin/fixture-queries'

export const dynamic = 'force-dynamic'

type AdminFixturesPageProps = {
  searchParams?: Promise<{
    synced?: string
    team?: string
    error?: string
    dateFrom?: string
    dateTo?: string
    status?: string
    teamFilter?: string
  }>
}

const fixtureStatuses = [
  ['PRE_MATCH', 'Por jugar'],
  ['LIVE', 'En vivo'],
  ['POST_MATCH', 'Finalizado'],
  ['POSTPONED', 'Pospuesto'],
  ['CANCELLED', 'Cancelado'],
]

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

function getEcuadorDateInput(offsetDays = 0) {
  const date = new Date(
    Date.now() - 5 * 60 * 60 * 1000 + offsetDays * 24 * 60 * 60 * 1000,
  )
  return date.toISOString().slice(0, 10)
}

function getQuickFilterHref(input: { dateFrom?: string; dateTo?: string }) {
  const params = new URLSearchParams()

  if (input.dateFrom) {
    params.set('dateFrom', input.dateFrom)
  }

  if (input.dateTo) {
    params.set('dateTo', input.dateTo)
  }

  return `/admin/partidos?${params.toString()}`
}

export default async function AdminFixturesPage({
  searchParams,
}: AdminFixturesPageProps) {
  const params = await searchParams
  const filters = {
    dateFrom: params?.dateFrom,
    dateTo: params?.dateTo,
    status: params?.status,
    teamSlug: params?.teamFilter,
  }
  const [fixtures, syncableTeams, filterTeams] = await Promise.all([
    getAdminFixtures(filters),
    getSyncableTeams(),
    getFixtureFilterTeams(),
  ])
  const today = getEcuadorDateInput()
  const quickFilters = [
    {
      label: 'Hoy',
      href: getQuickFilterHref({ dateFrom: today, dateTo: today }),
    },
    {
      label: 'Proximos 7 dias',
      href: getQuickFilterHref({
        dateFrom: today,
        dateTo: getEcuadorDateInput(7),
      }),
    },
    {
      label: 'Ultimos 30 dias',
      href: getQuickFilterHref({
        dateFrom: getEcuadorDateInput(-30),
        dateTo: today,
      }),
    },
  ]

  return (
    <div>
      <h1 className="text-3xl font-black">Partidos</h1>
      <p className="mt-3 text-muted">
        Sincroniza partidos desde TheSportsDB y prepara pronosticos de marcador
        con datos automaticos.
      </p>

      {params?.synced ? (
        <div className="mt-5 rounded border border-emerald-500/60 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-200">
          Partidos sincronizados{params.team ? ` para ${params.team}` : ''}:{' '}
          {params.synced}
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
          Trae proximos partidos, ultimo resultado, alineaciones, eventos,
          estadisticas, TV y highlights cuando TheSportsDB los tenga. Tambien
          crea previas, highlights post-partido, cierra pronosticos con puntos y
          crea rivales si no existen.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <form action={syncTeamFixturesAction}>
            <input type="hidden" name="teamSlug" value="__all" />
            <button
              type="submit"
              className="rounded bg-white px-5 py-3 font-black text-background transition hover:bg-accent hover:text-white"
            >
              Sincronizar todos los equipos
            </button>
          </form>
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
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">Partidos registrados</h2>
            <p className="mt-1 text-sm text-muted">
              Filtra por equipo, estado y rango de fechas para editar solo las
              fichas que necesitas.
            </p>
          </div>
          <p className="text-sm font-bold text-muted">
            {fixtures.length} fichas
          </p>
        </div>

        <form
          method="get"
          className="mt-4 rounded border border-border bg-panel p-5"
        >
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent-strong">
            Filtros
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <label className="grid gap-2 text-sm font-semibold">
              Equipo
              <select
                name="teamFilter"
                defaultValue={params?.teamFilter ?? ''}
                className="rounded border border-border bg-background px-3 py-3"
              >
                <option value="">Todos los equipos</option>
                {filterTeams.map((team) => (
                  <option key={team.id} value={team.slug}>
                    {team.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Desde
              <input
                name="dateFrom"
                type="date"
                defaultValue={params?.dateFrom ?? ''}
                className="rounded border border-border bg-background px-3 py-3"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Hasta
              <input
                name="dateTo"
                type="date"
                defaultValue={params?.dateTo ?? ''}
                className="rounded border border-border bg-background px-3 py-3"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Estado
              <select
                name="status"
                defaultValue={params?.status ?? ''}
                className="rounded border border-border bg-background px-3 py-3"
              >
                <option value="">Todos</option>
                {fixtureStatuses.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="submit"
              className="rounded bg-accent px-5 py-3 font-black text-white transition hover:bg-accent-strong"
            >
              Aplicar filtros
            </button>
            <a
              href="/admin/partidos"
              className="rounded border border-border px-5 py-3 font-black text-white transition hover:border-accent"
            >
              Limpiar
            </a>
            {quickFilters.map((filter) => (
              <a
                key={filter.label}
                href={filter.href}
                className="rounded border border-border px-4 py-3 text-sm font-bold text-muted transition hover:border-accent hover:text-white"
              >
                {filter.label}
              </a>
            ))}
          </div>
        </form>

        <div className="mt-4 grid gap-4">
          {fixtures.map((fixture) => (
            <article
              key={fixture.id}
              className="rounded border border-border bg-panel p-5"
            >
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent-strong">
                {fixture.live_data?.league ?? 'Competicion'} - {fixture.status}
              </p>
              <h3 className="mt-3 text-xl font-black">
                {fixture.home_team?.name} vs {fixture.away_team?.name}
              </h3>
              <p className="mt-2 text-sm text-muted">
                {formatFixtureDate(fixture.match_date)}
              </p>
              {fixture.venue ? (
                <p className="mt-2 text-sm text-muted">{fixture.venue}</p>
              ) : null}
              <p className="mt-3 text-xs text-muted">
                API: {fixture.external_fixture_id}
                {fixture.live_data?.round
                  ? ` - Jornada ${fixture.live_data.round}`
                  : ''}
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
              <form
                action={updateFixtureResultAction}
                className="mt-5 rounded border border-border bg-background/50 p-4"
              >
                <input type="hidden" name="id" value={fixture.id} />
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent-strong">
                  Cerrar o corregir marcador
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-4">
                  <label className="grid gap-2 text-sm font-semibold">
                    Estado
                    <select
                      name="status"
                      defaultValue={fixture.status}
                      className="rounded border border-border bg-background px-3 py-3"
                    >
                      <option value="PRE_MATCH">Por jugar</option>
                      <option value="LIVE">En vivo</option>
                      <option value="POST_MATCH">Finalizado</option>
                      <option value="POSTPONED">Pospuesto</option>
                      <option value="CANCELLED">Cancelado</option>
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm font-semibold">
                    Local
                    <input
                      name="home_score"
                      type="number"
                      min="0"
                      defaultValue={fixture.home_score ?? ''}
                      className="rounded border border-border bg-background px-3 py-3"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-semibold">
                    Visitante
                    <input
                      name="away_score"
                      type="number"
                      min="0"
                      defaultValue={fixture.away_score ?? ''}
                      className="rounded border border-border bg-background px-3 py-3"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-semibold">
                    Minuto
                    <input
                      name="minute"
                      type="number"
                      min="0"
                      max="130"
                      defaultValue={fixture.minute ?? ''}
                      className="rounded border border-border bg-background px-3 py-3"
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  className="mt-4 rounded bg-accent px-5 py-3 font-black text-white transition hover:bg-accent-strong"
                >
                  Guardar resultado
                </button>
              </form>
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
