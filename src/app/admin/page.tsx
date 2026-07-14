const metrics = [
  'Usuarios',
  'Camisetas registradas',
  'Activaciones',
  'Escaneos NFC',
  'Contenidos publicados',
  'Pronosticos',
  'Votos',
  'Partidos proximos',
  'Partidos en vivo',
]

export default function AdminPage() {
  return (
    <div>
      <h1 className="text-3xl font-black">Dashboard</h1>
      <p className="mt-3 text-muted">Metricas administrativas de KUNTUR SPORT.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => (
          <article key={metric} className="rounded border border-border bg-panel p-5">
            <p className="text-sm text-muted">{metric}</p>
            <p className="mt-3 font-mono text-3xl font-black">0</p>
          </article>
        ))}
      </div>
    </div>
  )
}
