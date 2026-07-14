'use client'

import { useRef } from 'react'
import { ChevronLeft, ChevronRight, Share2 } from 'lucide-react'

type MemeItem = {
  id: string
  title: string
  description: string | null
  image_url: string | null
  external_url: string | null
  alt_text: string | null
}

type MemeCarouselProps = {
  memes: MemeItem[]
  teamName: string
}

export function MemeCarousel({ memes, teamName }: MemeCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null)

  if (memes.length === 0) {
    return null
  }

  function scrollMemes(direction: 'left' | 'right') {
    const carousel = carouselRef.current

    if (!carousel) {
      return
    }

    carousel.scrollBy({
      left: direction === 'right' ? carousel.clientWidth * 0.86 : carousel.clientWidth * -0.86,
      behavior: 'smooth',
    })
  }

  async function shareMeme(meme: MemeItem) {
    const shareUrl = meme.external_url || meme.image_url || window.location.href
    const text = meme.description || `Mira este meme de ${teamName} en KUNTUR SPORT.`

    try {
      if (navigator.share) {
        await navigator.share({
          title: meme.title,
          text,
          url: shareUrl,
        })
        return
      }

      await navigator.clipboard.writeText(shareUrl)
      window.alert('Enlace copiado para compartir.')
    } catch {
      window.alert('No se pudo compartir este meme. Intenta copiar el enlace manualmente.')
    }
  }

  return (
    <section className="mt-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-strong">
            Hinchada
          </p>
          <h2 className="mt-1 text-2xl font-black">Memes recientes</h2>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted">{memes.length} memes</p>
          {memes.length > 1 ? (
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => scrollMemes('left')}
                className="grid size-9 place-items-center rounded border border-border bg-panel text-white transition hover:border-accent"
                aria-label="Ver meme anterior"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => scrollMemes('right')}
                className="grid size-9 place-items-center rounded border border-border bg-panel text-white transition hover:border-accent"
                aria-label="Ver siguiente meme"
              >
                <ChevronRight className="size-4" aria-hidden="true" />
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div
        ref={carouselRef}
        className="-mx-4 mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3"
      >
        {memes.map((meme) => (
          <article
            key={meme.id}
            className="min-w-[84%] snap-center overflow-hidden rounded border border-border bg-panel sm:min-w-[58%]"
          >
            <div className="relative aspect-[4/5] bg-background">
              {meme.image_url ? (
                <div
                  role="img"
                  aria-label={meme.alt_text || meme.title}
                  className="h-full w-full bg-cover bg-center"
                  style={{ backgroundImage: `url("${meme.image_url}")` }}
                />
              ) : (
                <div className="grid h-full place-items-center p-6 text-center">
                  <p className="text-2xl font-black">{meme.title}</p>
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-black">{meme.title}</h3>
              {meme.description ? (
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{meme.description}</p>
              ) : null}
              <button
                type="button"
                onClick={() => void shareMeme(meme)}
                className="mt-4 inline-flex items-center gap-2 rounded bg-accent px-4 py-2 text-sm font-black text-white transition hover:bg-accent-strong"
              >
                <Share2 className="size-4" aria-hidden="true" />
                Compartir
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
