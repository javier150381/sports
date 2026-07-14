import Link from 'next/link'
import type { Route } from 'next'
import { redirect } from 'next/navigation'
import { requireRole } from '@/server/auth/authorization'

const adminLinks: Array<[string, Route]> = [
  ['Panel', '/admin'],
  ['Equipos', '/admin/equipos'],
  ['Competiciones', '/admin/competiciones'],
  ['Eventos', '/admin/eventos'],
  ['Colecciones', '/admin/colecciones'],
  ['Camisetas', '/admin/camisetas'],
  ['Partidos', '/admin/partidos'],
  ['Contenidos', '/admin/contenidos'],
  ['Encuestas', '/admin/encuestas'],
  ['Promociones', '/admin/promociones'],
  ['Cupones', '/admin/cupones'],
  ['Usuarios', '/admin/usuarios'],
  ['Configuracion', '/admin/configuracion'],
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(['ADMIN', 'EDITOR'])

  if (!profile) {
    redirect('/login')
  }

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 md:grid-cols-[220px_1fr]">
      <aside className="rounded border border-border bg-panel p-4 md:sticky md:top-24 md:self-start">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-strong">
          Administracion
        </p>
        <p className="mt-2 text-sm text-muted">Rol: {profile.role}</p>
        <nav className="mt-5 grid gap-2 text-sm">
          {adminLinks.map(([label, href]) => (
            <Link key={href} href={href} className="rounded px-3 py-2 hover:bg-panel-strong">
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <section>{children}</section>
    </main>
  )
}
