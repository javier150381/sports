import { notFound } from 'next/navigation'
import Image from 'next/image'
import { MobileContainer } from '@/components/mobile-container'
import { ImageGalleryCarousel } from '@/features/content/image-gallery-carousel'
import { TeamChantCard } from '@/features/content/team-chant-card'
import { VideoCarousel } from '@/features/content/video-carousel'
import {
  getExternalTeamEquipment,
  getNextExternalTeamEvents,
} from '@/server/football/thesportsdb-provider'
import { getTeamBySlug } from '@/server/teams/queries'

type TeamPageProps = {
  params: Promise<{ slug: string }>
}

export const dynamic = 'force-dynamic'

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

function formatFixtureDateTime(value: string) {
  return new Intl.DateTimeFormat('es-EC', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Guayaquil',
  }).format(new Date(value))
}

function formatFixtureScore(
  fixture: NonNullable<
    Awaited<ReturnType<typeof getTeamBySlug>>
  >['fixtures'][number],
) {
  if (fixture.home_score === null || fixture.away_score === null) {
    return 'vs.'
  }

  return `${fixture.home_score} - ${fixture.away_score}`
}

function isFreshLiveFixture(matchDate: string, now: Date) {
  const startsAt = Date.parse(matchDate)
  const currentTime = now.getTime()
  const startsThirtyMinutesFromNow = currentTime + 30 * 60 * 1000
  const startedFourHoursAgo = currentTime - 4 * 60 * 60 * 1000

  return (
    startsAt >= startedFourHoursAgo && startsAt <= startsThirtyMinutesFromNow
  )
}

