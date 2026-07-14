type MatchPageProps = {
  params: Promise<{ id: string }>
}

export default async function MatchPage({ params }: MatchPageProps) {
  const { id } = await params

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-accent-strong">Partido</p>
      <h1 className="mt-2 text-3xl font-black">Partido {id}</h1>
      <p className="mt-3 text-muted">
        La experiencia PRE_MATCH, LIVE y POST_MATCH se implementara con el proveedor demo en Fase 3.
      </p>
    </main>
  )
}
