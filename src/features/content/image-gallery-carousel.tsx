'use client'

import { useRef } from 'react'
import { ChevronLeft, ChevronRight, Share2 } from 'lucide-react'

type ImageGalleryItem = {
  id: string
  title: string
  description: string | null
  image_url: string | null
  external_url: string | null
  alt_text: string | null
}

type ImageGalleryCarouselProps = {
  images: ImageGalleryItem[]
  teamName: string
}

export function ImageGalleryCarousel({
  images,
  teamName,
}: ImageGalleryCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null)

  if (images.length === 0) {
    return null
  }

  function scrollImages(direction: 'left' | 'right') {
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

  async function shareImage(image: ImageGalleryItem) {
    const shareUrl = image.external_url || image.image_url || window.location.href
    const text =
      image.description || `Mira esta imagen de ${teamName} en KUNTUR SPORT.`

    try {
      if (navigator.share) {
        await navigator.share({
          title: image.title,
          text,
          url: shareUrl,
        })
        return
      }

      await navigator.clipboard.writeText(shareUrl)
      window.alert('Enlace copiado para compartir.')
    } catch {
      window.alert('No se pudo compartir esta imagen.')
    }
  }

  return (
    <section className="mt-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-strong">
            Galeria
          </p>
          <h2 className="mt-1 text-2xl font-black">Galeria de imagenes</h2>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted">{images.length} imagenes</p>
          {images.length > 1 ? (
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => scrollImages('left')}
                className="grid size-9 place-items-center rounded border border-border bg-panel text-white transition hover:border-accent"
                aria-label="Ver imagen anterior"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => scrollImages('right')}
                className="grid size-9 place-items-center rounded border border-border bg-panel text-white transition hover:border-accent"
                aria-label="Ver siguiente imagen"
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
        {images.map((image) => (
          <article
            key={image.id}
            className="min-w-[84%] snap-center overflow-hidden rounded border border-border bg-panel sm:min-w-[58%]"
          >
            <div className="relative aspect-[4/5] bg-background">
              {image.image_url ? (
                <div
                  role="img"
                  aria-label={image.alt_text || image.title}
                  className="h-full w-full bg-cover bg-center"
                  style={{ backgroundImage: `url("${image.image_url}")` }}
                />
              ) : (
                <div className="grid h-full place-items-center p-6 text-center">
                  <p className="text-2xl font-black">{image.title}</p>
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-black">{image.title}</h3>
              {image.description ? (
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">
                  {image.description}
                </p>
              ) : null}
              <button
                type="button"
                onClick={() => void shareImage(image)}
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
