'use client'

import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, ExternalLink, Music2, Play } from 'lucide-react'

type TeamChant = {
  id: string
  title: string
  description: string | null
  external_url: string | null
  image_url: string | null
}

type TeamChantCarouselProps = {
  chants: TeamChant[]
}

function getYouTubeVideoId(url: string | null) {
  if (!url) {
    return null
  }

  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace('www.', '')
    const parts = parsed.pathname.split('/').filter(Boolean)

    if (host === 'youtu.be') {
      return parts[0] ?? null
    }

    if (
      host === 'youtube.com' ||
      host === 'm.youtube.com' ||
      host === 'music.youtube.com' ||
      host === 'youtube-nocookie.com'
    ) {
      if (
        parts[0] === 'shorts' ||
        parts[0] === 'embed' ||
        parts[0] === 'live'
      ) {
        return parts[1] ?? null
      }

      return parsed.searchParams.get('v')
    }
  } catch {
    return null
  }

  return null
}

export function TeamChantCarousel({ chants }: TeamChantCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null)
  const [activeChantId, setActiveChantId] = useState<string | null>(null)

  const playableChants = chants.filter((chant) => chant.external_url)

  if (playableChants.length === 0) {
    return null
  }

  function scrollChants(direction: 'left' | 'right') {
    const carousel = carouselRef.current

    if (!carousel) {
      return
    }

    carousel.scrollBy({
      left:
        direction === 'right'
          ? carousel.clientWidth * 0.86
          : carousel.clientWidth * -0.86,
      behavior: 'smooth',
    })
  }

  return (
    <div className="w-full md:max-w-[260px]">
      <div className="mb-2 flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-accent-strong">
            Canticos
          </p>
          <p className="text-xs text-muted">{playableChants.length} disponibles</p>
        </div>
        {playableChants.length > 1 ? (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => scrollChants('left')}
              className="grid size-8 place-items-center rounded border border-border bg-background text-white transition hover:border-accent"
              aria-label="Ver cantico anterior"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => scrollChants('right')}
              className="grid size-8 place-items-center rounded border border-border bg-background text-white transition hover:border-accent"
              aria-label="Ver siguiente cantico"
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </div>

      <div
        ref={carouselRef}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2"
      >
        {playableChants.map((chant) => {
          const videoId = getYouTubeVideoId(chant.external_url)
          const embedUrl = videoId
            ? `https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0`
            : null
          const isActive = activeChantId === chant.id

          return (
            <article
              key={chant.id}
              className="min-w-full snap-center overflow-hidden rounded border border-border bg-background"
            >
              <div className="relative aspect-video bg-black">
                {isActive && embedUrl ? (
                  <iframe
                    src={embedUrl}
                    title={chant.title}
                    className="absolute inset-0 h-full w-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (embedUrl) {
                        setActiveChantId(chant.id)
                      }
                    }}
                    className="relative h-full w-full overflow-hidden text-left"
                  >
                    {chant.image_url ? (
                      <div
                        className="h-full w-full bg-cover bg-center opacity-80"
                        style={{ backgroundImage: `url("${chant.image_url}")` }}
                      />
                    ) : (
                      <div className="grid h-full place-items-center">
                        <Music2 className="size-9 text-accent" aria-hidden="true" />
                      </div>
                    )}
                    <span className="absolute inset-0 grid place-items-center">
                      <span className="grid size-12 place-items-center rounded-full bg-accent text-white">
                        {embedUrl ? (
                          <Play
                            className="ml-1 size-5 fill-current"
                            aria-hidden="true"
                          />
                        ) : (
                          <ExternalLink className="size-5" aria-hidden="true" />
                        )}
                      </span>
                    </span>
                  </button>
                )}
              </div>
              <div className="p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-accent-strong">
                  Cantico
                </p>
                <h2 className="mt-1 line-clamp-1 text-sm font-black">
                  {chant.title}
                </h2>
                {chant.description ? (
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">
                    {chant.description}
                  </p>
                ) : null}
                {!embedUrl ? (
                  <a
                    href={chant.external_url ?? '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex text-xs font-black text-accent-strong"
                  >
                    Ver en YouTube
                  </a>
                ) : null}
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
