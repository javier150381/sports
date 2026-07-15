import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { MobileContainer } from '@/components/mobile-container'
import { TikTokEmbed } from '@/features/content/tiktok-embed'
import { MemeCarousel } from '@/features/content/meme-carousel'
import { VideoCarousel } from '@/features/content/video-carousel'
import {
  getExternalLeagueTable,
  getExternalTeamEquipment,
  getExternalTeamPlayers,
  getNextExternalTeamEvents,
} from '@/server/football/thesportsdb-provider'
import { getTeamBySlug } from '@/server/teams/queries'

type TeamPageProps = {
  params: Promise<{ slug: string }>
}

export const dynamic = 'force-dynamic'

type EmbedInfo = {
  url: string
  kind: 'youtube' | 'tiktok' | 'tiktok-script' | 'drive'
}

function getEmbedFrameClass(kind: EmbedInfo['kind']) {
  if (kind === 'tiktok') {
    return 'aspect-[9/16] max-h-[680px]'
  }

  if (kind === 'drive') {
    return 'aspect-video'
  }

  return 'aspect-video'
}

function getEmbedInfo(url: string | null): EmbedInfo | null {
  if (!url) {
    return null
  }

  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace('www.', '')

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const videoId = parsed.searchParams.get('v')
      return videoId ? { url: `https://www.youtube.com/embed/${videoId}`, kind: 'youtube' } : null
    }

    if (host === 'youtu.be') {
      const videoId = parsed.pathname.split('/').filter(Boolean)[0]
      return videoId ? { url: `https://www.youtube.com/embed/${videoId}`, kind: 'youtube' } : null
    }

    if (host === 'tiktok.com' || host === 'm.tiktok.com') {
      const parts = parsed.pathname.split('/').filter(Boolean)
      const videoIndex = parts.findIndex((part) => part === 'video')
      const videoId = videoIndex >= 0 ? parts[videoIndex + 1] : null

      return videoId
        ? { url: `https://www.tiktok.com/embed/v2/${videoId}`, kind: 'tiktok' }
        : { url, kind: 'tiktok-script' }
    }

    if (host === 'vm.tiktok.com' || host === 'vt.tiktok.com') {
      return { url, kind: 'tiktok-script' }
    }

    if (host === 'drive.google.com') {
      const parts = parsed.pathname.split('/').filter(Boolean)
      const fileIndex = parts.findIndex((part) => part === 'd')
      const fileId = fileIndex >= 0 ? parts[fileIndex + 1] : parsed.searchParams.get('id')

      return fileId
        ? { url: `https://drive.google.com/file/d/${fileId}/preview`, kind: 'drive' }
        : null
    }
  } catch {
    return null
  }

  return null
}

function formatMatchDate(value: string | null) {
  if (!value) {
    return null
  }

  return new Intl.DateTimeFormat('es-EC', {
    weekday: 'short',
    day: 'numeric',
    month: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Guayaquil',
  }).format(new Date(value))
}

function countItems(items?: unknown[]) {
  return Array.isArray(items) ? items.length : 0
}

function hasSyncedDetails(fixture: NonNullable<Awaited<ReturnType<typeof getTeamBySlug>>>['fixtures'][number]) {
  const liveData = fixture.live_data

  if (!liveData) {
    return false
  }

  return (
    countItems(liveData.results) > 0 ||
    countItems(liveData.lineup) > 0 ||
    countItems(liveData.timeline) > 0 ||
    countItems(liveData.stats) > 0 ||
    countItems(liveData.tv) > 0 ||
    countItems(liveData.highlights) > 0
  )
}

function formatFixtureScore(
  fixture: NonNullable<Awaited<ReturnType<typeof getTeamBySlug>>>['fixtures'][number],
) {
  if (fixture.home_score === null || fixture.away_score === null) {
    return 'vs.'
  }

  return `${fixture.home_score} - ${fixture.away_score}`
}

function formatExternalScore(event: NonNullable<Awaited<ReturnType<typeof getNextExternalTeamEvents>>[number]>) {
  if (event.homeScore === null || event.awayScore === null) {
    return 'vs.'
  }

  return `${event.homeScore} - ${event.awayScore}`
}

function normalizeTeamName(value: string | null) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function teamNameMatches(rowTeam: string | null, teamName: string | null) {
  const normalizedRowTeam = normalizeTeamName(rowTeam)
  const normalizedTeamName = normalizeTeamName(teamName)

  return (
    normalizedRowTeam.length > 0 &&
    normalizedTeamName.length > 0 &&
    (normalizedRowTeam.includes(normalizedTeamName) ||
      normalizedTeamName.includes(normalizedRowTeam))
  )
}

