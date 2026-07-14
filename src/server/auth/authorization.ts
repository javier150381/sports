import { createSupabaseServerClient } from '@/server/supabase/server'
import { type Role } from './schemas'

export type ProfileRole = {
  id: string
  role: Role
}

export async function requireRole(allowedRoles: Role[]): Promise<ProfileRole | null> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (error || !data) {
    return null
  }

  const role = data.role as Role
  return allowedRoles.includes(role) ? { id: data.id, role } : null
}
