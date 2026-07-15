'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Route } from 'next'
import { requireRole } from '@/server/auth/authorization'
import { createSupabaseServerClient } from '@/server/supabase/server'
import { contentPostInputSchema } from './content-schemas'

function adminContentPath(message: string): Route {
  const params = new URLSearchParams({ message })
  return `/admin/contenidos?${params.toString()}` as Route
}

function adminContentErrorPath(error: string): Route {
  const params = new URLSearchParams({ error })
  return `/admin/contenidos?${params.toString()}` as Route
}

function optionalValue(value: string | undefined) {
  return value && value.trim().length > 0 ? value.trim() : null
}

function getContentErrorCode(message: string) {
  if (
    message.includes('content_type') ||
    message.includes('invalid input value for enum')
  ) {
    return 'content-type'
  }

  return 'save'
}

export async function createContentPostAction(formData: FormData) {
  const profile = await requireRole(['ADMIN', 'EDITOR'])

  if (!profile) {
    redirect('/login')
  }

  const parsed = contentPostInputSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    content_type: formData.get('content_type'),
    external_url: formData.get('external_url'),
    image_url: formData.get('image_url'),
    alt_text: formData.get('alt_text'),
    team_id: formData.get('team_id'),
    status:
      formData.get('intent') === 'publish'
        ? 'PUBLISHED'
        : formData.get('status'),
    is_featured: formData.get('is_featured') === 'on',
    nfc_exclusive: formData.get('nfc_exclusive') === 'on',
    display_order: formData.get('display_order'),
  })

  if (!parsed.success) {
    redirect(adminContentErrorPath('invalid'))
  }

  const input = parsed.data
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('content_posts').insert({
    title: input.title,
    description: optionalValue(input.description),
    content_type: input.content_type,
    external_url: optionalValue(input.external_url),
    image_url: optionalValue(input.image_url),
    alt_text: optionalValue(input.alt_text),
    team_id: optionalValue(input.team_id),
    status: input.status,
    is_featured: input.is_featured,
    nfc_exclusive: input.nfc_exclusive,
    display_order: input.display_order,
    published_at:
      input.status === 'PUBLISHED' ? new Date().toISOString() : null,
    created_by: profile.id,
  })

  if (error) {
    redirect(adminContentErrorPath(getContentErrorCode(error.message)))
  }

  revalidatePath('/admin/contenidos')
  revalidatePath('/equipos')
  revalidatePath('/equipos/[slug]', 'page')
  redirect(
    adminContentPath(input.status === 'PUBLISHED' ? 'published' : 'saved'),
  )
}

