import { createTeamAction, updateTeamAction } from '@/server/admin/team-actions'
import { getAdminTeams } from '@/server/admin/team-queries'

export const dynamic = 'force-dynamic'

export default async function AdminTeamsPage() {
  const teams = await getAdminTeams()

  return (
    <div>
      <h1 className="text-3xl font-black">Equipos</h1>
      <p className="mt-3 text-muted">
        Edita la ficha publica de cada equipo. Para Macará puedes preparar la experiencia de
        Sudamericana con descripcion, colores, logo y referencia API.
      </p>

      <form action={createTeamAction} className="mt-8 rounded border border-border bg-panel p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent-strong">
              Nuevo equipo
            </p>
            <h2 className="mt-2 text-2xl font-black">Crear equipo</h2>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input name="active" type="checkbox" defaultChecked />
            Activo
          </label>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold">
            Nombre
            <input
              name="name"
              className="rounded border border-border bg-background px-3 py-3"
              placeholder="Ej: El Nacional"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Nombre corto
            <input
              name="short_name"
              className="rounded border border-border bg-background px-3 py-3"
              placeholder="Ej: NAC"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold md:col-span-2">
            Descripcion
            <textarea
              name="description"
              className="min-h-24 rounded border border-border bg-background px-3 py-3"
              placeholder="Ficha publica del equipo..."
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            URL de logo
            <input
              name="logo_url"
              type="url"
              placeholder="https://..."
              className="rounded border border-border bg-background px-3 py-3"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            ID API deportiva
            <input
              name="external_api_id"
              placeholder="Opcional"
              className="rounded border border-border bg-background px-3 py-3"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Color principal
            <input
              name="primary_color"
              type="color"
              defaultValue="#111827"
              className="h-12 rounded border border-border bg-background px-2 py-2"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Color secundario
            <input
              name="secondary_color"
              type="color"
              defaultValue="#ffffff"
              className="h-12 rounded border border-border bg-background px-2 py-2"
            />
          </label>
        </div>

        <button type="submit" className="mt-5 rounded bg-accent px-5 py-3 font-black text-white">
          Crear equipo
        </button>
      </form>

      <div className="mt-8 grid gap-5">
        {teams.map((team) => (
          <form key={team.id} action={updateTeamAction} className="rounded border border-border bg-panel p-5">
            <input type="hidden" name="id" value={team.id} />
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent-strong">
                  {team.slug}
                </p>
                <h2 className="mt-2 text-2xl font-black">{team.name}</h2>
              </div>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input name="active" type="checkbox" defaultChecked={team.active} />
                Activo
              </label>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold">
                Nombre
                <input
                  name="name"
                  defaultValue={team.name}
                  className="rounded border border-border bg-background px-3 py-3"
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Nombre corto
                <input
                  name="short_name"
                  defaultValue={team.short_name ?? ''}
                  className="rounded border border-border bg-background px-3 py-3"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold md:col-span-2">
                Descripcion
                <textarea
                  name="description"
                  defaultValue={team.description ?? ''}
                  className="min-h-28 rounded border border-border bg-background px-3 py-3"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                URL de logo
                <input
                  name="logo_url"
                  type="url"
                  defaultValue={team.logo_url ?? ''}
                  placeholder="https://..."
                  className="rounded border border-border bg-background px-3 py-3"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                ID API deportiva
                <input
                  name="external_api_id"
                  defaultValue={team.external_api_id ?? ''}
                  className="rounded border border-border bg-background px-3 py-3"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Color principal
                <input
                  name="primary_color"
                  type="color"
                  defaultValue={team.primary_color ?? '#111827'}
                  className="h-12 rounded border border-border bg-background px-2 py-2"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Color secundario
                <input
                  name="secondary_color"
                  type="color"
                  defaultValue={team.secondary_color ?? '#ffffff'}
                  className="h-12 rounded border border-border bg-background px-2 py-2"
                />
              </label>
            </div>

            <button type="submit" className="mt-5 rounded bg-accent px-5 py-3 font-black text-white">
              Guardar equipo
            </button>
          </form>
        ))}
      </div>
    </div>
  )
}
