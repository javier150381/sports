import { notFound } from 'next/navigation'
import Image from 'next/image'
import { MobileContainer } from '@/components/mobile-container'
import { getTeamBySlug } from '@/server/teams/queries'

type TeamPageProps = {
  params: Promise<{ slug: string }>
}

export const dynamic = 'force-dynamic'

function getYouTubeEmbedUrl(url: string | null) {
  if (!url) {
    return null
  }

  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace('www.', '')

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const videoId = parsed.searchParams.get('v')
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null
    }

    if (host === 'youtu.be') {
      const videoId = parsed.pathname.split('/').filter(Boolean)[0]
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null
    }
  } catch {
    return null
  }

  return null
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { slug } = await params
  const team = await getTeamBySlug(slug)

  if (!team) {
    notFound()
  }

  const nextFixture = team.fixtures.find((fixture) => new Date(fixture.match_date) > new Date())
  const liveFixture = team.fixtures.find((fixture) => fixture.status === 'LIVE')

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
          {nextFixture ? (
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
            <p className="mt-4 text-muted">No hay proximos partidos demo para este equipo.</p>
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
          {team.content.map((post) => {
            const youtubeEmbedUrl = getYouTubeEmbedUrl(post.external_url)

            return (
              <article key={post.id} className="overflow-hidden rounded border border-border bg-panel">
                {youtubeEmbedUrl ? (
                  <div className="aspect-video bg-black">
                    <iframe
                      src={youtubeEmbedUrl}
                      title={post.title}
                      className="h-full w-full"
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
                  {post.external_url && !youtubeEmbedUrl ? (
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
          {team.content.length === 0 ? (
            <p className="rounded border border-border bg-panel p-5 text-muted">
              Todavia no hay contenido publicado para este equipo.
            </p>
          ) : null}
        </div>
      </section>
    </MobileContainer>
  )
}
