'use client'

import { useEffect } from 'react'

type TikTokEmbedProps = {
  url: string
  title: string
}

export function TikTokEmbed({ url, title }: TikTokEmbedProps) {
  useEffect(() => {
    const existingScript = document.getElementById('tiktok-embed-script')
    existingScript?.remove()

    const script = document.createElement('script')
    script.id = 'tiktok-embed-script'
    script.src = 'https://www.tiktok.com/embed.js'
    script.async = true
    document.body.appendChild(script)

    return () => {
      script.remove()
    }
  }, [url])

  return (
    <div className="bg-black px-2 py-4">
      <blockquote
        cite={url}
        className="tiktok-embed mx-auto max-w-[325px]"
        data-video-id=""
        style={{ minWidth: 280 }}
      >
        <section>
          <a href={url} target="_blank" rel="noreferrer">
            {title}
          </a>
        </section>
      </blockquote>
    </div>
  )
}
