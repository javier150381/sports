'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireRole } from '@/server/auth/authorization'
import { createSupabaseServerClient } from '@/server/supabase/server'
import { contentPostInputSchema } from './content-schemas'

function optionalValue(value: string | undefined) {
  return value && value.trim().length > 0 ? value.trim() : null
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
    status: formData.get('status'),
    is_featured: formData.get('is_featured') === 'on',
    nfc_exclusive: formData.get('nfc_exclusive') === 'on',
    display_order: formData.get('display_order'),
  })

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Contenido invalido.')
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
    published_at: input.status === 'PUBLISHED' ? new Date().toISOString() : null,
    created_by: profile.id,
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin/contenidos')
  revalidatePath('/equipos')
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
      published_at: parsedStatus.data === 'PUBLISHED' ? new Date().toISOString() : null,
    })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin/contenidos')
  revalidatePath('/equipos')
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
}
