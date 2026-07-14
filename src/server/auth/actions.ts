'use server'

import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/server/supabase/server'
import { authSchema, type AuthInput } from './schemas'
import { apiError, apiSuccess, type ActionResult } from '@/server/http/responses'

export async function loginAction(input: AuthInput): Promise<ActionResult<null>> {
  const parsed = authSchema.safeParse(input)

  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', 'Revisa el correo y la contrasena.')
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    return apiError('AUTH_FAILED', 'No pudimos iniciar sesion con esas credenciales.')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', (await supabase.auth.getUser()).data.user?.id)
    .single()

  if (profile?.role === 'ADMIN' || profile?.role === 'EDITOR') {
    redirect('/admin')
  }

  redirect('/mi-cuenta')
}

export async function registerAction(input: AuthInput): Promise<ActionResult<null>> {
  const parsed = authSchema.safeParse(input)

  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', 'Revisa el correo y la contrasena.')
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signUp(parsed.data)

  if (error) {
    return apiError('REGISTER_FAILED', 'No pudimos crear la cuenta.')
  }

  return apiSuccess(null)
}
