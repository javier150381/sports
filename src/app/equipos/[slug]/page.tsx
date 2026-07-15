import { notFound } from 'next/navigation'
import Image from 'next/image'
import { MobileContainer } from '@/components/mobile-container'
import { TikTokEmbed } from '@/features/content/tiktok-embed'
import { MemeCarousel } from '@/features/content/meme-carousel'
import { getNextExternalTeamEvents } from '@/server/football/thesportsdb-provider'
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

export default async function TeamPage({ params }: TeamPageProps) {
  const { slug } = await params
  const team = await getTeamBySlug(slug)

  if (!team) {
    notFound()
  }

  const externalEvents = await getNextExternalTeamEvents(team.external_api_id)
  const nextExternalEvent = externalEvents[0] ?? null
  const nextFixture = team.fixtures.find((fixture) => new Date(fixture.match_date) > new Date())
  const liveFixture = team.fixtures.find((fixture) => fixture.status === 'LIVE')
  const memes = team.content.filter((post) => post.content_type === 'MEME')
  const featuredContent = team.content.filter((post) => post.content_type !== 'MEME')
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

      <section className="mt-6">
        <h2 className="text-2xl font-black">Contenido destacado</h2>
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
