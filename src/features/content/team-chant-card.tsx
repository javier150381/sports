'use client'

import { useState } from 'react'
import { ExternalLink, Music2, Pause, Play } from 'lucide-react'

type TeamChant = {
  title: string
  description: string | null
  external_url: string | null
  image_url: string | null
}

type TeamChantCardProps = {
  chant: TeamChant | null
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

export function TeamChantCard({ chant }: TeamChantCardProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  if (!chant?.external_url) {
    return null
  }

  const videoId = getYouTubeVideoId(chant.external_url)
  const embedUrl = videoId
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0`
    : null

  return (
    <div className="w-full overflow-hidden rounded border border-border bg-background md:max-w-[240px]">
      <button
        type="button"
        onClick={() => {
          if (embedUrl) {
            setIsExpanded((current) => !current)
            setIsPlaying((current) => !current)
          }
        }}
        className="flex w-full items-center gap-3 p-3 text-left transition hover:bg-panel"
      >
        <span className="grid size-11 shrink-0 place-items-center rounded bg-accent text-white">
          {isPlaying ? (
            <Pause className="size-5" aria-hidden="true" />
          ) : (
            <Music2 className="size-5" aria-hidden="true" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-accent-strong">
            Cantico
          </span>
          <span className="mt-1 block truncate text-sm font-black">
            {chant.title}
          </span>
          <span className="mt-1 block text-xs text-muted">
            {isPlaying ? 'Toca para ocultar' : 'Escuchar cantico'}
          </span>
        </span>
        {embedUrl ? (
          <Play className="size-4 shrink-0 text-muted" aria-hidden="true" />
        ) : (
          <ExternalLink className="size-4 shrink-0 text-muted" aria-hidden="true" />
        )}
      </button>

      {isExpanded && embedUrl ? (
        <div className="border-t border-border">
          <div className="relative aspect-video bg-black">
            <iframe
              src={embedUrl}
              title={chant.title}
              className="absolute inset-0 h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
          {chant.description ? (
            <p className="p-3 text-xs leading-5 text-muted">
              {chant.description}
            </p>
          ) : null}
        </div>
      ) : null}

      {!embedUrl ? (
        <a
          href={chant.external_url}
          target="_blank"
          rel="noreferrer"
          className="block border-t border-border px-3 py-2 text-xs font-black text-accent-strong"
        >
          Ver en YouTube
        </a>
      ) : null}
    </div>
  )
}
