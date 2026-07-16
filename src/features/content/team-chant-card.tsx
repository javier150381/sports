'use client'

import { useRef, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Music2,
  Play,
} from 'lucide-react'

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
    <div className="min-w-0 max-w-full overflow-hidden md:max-w-[260px]">
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
        className="flex w-full min-w-0 snap-x snap-mandatory gap-3 overflow-x-auto pb-2"
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
              className="min-w-0 flex-[0_0_100%] snap-center overflow-hidden rounded border border-border bg-background"
            >
              <button
                type="button"
                onClick={() => {
                  if (embedUrl) {
                    setActiveChantId(isActive ? null : chant.id)
                  }
                }}
                className="flex w-full items-center gap-3 p-3 text-left transition hover:bg-panel"
              >
                <span className="relative size-14 shrink-0 overflow-hidden rounded bg-black">
                  {chant.image_url ? (
                    <span
                      className="block h-full w-full bg-cover bg-center opacity-80"
                      style={{ backgroundImage: `url("${chant.image_url}")` }}
                    />
                  ) : (
                    <span className="grid h-full place-items-center">
                      <Music2
                        className="size-6 text-accent"
                        aria-hidden="true"
                      />
                    </span>
                  )}
                  <span className="absolute inset-0 grid place-items-center">
                    <span className="grid size-8 place-items-center rounded-full bg-accent text-white">
                      {embedUrl ? (
                        <Play
                          className="ml-0.5 size-4 fill-current"
                          aria-hidden="true"
                        />
                      ) : (
                        <ExternalLink className="size-4" aria-hidden="true" />
                      )}
                    </span>
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-accent-strong">
                    Cantico
                  </span>
                  <span className="mt-1 block truncate text-sm font-black">
                    {chant.title}
                  </span>
                  <span className="mt-1 block text-xs text-muted">
                    {isActive ? 'Toca para ocultar' : 'Escuchar'}
                  </span>
                </span>
              </button>

              {isActive && embedUrl ? (
                <div className="border-t border-border">
                  <div className="relative aspect-video max-h-36 bg-black">
                  <iframe
                    src={embedUrl}
                    title={chant.title}
                    className="absolute inset-0 h-full w-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                  </div>
                </div>
              ) : null}

              {!embedUrl ? (
                <a
                  href={chant.external_url ?? '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="block border-t border-border px-3 py-2 text-xs font-black text-accent-strong"
                >
                  Ver en YouTube
                </a>
              ) : null}
            </article>
          )
        })}
      </div>
    </div>
  )
}
