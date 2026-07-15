'use client'

import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, ExternalLink, Play, Share2 } from 'lucide-react'

type VideoItem = {
  id: string
  title: string
  description: string | null
  image_url: string | null
  external_url: string | null
  alt_text: string | null
  content_type: string
}

type VideoCarouselProps = {
  videos: VideoItem[]
  teamName: string
}

function getEmbedUrl(url: string | null) {
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

    if (host === 'drive.google.com') {
      const parts = parsed.pathname.split('/').filter(Boolean)
      const fileIndex = parts.findIndex((part) => part === 'd')
      const fileId = fileIndex >= 0 ? parts[fileIndex + 1] : parsed.searchParams.get('id')
      return fileId ? `https://drive.google.com/file/d/${fileId}/preview` : null
    }

    if (host === 'tiktok.com' || host === 'm.tiktok.com') {
      const parts = parsed.pathname.split('/').filter(Boolean)
      const videoIndex = parts.findIndex((part) => part === 'video')
      const videoId = videoIndex >= 0 ? parts[videoIndex + 1] : null
      return videoId ? `https://www.tiktok.com/embed/v2/${videoId}` : null
    }
  } catch {
    return null
  }

  return null
}

export function VideoCarousel({ videos, teamName }: VideoCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null)
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null)

  if (videos.length === 0) {
    return null
  }

  function scrollVideos(direction: 'left' | 'right') {
    const carousel = carouselRef.current

    if (!carousel) {
      return
    }

    carousel.scrollBy({
      left: direction === 'right' ? carousel.clientWidth * 0.86 : carousel.clientWidth * -0.86,
      behavior: 'smooth',
    })
  }

  async function shareVideo(video: VideoItem) {
    const shareUrl = video.external_url || window.location.href
    const text = video.description || `Mira este video de ${teamName} en KUNTUR SPORT.`

    try {
      if (navigator.share) {
        await navigator.share({ title: video.title, text, url: shareUrl })
        return
      }

      await navigator.clipboard.writeText(shareUrl)
      window.alert('Enlace copiado para compartir.')
    } catch {
      window.alert('No se pudo compartir este video.')
    }
  }

  return (
    <section className="mt-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-strong">
            Videos
          </p>
          <h2 className="mt-1 text-2xl font-black">Videos recientes</h2>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted">{videos.length} videos</p>
          {videos.length > 1 ? (
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => scrollVideos('left')}
                className="grid size-9 place-items-center rounded border border-border bg-panel text-white transition hover:border-accent"
                aria-label="Ver video anterior"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => scrollVideos('right')}
                className="grid size-9 place-items-center rounded border border-border bg-panel text-white transition hover:border-accent"
                aria-label="Ver siguiente video"
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
        {videos.map((video) => {
          const embedUrl = getEmbedUrl(video.external_url)
          const isActive = activeVideoId === video.id
          const isLiveStream = video.content_type === 'LIVE_STREAM'

          return (
            <article
              key={video.id}
              className="min-w-[84%] snap-center overflow-hidden rounded border border-border bg-panel sm:min-w-[58%]"
            >
              <div className="relative aspect-video bg-black">
                {isLiveStream && video.external_url ? (
                  <a
                    href={video.external_url}
                    target="_blank"
                    rel="noreferrer"
                    className="relative block h-full w-full overflow-hidden"
                  >
                    {video.image_url ? (
                      <div
                        role="img"
                        aria-label={video.alt_text || video.title}
                        className="h-full w-full bg-cover bg-center opacity-80"
                        style={{ backgroundImage: `url("${video.image_url}")` }}
                      />
                    ) : (
                      <div className="grid h-full place-items-center p-6 text-center">
                        <p className="text-xl font-black">{video.title}</p>
                      </div>
                    )}
                    <span className="absolute inset-0 grid place-items-center">
                      <span className="grid size-14 place-items-center rounded-full bg-accent text-white">
                        <ExternalLink className="size-6" aria-hidden="true" />
                      </span>
                    </span>
                  </a>
                ) : isActive && embedUrl ? (
                  <iframe
                    src={embedUrl}
                    title={video.title}
                    className="absolute inset-0 h-full w-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveVideoId(video.id)}
                    className="relative h-full w-full overflow-hidden text-left"
                  >
                    {video.image_url ? (
                      <div
                        role="img"
                        aria-label={video.alt_text || video.title}
                        className="h-full w-full bg-cover bg-center opacity-80"
                        style={{ backgroundImage: `url("${video.image_url}")` }}
                      />
                    ) : (
                      <div className="grid h-full place-items-center p-6 text-center">
                        <p className="text-xl font-black">{video.title}</p>
                      </div>
                    )}
                    <span className="absolute inset-0 grid place-items-center">
                      <span className="grid size-14 place-items-center rounded-full bg-accent text-white">
                        <Play className="ml-1 size-6 fill-current" aria-hidden="true" />
                      </span>
                    </span>
                  </button>
                )}
              </div>
              <div className="p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent-strong">
                  {isLiveStream ? 'Transmision en vivo' : 'Reciente'}
                </p>
                <h3 className="mt-2 font-black">{video.title}</h3>
                {video.description ? (
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">
                    {video.description}
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  {isLiveStream && video.external_url ? (
                    <a
                      href={video.external_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded bg-accent px-4 py-2 text-sm font-black text-white transition hover:bg-accent-strong"
                    >
                      <ExternalLink className="size-4" aria-hidden="true" />
                      Ver transmision
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void shareVideo(video)}
                    className="inline-flex items-center gap-2 rounded border border-border px-4 py-2 text-sm font-black text-white transition hover:border-accent"
                  >
                    <Share2 className="size-4" aria-hidden="true" />
                    Compartir
                  </button>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
