import 'server-only'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAdminEnv } from './env'

let adminClient: SupabaseClient | null = null

export function getSupabaseAdminClient() {
  if (!adminClient) {
    const env = getSupabaseAdminEnv()
    adminClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  return adminClient
}