function isFutureMatch(value: string | null | undefined, now: Date) {
  return value ? Date.parse(value) > now.getTime() : false
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { slug } = await params
  const team = await getTeamBySlug(slug)

  if (!team) {
    notFound()
  }

  const now = new Date()
  const externalEvents = await getNextExternalTeamEvents(team.external_api_id)
  const nextExternalEvent =
    externalEvents
      .filter((event) => isFutureMatch(event.startsAt, now))
      .sort(
        (first, second) =>
          Date.parse(first.startsAt ?? '') - Date.parse(second.startsAt ?? ''),
      )[0] ?? null
  const equipment = await getExternalTeamEquipment(team.external_api_id)
  const nextFixture =
    team.fixtures
      .filter((fixture) => new Date(fixture.match_date) > now)
      .sort(
        (first, second) =>
          Date.parse(first.match_date) - Date.parse(second.match_date),
      )[0] ?? null
  const liveFixture =
    team.fixtures
      .filter(
        (fixture) =>
          fixture.status === 'LIVE' &&
          isFreshLiveFixture(fixture.match_date, now),
      )
      .sort(
        (first, second) =>
          Date.parse(second.match_date) - Date.parse(first.match_date),
      )[0] ?? null
  const latestResult =
    team.fixtures
      .filter(
        (fixture) =>
          fixture.status === 'POST_MATCH' &&
          fixture.home_score !== null &&
          fixture.away_score !== null,
      )
      .sort(
        (first, second) =>
          Date.parse(second.match_date) - Date.parse(first.match_date),
      )[0] ?? null
  const scoreFixture = liveFixture ?? latestResult
  const scoreStatusLabel =
    scoreFixture?.status === 'LIVE' ? 'En vivo' : 'Finalizado'
  const galleryImages = team.content.filter(
    (post) => post.content_type === 'IMAGE',
  )
  const teamChant =
    team.content.find((post) => post.content_type === 'TEAM_CHANT') ?? null
  const videos = team.content.filter((post) =>
    ['VIDEO', 'GOAL_VIDEO', 'HIGHLIGHT', 'LIVE_STREAM'].includes(
      post.content_type,
    ),
  )
  const historicMoments = team.content.filter(
    (post) => post.content_type === 'HISTORIC_MOMENT',
  )
  const externalMatchDate = formatMatchDate(nextExternalEvent?.startsAt ?? null)

  return (
    <MobileContainer>
      <section
        className="rounded border border-border bg-panel p-5"
        style={{
          borderTopColor: team.primary_color ?? undefined,
          borderTopWidth: 5,
        }}
      >
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-accent-strong">
          Equipo Ecuador
        </p>
        <div className="mt-4 flex flex-col gap-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div
              className="grid size-20 shrink-0 place-items-center overflow-hidden rounded border border-border bg-background font-mono text-2xl font-black"
              style={{
                backgroundColor: team.primary_color ?? '#111827',
                color: team.secondary_color ?? '#ffffff',
                backgroundImage: team.logo_url
                  ? `url(${team.logo_url})`
                  : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {team.logo_url
                ? null
                : (team.short_name ?? team.name.slice(0, 3).toUpperCase())}
            </div>
            <TeamChantCard chant={teamChant} />
          </div>
          <div>
            <h1 className="text-3xl font-black">{team.name}</h1>
            <p className="mt-2 max-w-2xl text-muted">{team.description}</p>
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-4">
        {scoreFixture ? (
          <article className="rounded border border-border bg-panel p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-muted">
                {scoreFixture.status === 'LIVE'
                  ? 'Marcador en vivo'
                  : 'Ultimo resultado'}
              </p>
              <span className="rounded bg-accent px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white">
                {scoreStatusLabel}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
              <div>
                <p className="text-base font-black">
                  {scoreFixture.home_team?.name}
                </p>
              </div>
              <p className="rounded bg-accent px-4 py-2 text-xl font-black text-white">
                {formatFixtureScore(scoreFixture)}
              </p>
              <div>
                <p className="text-base font-black">
                  {scoreFixture.away_team?.name}
                </p>
              </div>
            </div>
            <p className="mt-4 text-center text-sm text-muted">
              {[
                scoreStatusLabel,
                formatFixtureDateTime(scoreFixture.match_date),
              ]
                .filter(Boolean)
                .join(' - ')}
            </p>
            {scoreFixture.venue ? (
              <p className="mt-2 text-center text-xs text-muted">
                {scoreFixture.venue}
              </p>
            ) : null}
          </article>
        ) : null}

        <article className="rounded border border-border bg-panel p-5">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-muted">
            Proximo partido
          </p>
          {nextExternalEvent ? (
            <div className="mt-4">
              <p className="text-sm text-muted">
                {[nextExternalEvent.league, externalMatchDate]
                  .filter(Boolean)
                  .join(' · ')}
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
                  <h2 className="text-base font-black">
                    {nextExternalEvent.homeTeam}
                  </h2>
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
                  <h2 className="text-base font-black">
                    {nextExternalEvent.awayTeam}
                  </h2>
                </div>
              </div>
              <p className="mt-5 text-center text-sm text-muted">
                {[
                  nextExternalEvent.group
                    ? `Fase ${nextExternalEvent.group}`
                    : null,
                  nextExternalEvent.round
                    ? `Jornada ${nextExternalEvent.round}`
                    : null,
                  nextExternalEvent.season,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              {nextExternalEvent.venue ? (
                <p className="mt-2 text-center text-xs text-muted">
                  {nextExternalEvent.venue}
                </p>
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
            <div className="mt-4 rounded border border-border bg-background/45 p-4">
              <p className="font-black">Proximo partido por confirmar</p>
              <p className="mt-2 text-sm leading-6 text-muted">
                Aun no tenemos una fecha futura confirmada para este equipo.
                Cuando la API o el panel admin tengan el siguiente partido,
                aparecera aqui.
              </p>
            </div>
          )}
        </article>

      </section>

      <VideoCarousel videos={videos} teamName={team.name} />

      <VideoCarousel
        videos={historicMoments}
        teamName={team.name}
        eyebrow="Historia"
        title="Momentos historicos"
      />

      <ImageGalleryCarousel images={galleryImages} teamName={team.name} />

      {equipment.length > 0 ? (
        <section className="mt-6 rounded border border-border bg-panel p-5">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-muted">
            Camisetas historicas
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {equipment.slice(0, 8).map((kit) => (
              <div
                key={kit.id ?? `${kit.season}-${kit.type}`}
                className="rounded border border-border p-3"
              >
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
                <h3 className="mt-3 text-sm font-black">
                  {kit.type ?? 'Equipamiento'}
                </h3>
                <p className="text-xs text-muted">{kit.season}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </MobileContainer>
  )
}
