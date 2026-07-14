type EventPageProps = {
  params: Promise<{ slug: string }>
}

export default async function EventPage({ params }: EventPageProps) {
  const { slug } = await params

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-accent-strong">
        Evento especial
      </p>
      <h1 className="mt-2 text-3xl font-black">{slug}</h1>
      <p className="mt-3 text-muted">
        Experiencia para finales, lanzamientos y eventos especiales.
      </p>
    </main>
  )
}
