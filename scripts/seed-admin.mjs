import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

function loadEnv() {
  const envText = readFileSync('.env.local', 'utf8')

  for (const line of envText.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const index = trimmed.indexOf('=')
    if (index === -1) continue

    process.env[trimmed.slice(0, index)] = trimmed.slice(index + 1)
  }
}

loadEnv()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const adminEmail = 'admin@kuntur.local'
const adminPassword = '654321'

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const { data: created, error: createError } = await supabase.auth.admin.createUser({
  email: adminEmail,
  password: adminPassword,
  email_confirm: true,
  user_metadata: {
    full_name: 'Administrador KUNTUR SPORT',
  },
})

let userId = created.user?.id

if (createError) {
  const { data: users, error: listError } = await supabase.auth.admin.listUsers()

  if (listError) {
    throw listError
  }

  const existing = users.users.find((user) => user.email === adminEmail)
  if (!existing) {
    throw createError
  }

  userId = existing.id

  const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
    password: adminPassword,
    email_confirm: true,
    user_metadata: {
      full_name: 'Administrador KUNTUR SPORT',
    },
  })

  if (updateError) {
    throw updateError
  }
}

if (!userId) {
  throw new Error('No se pudo obtener el id del usuario admin.')
}

const { error: profileError } = await supabase.from('profiles').upsert(
  {
    id: userId,
    full_name: 'Administrador KUNTUR SPORT',
    role: 'ADMIN',
    points: 0,
  },
  { onConflict: 'id' },
)

if (profileError) {
  throw profileError
}

console.log(`Admin listo: ${adminEmail} / ${adminPassword}`)