export async function updateContentStatusAction(formData: FormData) {
  const profile = await requireRole(['ADMIN', 'EDITOR'])

  if (!profile) {
    redirect('/login')
  }

  const id = String(formData.get('id') ?? '')
  const status = String(formData.get('status') ?? '')
  const parsedStatus = contentPostInputSchema.shape.status.safeParse(status)

  if (!id || !parsedStatus.success) {
    throw new Error('Estado invalido.')
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from('content_posts')
    .update({
      status: parsedStatus.data,
      published_at:
        parsedStatus.data === 'PUBLISHED' ? new Date().toISOString() : null,
    })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin/contenidos')
  revalidatePath('/equipos')
  revalidatePath('/equipos/[slug]', 'page')
  redirect(
    adminContentPath(parsedStatus.data === 'PUBLISHED' ? 'published' : 'saved'),
  )
}

export async function moveContentPostAction(formData: FormData) {
  const profile = await requireRole(['ADMIN', 'EDITOR'])

  if (!profile) {
    redirect('/login')
  }

  const id = String(formData.get('id') ?? '')
  const direction = String(formData.get('direction') ?? '')

  if (!id || (direction !== 'up' && direction !== 'down')) {
    throw new Error('Movimiento invalido.')
  }

  const supabase = await createSupabaseServerClient()
  const { data: currentPost, error: currentPostError } = await supabase
    .from('content_posts')
    .select('id, team_id')
    .eq('id', id)
    .single()

  if (currentPostError || !currentPost) {
    throw new Error(currentPostError?.message ?? 'Contenido no encontrado.')
  }

  let query = supabase
    .from('content_posts')
    .select('id, display_order, created_at')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })

  query = currentPost.team_id
    ? query.eq('team_id', currentPost.team_id)
    : query.is('team_id', null)

  const { data: posts, error: postsError } = await query

  if (postsError) {
    throw new Error(postsError.message)
  }

  const orderedPosts = posts ?? []
  const currentIndex = orderedPosts.findIndex((post) => post.id === id)

  if (currentIndex < 0) {
    throw new Error('Contenido no encontrado en el listado.')
  }

  const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

  if (nextIndex < 0 || nextIndex >= orderedPosts.length) {
    revalidatePath('/admin/contenidos')
    revalidatePath('/equipos')
    return
  }

  const reorderedPosts = [...orderedPosts]
  const [selectedPost] = reorderedPosts.splice(currentIndex, 1)
  reorderedPosts.splice(nextIndex, 0, selectedPost)

  const updates = reorderedPosts.map((post, index) =>
    supabase
      .from('content_posts')
      .update({ display_order: index })
      .eq('id', post.id),
  )

  const results = await Promise.all(updates)
  const error = results.find((result) => result.error)?.error

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin/contenidos')
  revalidatePath('/equipos')
}

export async function updateContentPostAction(formData: FormData) {
  const profile = await requireRole(['ADMIN', 'EDITOR'])

  if (!profile) {
    redirect('/login')
  }

  const id = String(formData.get('id') ?? '')

  if (!id) {
    throw new Error('Contenido invalido.')
  }

  const parsed = contentPostInputSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    content_type: formData.get('content_type'),
    external_url: formData.get('external_url'),
    image_url: formData.get('image_url'),
    alt_text: formData.get('alt_text'),
    team_id: formData.get('team_id'),
    status:
      formData.get('intent') === 'publish'
        ? 'PUBLISHED'
        : formData.get('status'),
    is_featured: formData.get('is_featured') === 'on',
    nfc_exclusive: formData.get('nfc_exclusive') === 'on',
    display_order: formData.get('display_order'),
  })

  if (!parsed.success) {
    redirect(adminContentErrorPath('invalid'))
  }

  const input = parsed.data
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from('content_posts')
    .update({
      title: input.title,
      description: optionalValue(input.description),
      content_type: input.content_type,
      external_url: optionalValue(input.external_url),
      image_url: optionalValue(input.image_url),
      alt_text: optionalValue(input.alt_text),
      team_id: optionalValue(input.team_id),
      status: input.status,
      is_featured: input.is_featured,
      nfc_exclusive: input.nfc_exclusive,
      display_order: input.display_order,
      published_at:
        input.status === 'PUBLISHED' ? new Date().toISOString() : null,
    })
    .eq('id', id)

  if (error) {
    redirect(adminContentErrorPath(getContentErrorCode(error.message)))
  }

  revalidatePath('/admin/contenidos')
  revalidatePath('/equipos')
  revalidatePath('/equipos/[slug]', 'page')
  redirect(
    adminContentPath(input.status === 'PUBLISHED' ? 'published' : 'saved'),
  )
}

export async function deleteContentPostAction(formData: FormData) {
  const profile = await requireRole(['ADMIN', 'EDITOR'])

  if (!profile) {
    redirect('/login')
  }

  const id = String(formData.get('id') ?? '')

  if (!id) {
    throw new Error('Contenido invalido.')
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('content_posts').delete().eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin/contenidos')
  revalidatePath('/equipos')
  revalidatePath('/equipos/[slug]', 'page')
  redirect(adminContentPath('deleted'))
}
