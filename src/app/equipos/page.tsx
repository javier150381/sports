import Link from 'next/link'
import { MobileContainer } from '@/components/mobile-container'
import { getActiveTeams } from '@/server/teams/queries'

export const dynamic = 'force-dynamic'

export default async function TeamsPage() {
  const teams = await getActiveTeams()

  return (
    <MobileContainer>
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-accent-strong">
        Ecuador
      </p>
      <h1 className="mt-2 text-3xl font-black">Equipos</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Experiencias demo conectadas a Supabase para Macara, Liga de Quito y Barcelona SC.
      </p>

      <section className="mt-6 grid gap-4">
        {teams.map((team) => (
          <Link
            key={team.id}
            href={`/equipos/${team.slug}`}
            className="group rounded border border-border bg-panel p-5 transition hover:border-accent"
          >
            <div
              className="grid size-14 place-items-center overflow-hidden rounded border border-border bg-background font-mono text-lg font-black text-white"
              style={{
                backgroundColor: team.primary_color ?? '#111827',
                color: team.secondary_color ?? '#ffffff',
                backgroundImage: team.logo_url ? `url(${team.logo_url})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {team.logo_url ? null : (team.short_name ?? team.name.slice(0, 3).toUpperCase())}
            </div>
            <h2 className="mt-5 text-xl font-black group-hover:text-white">{team.name}</h2>
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">{team.description}</p>
          </Link>
        ))}
      </section>
    </MobileContainer>
  )
}
