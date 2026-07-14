'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireRole } from '@/server/auth/authorization'
import { createSupabaseServerClient } from '@/server/supabase/server'
import { teamUpdateSchema } from './team-schemas'

function optionalValue(value: string | undefined) {
  return value && value.trim().length > 0 ? value.trim() : null
}

export async function updateTeamAction(formData: FormData) {
  const profile = await requireRole(['ADMIN'])

  if (!profile) {
    redirect('/login')
  }

  const parsed = teamUpdateSchema.safeParse({
    id: formData.get('id'),
    name: formData.get('name'),
    short_name: formData.get('short_name'),
    description: formData.get('description'),
    logo_url: formData.get('logo_url'),
    primary_color: formData.get('primary_color'),
    secondary_color: formData.get('secondary_color'),
    external_api_id: formData.get('external_api_id'),
    active: formData.get('active') === 'on',
  })

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Equipo invalido.')
  }

  const input = parsed.data
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from('teams')
    .update({
      name: input.name,
      short_name: optionalValue(input.short_name),
      description: optionalValue(input.description),
      logo_url: optionalValue(input.logo_url),
      primary_color: input.primary_color,
      secondary_color: input.secondary_color,
      external_api_id: optionalValue(input.external_api_id),
      active: input.active,
    })
    .eq('id', input.id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin/equipos')
  revalidatePath('/equipos')
  revalidatePath('/equipos/[slug]', 'page')
}
