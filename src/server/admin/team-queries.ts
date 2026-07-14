import { createSupabaseServerClient } from '@/server/supabase/server'

export type AdminTeam = {
  id: string
  name: string
  slug: string
  short_name: string | null
  description: string | null
  logo_url: string | null
  primary_color: string | null
  secondary_color: string | null
  external_api_id: string | null
  active: boolean
}

export async function getAdminTeams(): Promise<AdminTeam[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('teams')
    .select(
      'id, name, slug, short_name, description, logo_url, primary_color, secondary_color, external_api_id, active',
    )
    .order('name')

  if (error) {
    throw new Error(error.message)
  }

  return data as AdminTeam[]
}