function getRecordText(record: Record<string, unknown>, key: string) {
  const value = record[key]
  return typeof value === 'string' && value.trim().length > 0 ? value : null
}

function isSubstitute(record: Record<string, unknown>) {
  const value =
    getRecordText(record, 'strSubstitute') ??
    getRecordText(record, 'strRole') ??
    getRecordText(record, 'strLineup')

  return value ? /sub|bench|yes|true|suplente/i.test(value) : false
}

function getLineupForTeam(records: Record<string, unknown>[] | undefined, teamName: string | null) {
  const lineup = records ?? []
  const teamLineup = lineup.filter((record) => {
    const recordTeam = getRecordText(record, 'strTeam')
    return teamNameMatches(recordTeam, teamName)
  })

  return teamLineup
    .map((record, index) => {
      const name =
        getRecordText(record, 'strPlayer') ??
        getRecordText(record, 'strPlayerName') ??
        getRecordText(record, 'strName') ??
        'Jugador'
      const position =
        getRecordText(record, 'strPosition') ??
        getRecordText(record, 'strFormation') ??
        getRecordText(record, 'strNumber')

      return {
        id: getRecordText(record, 'idLineup') ?? getRecordText(record, 'idPlayer') ?? `${name}-${index}`,
        name,
        position,
        substitute: isSubstitute(record),
      }
    })
    .sort((first, second) => Number(first.substitute) - Number(second.substitute))
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { slug } = await params
  const team = await getTeamBySlug(slug)

  if (!team) {
    notFound()
  }

  const externalEvents = await getNextExternalTeamEvents(team.external_api_id)
  const nextExternalEvent = externalEvents[0] ?? null
  const leagueTable = await getExternalLeagueTable(
    nextExternalEvent?.leagueExternalId ?? null,
    nextExternalEvent?.season ?? null,
  )
  const [players, equipment] = await Promise.all([
    getExternalTeamPlayers(team.external_api_id),
    getExternalTeamEquipment(team.external_api_id),
  ])
  const now = new Date()
  const nextFixture =
    team.fixtures
      .filter((fixture) => new Date(fixture.match_date) > now)
      .sort((first, second) => Date.parse(first.match_date) - Date.parse(second.match_date))[0] ??
    null
  const liveFixture = team.fixtures.find((fixture) => fixture.status === 'LIVE')
  const recentFixture =
    team.fixtures
      .filter((fixture) => new Date(fixture.match_date) <= now)
      .sort((first, second) => Date.parse(second.match_date) - Date.parse(first.match_date))[0] ??
    null
  const dataFixture = liveFixture ?? nextFixture ?? recentFixture
  const syncedFixture = dataFixture && hasSyncedDetails(dataFixture) ? dataFixture : null
  const homeLineup = getLineupForTeam(dataFixture?.live_data?.lineup, dataFixture?.home_team?.name ?? null)
  const awayLineup = getLineupForTeam(dataFixture?.live_data?.lineup, dataFixture?.away_team?.name ?? null)
  const dataExternalEvent = nextExternalEvent ?? null
  const memes = team.content.filter((post) => post.content_type === 'MEME')
  const videos = team.content.filter((post) =>
    ['VIDEO', 'GOAL_VIDEO', 'HIGHLIGHT', 'LIVE_STREAM'].includes(post.content_type),
  )
  const featuredContent = team.content.filter(
    (post) =>
      post.content_type !== 'MEME' &&
      !['VIDEO', 'GOAL_VIDEO', 'HIGHLIGHT', 'LIVE_STREAM'].includes(post.content_type),
  )
  const externalMatchDate = formatMatchDate(nextExternalEvent?.startsAt ?? null)

  return (
    <MobileContainer>
      <section
        className="rounded border border-border bg-panel p-5"
        style={{ borderTopColor: team.primary_color ?? undefined, borderTopWidth: 5 }}
      >
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-accent-strong">
          Equipo Ecuador
        </p>
        <div className="mt-4 flex flex-col gap-5">
          <div
            className="grid size-20 place-items-center overflow-hidden rounded border border-border bg-background font-mono text-2xl font-black"
            style={{
              backgroundColor: team.primary_color ?? '#111827',
              color: team.secondary_color ?? '#ffffff',
              backgroundImage: team.logo_url ? `url(${team.logo_url})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {team.logo_url ? null : (team.short_name ?? team.name.slice(0, 3).toUpperCase())}
          </div>
          <div>
            <h1 className="text-3xl font-black">{team.name}</h1>
            <p className="mt-2 max-w-2xl text-muted">{team.description}</p>
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-4">
        <article className="rounded border border-border bg-panel p-5">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-muted">
            Proximo partido
          </p>
          {nextExternalEvent ? (
            <div className="mt-4">
              <p className="text-sm text-muted">
                {[nextExternalEvent.league, externalMatchDate].filter(Boolean).join(' · ')}
              </p>
              <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
                <div className="grid justify-items-center gap-3">
                  <div className="grid size-16 place-items-center overflow-hidden rounded border border-border bg-background">
                    {nextExternalEvent.homeBadge ? (
                      <Image
                        src={nextExternalEvent.homeBadge}
                        alt={nextExternalEvent.homeTeam ?? 'Equipo local'}
                        width={56}
                        height={56}
                        className="size-14 object-contain"
                      />
                    ) : (
                      <span className="text-lg font-black">
                        {nextExternalEvent.homeTeam?.slice(0, 3).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <h2 className="text-base font-black">{nextExternalEvent.homeTeam}</h2>
                </div>
                <span className="text-sm font-black text-muted">vs.</span>
                <div className="grid justify-items-center gap-3">
                  <div className="grid size-16 place-items-center overflow-hidden rounded border border-border bg-background">
                    {nextExternalEvent.awayBadge ? (
                      <Image
                        src={nextExternalEvent.awayBadge}
                        alt={nextExternalEvent.awayTeam ?? 'Equipo visitante'}
                        width={56}
                        height={56}
                        className="size-14 object-contain"
                      />
                    ) : (
                      <span className="text-lg font-black">
                        {nextExternalEvent.awayTeam?.slice(0, 3).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <h2 className="text-base font-black">{nextExternalEvent.awayTeam}</h2>
                </div>
              </div>
              <p className="mt-5 text-center text-sm text-muted">
                {[
                  nextExternalEvent.group ? `Fase ${nextExternalEvent.group}` : null,
                  nextExternalEvent.round ? `Jornada ${nextExternalEvent.round}` : null,
                  nextExternalEvent.season,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              {nextExternalEvent.venue ? (
                <p className="mt-2 text-center text-xs text-muted">{nextExternalEvent.venue}</p>
              ) : null}
            </div>
          ) : nextFixture ? (
            <div className="mt-4">
              <h2 className="text-xl font-black">
                {nextFixture.home_team?.name} vs {nextFixture.away_team?.name}
              </h2>
              <p className="mt-2 text-sm text-muted">
                {new Intl.DateTimeFormat('es-EC', {
                  dateStyle: 'full',
                  timeStyle: 'short',
                }).format(new Date(nextFixture.match_date))}
              </p>
              <p className="mt-2 text-sm text-muted">{nextFixture.venue}</p>
            </div>
          ) : (
            <p className="mt-4 text-muted">No hay proximos partidos para este equipo.</p>
          )}
        </article>

        {leagueTable.length > 0 ? (
          <article className="rounded border border-border bg-panel p-5">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-muted">
              Tabla de posiciones
            </p>
            <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-accent-strong">
              {nextExternalEvent?.league ?? 'Liga'} {nextExternalEvent?.season ?? ''}
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead className="text-xs uppercase text-muted">
                  <tr className="border-b border-border">
                    <th className="py-2 pr-2">#</th>
                    <th className="py-2 pr-2">Equipo</th>
                    <th className="py-2 pr-2 text-center">PJ</th>
                    <th className="py-2 pr-2 text-center">G</th>
                    <th className="py-2 pr-2 text-center">E</th>
                    <th className="py-2 pr-2 text-center">P</th>
                    <th className="py-2 pr-2 text-center">DG</th>
                    <th className="py-2 text-right">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {leagueTable.map((row) => {
                    const isCurrentTeam =
                      teamNameMatches(row.team, team.short_name) || teamNameMatches(row.team, team.name)

                    return (
                      <tr
                        key={`${row.rank}-${row.team}`}
                        className={`border-b border-border/70 last:border-0 ${
                          isCurrentTeam ? 'bg-accent/15 text-white' : ''
                        }`}
                      >
                        <td className="py-3 pr-2 font-bold">{row.rank}</td>
                        <td className="py-3 pr-2 font-bold">{row.team}</td>
                        <td className="py-3 pr-2 text-center">{row.played}</td>
                        <td className="py-3 pr-2 text-center">{row.won}</td>
                        <td className="py-3 pr-2 text-center">{row.drawn}</td>
                        <td className="py-3 pr-2 text-center">{row.lost}</td>
                        <td className="py-3 pr-2 text-center">{row.goalDifference}</td>
                        <td className="py-3 text-right font-black">{row.points}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </article>
        ) : null}

        {dataExternalEvent || dataFixture ? (
          <article className="rounded border border-border bg-panel p-5">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-muted">
              Datos TheSportsDB
            </p>
            <div className="mt-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent-strong">
                {dataExternalEvent?.league ?? dataFixture?.live_data?.league ?? 'Partido'}{' '}
                {dataExternalEvent?.round
                  ? `- Jornada ${dataExternalEvent.round}`
                  : dataFixture?.live_data?.round
                    ? `- Jornada ${dataFixture.live_data.round}`
                    : ''}
              </p>
              <h2 className="mt-3 text-xl font-black">
                {dataExternalEvent
                  ? `${dataExternalEvent.homeTeam} ${formatExternalScore(dataExternalEvent)} ${
                      dataExternalEvent.awayTeam
                    }`
                  : `${dataFixture?.home_team?.name} ${dataFixture ? formatFixtureScore(dataFixture) : 'vs.'} ${
                      dataFixture?.away_team?.name
                    }`}
              </h2>
              <p className="mt-2 text-sm text-muted">
                {formatMatchDate(dataExternalEvent?.startsAt ?? dataFixture?.match_date ?? null)}
              </p>
              {dataExternalEvent?.venue ?? dataFixture?.venue ? (
                <p className="mt-1 text-sm text-muted">
                  {dataExternalEvent?.venue ?? dataFixture?.venue}
                </p>
              ) : null}
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-bold text-muted">
                <span className="rounded border border-border px-3 py-2">
                  Alineaciones {countItems(dataFixture?.live_data?.lineup)}
                </span>
                <span className="rounded border border-border px-3 py-2">
                  Eventos {countItems(dataFixture?.live_data?.timeline)}
                </span>
                <span className="rounded border border-border px-3 py-2">
                  Stats {countItems(dataFixture?.live_data?.stats)}
                </span>
                <span className="rounded border border-border px-3 py-2">
                  TV {countItems(dataFixture?.live_data?.tv)}
                </span>
                <span className="rounded border border-border px-3 py-2">
                  Highlights {countItems(dataFixture?.live_data?.highlights)}
                </span>
                <span className="rounded border border-border px-3 py-2">
                  Resultado {countItems(dataFixture?.live_data?.results)}
                </span>
              </div>
              {!syncedFixture ? (
                <p className="mt-4 text-sm text-muted">
                  La ficha del partido ya esta creada. La cobertura detallada aparecera cuando la
                  API tenga esos datos.
                </p>
              ) : null}
              {dataFixture ? (
                <Link
                  href={`/partidos/${dataFixture.id}`}
                  className="mt-4 inline-flex rounded bg-accent px-4 py-2 text-sm font-black text-white transition hover:bg-accent-strong"
                >
                  Pronosticar marcador
                </Link>
              ) : null}
            </div>
          </article>
        ) : null}

        {dataFixture ? (
          <article className="rounded border border-border bg-panel p-5">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-muted">
              Alineaciones del partido
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {[
                { title: dataFixture.home_team?.name ?? 'Local', players: homeLineup },
                { title: dataFixture.away_team?.name ?? 'Visitante', players: awayLineup },
              ].map((group) => (
                <div key={group.title} className="rounded border border-border bg-background/40 p-4">
                  <h3 className="font-black">{group.title}</h3>
                  {group.players.length > 0 ? (
                    <div className="mt-3 grid gap-2">
                      {group.players.slice(0, 18).map((player) => (
                        <div
                          key={player.id}
                          className="flex items-center justify-between gap-3 rounded border border-border px-3 py-2 text-sm"
                        >
                          <span className="font-bold">{player.name}</span>
                          <span className="text-xs text-muted">
                            {player.substitute ? 'Suplente' : (player.position ?? 'Titular')}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-muted">
                      Alineacion todavia no disponible en TheSportsDB.
                    </p>
                  )}
                </div>
              ))}
            </div>
          </article>
        ) : null}

        {players.length > 0 ? (
          <article className="rounded border border-border bg-panel p-5">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-muted">
              Plantilla automatica
            </p>
            <div className="mt-4 grid gap-3">
              {players.slice(0, 12).map((player) => (
                <div
                  key={player.id ?? player.name}
                  className="flex items-center gap-3 rounded border border-border bg-background/40 p-3"
                >
                  <div className="relative size-12 shrink-0 overflow-hidden rounded bg-background">
                    {player.image ? (
                      <Image
                        src={player.image}
                        alt={player.name ?? 'Jugador'}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="grid h-full place-items-center text-xs font-black">
                        {(player.name ?? 'J').slice(0, 1)}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-black">{player.name}</h3>
                    <p className="text-xs text-muted">
                      {[player.position, player.nationality].filter(Boolean).join(' - ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ) : null}

        {equipment.length > 0 ? (
          <article className="rounded border border-border bg-panel p-5">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-muted">
              Camisetas historicas
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {equipment.slice(0, 8).map((kit) => (
                <div key={kit.id ?? `${kit.season}-${kit.type}`} className="rounded border border-border p-3">
                  {kit.image ? (
                    <div className="relative aspect-square overflow-hidden rounded bg-background">
                      <Image
                        src={kit.image}
                        alt={`${kit.type ?? 'Camiseta'} ${kit.season ?? ''}`}
                        fill
                        sizes="160px"
                        className="object-contain p-2"
                      />
                    </div>
                  ) : null}
                  <h3 className="mt-3 text-sm font-black">{kit.type ?? 'Equipamiento'}</h3>
                  <p className="text-xs text-muted">{kit.season}</p>
                </div>
              ))}
            </div>
          </article>
        ) : null}

        <article className="rounded border border-border bg-panel p-5">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-muted">
            Partido en vivo
          </p>
          {liveFixture ? (
            <div className="mt-4">
              <h2 className="text-xl font-black">
                {liveFixture.home_team?.short_name} {liveFixture.home_score} -{' '}
                {liveFixture.away_score} {liveFixture.away_team?.short_name}
              </h2>
              <p className="mt-2 font-mono text-accent-strong">Minuto {liveFixture.minute}</p>
            </div>
          ) : (
            <p className="mt-4 text-muted">Sin marcador en vivo ahora mismo.</p>
          )}
        </article>
      </section>

      <VideoCarousel videos={videos} teamName={team.name} />

      <section className="mt-6">
        <h2 className="text-2xl font-black">Actualidad reciente</h2>
        <div className="mt-4 grid gap-4">
          {featuredContent.map((post) => {
            const embed = getEmbedInfo(post.external_url)

            return (
              <article key={post.id} className="overflow-hidden rounded border border-border bg-panel">
                {embed?.kind === 'tiktok-script' ? (
                  <TikTokEmbed url={embed.url} title={post.title} />
                ) : embed ? (
                  <div
                    className={`${getEmbedFrameClass(embed.kind)} relative mx-auto w-full overflow-hidden bg-black`}
                  >
                    <iframe
                      src={embed.url}
                      title={post.title}
                      className="absolute inset-0 h-full w-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                ) : post.image_url ? (
                  <div className="relative aspect-video bg-background">
                    <Image
                      src={post.image_url}
                      alt={post.alt_text ?? post.title}
                      fill
                      sizes="(min-width: 768px) 33vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                ) : null}
                <div className="p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent-strong">
                    {post.content_type}
                  </p>
                  <h3 className="mt-3 font-black">{post.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{post.description}</p>
                  {post.external_url && !embed ? (
                    <a
                      href={post.external_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex rounded bg-accent px-4 py-2 text-sm font-black text-white transition hover:bg-accent-strong"
                    >
                      Ver enlace oficial
                    </a>
                  ) : null}
                  {post.nfc_exclusive ? (
                    <p className="mt-4 rounded bg-accent/15 px-3 py-2 text-xs font-bold text-accent-strong">
                      Exclusivo NFC
                    </p>
                  ) : null}
                </div>
              </article>
            )
          })}
          {featuredContent.length === 0 ? (
            <p className="rounded border border-border bg-panel p-5 text-muted">
              Todavia no hay contenido publicado para este equipo.
            </p>
          ) : null}
        </div>
      </section>

      <MemeCarousel memes={memes} teamName={team.name} />
    </MobileContainer>
  )
}
