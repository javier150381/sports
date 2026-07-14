import {
  createContentPostAction,
  deleteContentPostAction,
  moveContentPostAction,
  updateContentPostAction,
  updateContentStatusAction,
} from '@/server/admin/content-actions'
import { getAdminContentPageData } from '@/server/admin/content-queries'
import { ConfirmSubmitButton } from '@/features/admin/confirm-submit-button'
import { ArrowDown, ArrowUp } from 'lucide-react'

const contentTypes = [
  'NEWS',
  'VIDEO',
  'GOAL_VIDEO',
  'HIGHLIGHT',
  'MEME',
  'IMAGE',
  'PROMOTION',
  'LIVE_STREAM',
  'WALLPAPER',
  'ANNOUNCEMENT',
]

export const dynamic = 'force-dynamic'

export default async function AdminContentPage() {
  const { teams, posts } = await getAdminContentPageData()

  return (
    <div>
      <h1 className="text-3xl font-black">Contenidos</h1>
      <p className="mt-3 text-muted">
        Publica enlaces oficiales, memes, imagenes, promociones y etiquetas visuales por equipo.
      </p>

      <form action={createContentPostAction} className="mt-8 rounded border border-border bg-panel p-5">
        <h2 className="text-xl font-black">Nuevo contenido</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold">
            Titulo
            <input name="title" className="rounded border border-border bg-background px-3 py-3" required />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Tipo
            <select
              name="content_type"
              className="rounded border border-border bg-background px-3 py-3"
              defaultValue="NEWS"
            >
              {contentTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold md:col-span-2">
            Descripcion
            <textarea name="description" className="min-h-24 rounded border border-border bg-background px-3 py-3" />
          </label>
          <fieldset className="grid gap-3 text-sm font-semibold md:col-span-2">
            <legend>Equipo relacionado</legend>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="rounded border border-border bg-background px-3 py-3">
                <input name="team_id" type="radio" value="" defaultChecked className="mr-2" />
                Sin equipo
              </label>
              {teams.map((team) => (
                <label
                  key={team.id}
                  className="rounded border border-border bg-background px-3 py-3"
                  style={{ borderLeftColor: team.primary_color ?? undefined, borderLeftWidth: 4 }}
                >
                  <input name="team_id" type="radio" value={team.id} className="mr-2" />
                  {team.name}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="grid gap-2 text-sm font-semibold">
            Estado
            <select
              name="status"
              className="rounded border border-border bg-background px-3 py-3"
              defaultValue="PUBLISHED"
            >
              <option value="DRAFT">Borrador</option>
              <option value="SCHEDULED">Programado</option>
              <option value="PUBLISHED">Publicado</option>
              <option value="ARCHIVED">Archivado</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            URL externa
            <input
              name="external_url"
              type="text"
              placeholder="https://..."
              className="rounded border border-border bg-background px-3 py-3"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            URL de imagen o grafico
            <input
              name="image_url"
              type="text"
              placeholder="https://..."
              className="rounded border border-border bg-background px-3 py-3"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Texto alternativo / etiqueta
            <input name="alt_text" className="rounded border border-border bg-background px-3 py-3" />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Orden
            <input
              name="display_order"
              type="number"
              min="0"
              defaultValue="0"
              className="rounded border border-border bg-background px-3 py-3"
            />
          </label>
        </div>
        <div className="mt-5 flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input name="is_featured" type="checkbox" defaultChecked />
            Destacado
          </label>
          <label className="flex items-center gap-2">
            <input name="nfc_exclusive" type="checkbox" />
            Exclusivo NFC
          </label>
        </div>
        <button className="mt-6 rounded bg-accent px-5 py-3 font-black text-white" type="submit">
          Publicar contenido
        </button>
      </form>

      <section className="mt-8">
        <h2 className="text-xl font-black">Contenido existente</h2>
        <div className="mt-4 grid gap-4">
          {posts.map((post) => (
            <article key={post.id} className="rounded border border-border bg-panel p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent-strong">
                    {post.content_type} · {post.status}
                  </p>
                  <h3 className="mt-2 text-lg font-black">{post.title}</h3>
                  <p className="mt-2 text-sm text-muted">{post.description}</p>
                  <p className="mt-3 text-xs text-muted">
                    Equipo: {post.team?.name ?? 'Sin equipo'} · Orden: {post.display_order}
                  </p>
                  {post.external_url ? (
                    <p className="mt-2 break-all text-xs text-muted">Enlace: {post.external_url}</p>
                  ) : null}
                  {post.image_url ? (
                    <p className="mt-2 break-all text-xs text-muted">Imagen: {post.image_url}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <form action={moveContentPostAction}>
                    <input type="hidden" name="id" value={post.id} />
                    <input type="hidden" name="direction" value="up" />
                    <button
                      className="inline-flex items-center gap-2 rounded border border-border px-3 py-2 text-sm font-bold"
                      type="submit"
                    >
                      <ArrowUp className="size-4" aria-hidden="true" />
                      Subir
                    </button>
                  </form>
                  <form action={moveContentPostAction}>
                    <input type="hidden" name="id" value={post.id} />
                    <input type="hidden" name="direction" value="down" />
                    <button
                      className="inline-flex items-center gap-2 rounded border border-border px-3 py-2 text-sm font-bold"
                      type="submit"
                    >
                      <ArrowDown className="size-4" aria-hidden="true" />
                      Bajar
                    </button>
                  </form>
                  <form action={updateContentStatusAction}>
                    <input type="hidden" name="id" value={post.id} />
                    <input type="hidden" name="status" value="PUBLISHED" />
                    <button className="rounded border border-border px-3 py-2 text-sm font-bold" type="submit">
                      Publicar
                    </button>
                  </form>
                  <form action={updateContentStatusAction}>
                    <input type="hidden" name="id" value={post.id} />
                    <input type="hidden" name="status" value="ARCHIVED" />
                    <button className="rounded border border-border px-3 py-2 text-sm font-bold" type="submit">
                      Archivar
                    </button>
                  </form>
                  <form action={deleteContentPostAction}>
                    <input type="hidden" name="id" value={post.id} />
                    <ConfirmSubmitButton
                      message={`¿Eliminar "${post.title}" definitivamente?`}
                      className="rounded border border-accent/70 px-3 py-2 text-sm font-bold text-accent-strong"
                    >
                      Eliminar
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </div>
              <details className="mt-5 rounded border border-border bg-background/55 p-4">
                <summary className="cursor-pointer font-bold text-white">Editar contenido</summary>
                <form action={updateContentPostAction} className="mt-5 grid gap-4">
                  <input type="hidden" name="id" value={post.id} />
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-2 text-sm font-semibold">
                      Titulo
                      <input
                        name="title"
                        defaultValue={post.title}
                        className="rounded border border-border bg-background px-3 py-3"
                        required
                      />
                    </label>
                    <label className="grid gap-2 text-sm font-semibold">
                      Tipo
                      <select
                        name="content_type"
                        className="rounded border border-border bg-background px-3 py-3"
                        defaultValue={post.content_type}
                      >
                        {contentTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-2 text-sm font-semibold md:col-span-2">
                      Descripcion
                      <textarea
                        name="description"
                        defaultValue={post.description ?? ''}
                        className="min-h-24 rounded border border-border bg-background px-3 py-3"
                      />
                    </label>
                    <label className="grid gap-2 text-sm font-semibold">
                      Equipo relacionado
                      <select
                        name="team_id"
                        className="rounded border border-border bg-background px-3 py-3"
                        defaultValue={teams.find((team) => team.slug === post.team?.slug)?.id ?? ''}
                      >
                        <option value="">Sin equipo</option>
                        {teams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-2 text-sm font-semibold">
                      Estado
                      <select
                        name="status"
                        className="rounded border border-border bg-background px-3 py-3"
                        defaultValue={post.status}
                      >
                        <option value="DRAFT">Borrador</option>
                        <option value="SCHEDULED">Programado</option>
                        <option value="PUBLISHED">Publicado</option>
                        <option value="ARCHIVED">Archivado</option>
                      </select>
                    </label>
                    <label className="grid gap-2 text-sm font-semibold">
                      URL externa
                      <input
                        name="external_url"
                        type="text"
                        defaultValue={post.external_url ?? ''}
                        className="rounded border border-border bg-background px-3 py-3"
                      />
                    </label>
                    <label className="grid gap-2 text-sm font-semibold">
                      URL de imagen o grafico
                      <input
                        name="image_url"
                        type="text"
                        defaultValue={post.image_url ?? ''}
                        className="rounded border border-border bg-background px-3 py-3"
                      />
                    </label>
                    <label className="grid gap-2 text-sm font-semibold">
                      Texto alternativo / etiqueta
                      <input
                        name="alt_text"
                        defaultValue={post.alt_text ?? ''}
                        className="rounded border border-border bg-background px-3 py-3"
                      />
                    </label>
                    <label className="grid gap-2 text-sm font-semibold">
                      Orden
                      <input
                        name="display_order"
                        type="number"
                        min="0"
                        defaultValue={post.display_order}
                        className="rounded border border-border bg-background px-3 py-3"
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <label className="flex items-center gap-2">
                      <input name="is_featured" type="checkbox" defaultChecked={post.is_featured} />
                      Destacado
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        name="nfc_exclusive"
                        type="checkbox"
                        defaultChecked={post.nfc_exclusive}
                      />
                      Exclusivo NFC
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button className="rounded border border-border px-5 py-3 font-black text-white" type="submit">
                      Guardar cambios
                    </button>
                    <button
                      className="rounded bg-accent px-5 py-3 font-black text-white"
                      name="intent"
                      value="publish"
                      type="submit"
                    >
                      Guardar y publicar
                    </button>
                  </div>
                </form>
              </details>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
