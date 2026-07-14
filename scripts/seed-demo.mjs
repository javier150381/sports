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

async function upsertOrThrow(client, table, rows, onConflict) {
  const { data, error } = await client.from(table).upsert(rows, { onConflict }).select()

  if (error) {
    throw new Error(`${table}: ${error.message}`)
  }

  return data
}

loadEnv()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const now = new Date()
const futureMatch = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 6).toISOString()
const liveMatch = new Date(now.getTime() - 1000 * 60 * 38).toISOString()

const teams = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Macará',
    slug: 'macara',
    short_name: 'MAC',
    description: 'DEMO - Experiencia NFC de Macará para pruebas en Ecuador.',
    logo_url: null,
    primary_color: '#38bdf8',
    secondary_color: '#ffffff',
    external_api_id: 'demo-macara',
    active: true,
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Liga de Quito',
    slug: 'liga-de-quito',
    short_name: 'LDU',
    description: 'DEMO - Experiencia NFC de Liga de Quito para pruebas en Ecuador.',
    logo_url: null,
    primary_color: '#ffffff',
    secondary_color: '#e11d2e',
    external_api_id: 'demo-liga-de-quito',
    active: true,
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    name: 'Barcelona SC',
    slug: 'barcelona-sc',
    short_name: 'BSC',
    description: 'DEMO - Experiencia NFC de Barcelona SC para pruebas en Ecuador.',
    logo_url: null,
    primary_color: '#facc15',
    secondary_color: '#111827',
    external_api_id: 'demo-barcelona-sc',
    active: true,
  },
]

const competitions = [
  {
    id: '44444444-4444-4444-8444-444444444444',
    name: 'LigaPro Ecuador DEMO',
    slug: 'ligapro-ecuador-demo',
    description: 'DEMO - Competicion local de prueba para KUNTUR SPORT.',
    logo_url: null,
    external_api_id: 'demo-ligapro',
    season: '2026',
    active: true,
  },
]

const specialEvents = [
  {
    id: '55555555-5555-4555-8555-555555555555',
    name: 'Gran Final Ecuador DEMO',
    slug: 'gran-final-ecuador-demo',
    description: 'DEMO - Evento especial para probar experiencias NFC.',
    banner_url: null,
    starts_at: futureMatch,
    ends_at: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 8).toISOString(),
    active: true,
  },
]

const collections = [
  {
    id: '66666666-6666-4666-8666-666666666661',
    name: 'Macará NFC DEMO',
    slug: 'macara-nfc-demo',
    description: 'DEMO - Coleccion NFC vinculada a Macará.',
    context_type: 'TEAM',
    team_id: teams[0].id,
    competition_id: null,
    special_event_id: null,
    image_url: null,
    active: true,
  },
  {
    id: '66666666-6666-4666-8666-666666666662',
    name: 'Liga de Quito NFC DEMO',
    slug: 'liga-de-quito-nfc-demo',
    description: 'DEMO - Coleccion NFC vinculada a Liga de Quito.',
    context_type: 'TEAM',
    team_id: teams[1].id,
    competition_id: null,
    special_event_id: null,
    image_url: null,
    active: true,
  },
  {
    id: '66666666-6666-4666-8666-666666666663',
    name: 'Barcelona SC NFC DEMO',
    slug: 'barcelona-sc-nfc-demo',
    description: 'DEMO - Coleccion NFC vinculada a Barcelona SC.',
    context_type: 'TEAM',
    team_id: teams[2].id,
    competition_id: null,
    special_event_id: null,
    image_url: null,
    active: true,
  },
]

const shirts = [
  {
    id: '77777777-7777-4777-8777-777777777771',
    nfc_code: 'KT-MAC-DEMO01',
    serial_number: 'DEMO-MAC-0001',
    collection_id: collections[0].id,
    status: 'AVAILABLE',
  },
  {
    id: '77777777-7777-4777-8777-777777777772',
    nfc_code: 'KT-LDU-DEMO01',
    serial_number: 'DEMO-LDU-0001',
    collection_id: collections[1].id,
    status: 'AVAILABLE',
  },
  {
    id: '77777777-7777-4777-8777-777777777773',
    nfc_code: 'KT-BSC-DEMO01',
    serial_number: 'DEMO-BSC-0001',
    collection_id: collections[2].id,
    status: 'AVAILABLE',
  },
]

const fixtures = [
  {
    id: '88888888-8888-4888-8888-888888888881',
    external_fixture_id: 'demo-macara-liga-quito',
    competition_id: competitions[0].id,
    special_event_id: null,
    home_team_id: teams[0].id,
    away_team_id: teams[1].id,
    match_date: futureMatch,
    venue: 'Estadio Bellavista DEMO',
    status: 'PRE_MATCH',
    minute: null,
    home_score: null,
    away_score: null,
    live_data: { demo: true },
  },
  {
    id: '88888888-8888-4888-8888-888888888882',
    external_fixture_id: 'demo-barcelona-macara-live',
    competition_id: competitions[0].id,
    special_event_id: null,
    home_team_id: teams[2].id,
    away_team_id: teams[0].id,
    match_date: liveMatch,
    venue: 'Estadio Monumental Banco Pichincha DEMO',
    status: 'LIVE',
    minute: 38,
    home_score: 1,
    away_score: 0,
    live_data: {
      demo: true,
      events: [{ minute: 21, type: 'GOAL', team: 'Barcelona SC', player: 'Jugador demo' }],
    },
    last_synced_at: now.toISOString(),
  },
]

const contentPosts = [
  {
    id: '99999999-9999-4999-8999-999999999991',
    title: 'DEMO - Meme de previa',
    description: 'Contenido demo para probar memes vinculados a Macará.',
    content_type: 'MEME',
    external_url: null,
    image_url: null,
    alt_text: 'Placeholder de meme demo',
    team_id: teams[0].id,
    competition_id: null,
    special_event_id: null,
    fixture_id: fixtures[0].id,
    status: 'PUBLISHED',
    is_featured: true,
    nfc_exclusive: false,
    display_order: 1,
    published_at: now.toISOString(),
    expires_at: null,
    created_by: null,
  },
  {
    id: '99999999-9999-4999-8999-999999999992',
    title: 'DEMO - Enlace a transmision oficial',
    description: 'Ejemplo de enlace autorizado. No aloja ni retransmite video.',
    content_type: 'LIVE_STREAM',
    external_url: 'https://example.com/transmision-oficial-demo',
    image_url: null,
    alt_text: null,
    team_id: teams[2].id,
    competition_id: competitions[0].id,
    special_event_id: null,
    fixture_id: fixtures[1].id,
    status: 'PUBLISHED',
    is_featured: true,
    nfc_exclusive: false,
    display_order: 2,
    published_at: now.toISOString(),
    expires_at: null,
    created_by: null,
  },
  {
    id: '99999999-9999-4999-8999-999999999993',
    title: 'DEMO - Beneficio propietario NFC',
    description: 'Promocion visible para probar beneficios exclusivos de camisetas NFC.',
    content_type: 'PROMOTION',
    external_url: null,
    image_url: null,
    alt_text: null,
    team_id: teams[1].id,
    competition_id: null,
    special_event_id: null,
    fixture_id: null,
    status: 'PUBLISHED',
    is_featured: true,
    nfc_exclusive: true,
    display_order: 3,
    published_at: now.toISOString(),
    expires_at: null,
    created_by: null,
  },
]

const polls = [
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    question: 'DEMO - ¿Quien gana la fecha?',
    team_id: null,
    competition_id: competitions[0].id,
    special_event_id: null,
    fixture_id: fixtures[0].id,
    starts_at: now.toISOString(),
    ends_at: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 5).toISOString(),
    status: 'OPEN',
    created_by: null,
  },
]

const pollOptions = [
  {
    id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
    poll_id: polls[0].id,
    label: 'Macará',
    display_order: 1,
  },
  {
    id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
    poll_id: polls[0].id,
    label: 'Liga de Quito',
    display_order: 2,
  },
]

const promotions = [
  {
    id: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
    title: 'DEMO - 10% en camiseta NFC',
    description: 'Promocion demo para propietarios de camisetas NFC.',
    code: 'KUNTURDEMO10',
    image_url: null,
    team_id: teams[2].id,
    competition_id: null,
    special_event_id: null,
    starts_at: now.toISOString(),
    ends_at: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30).toISOString(),
    nfc_exclusive: true,
    active: true,
  },
]

await upsertOrThrow(supabase, 'teams', teams, 'slug')
await upsertOrThrow(supabase, 'competitions', competitions, 'slug')
await upsertOrThrow(supabase, 'special_events', specialEvents, 'slug')
await upsertOrThrow(supabase, 'collections', collections, 'slug')
await upsertOrThrow(supabase, 'shirts', shirts, 'nfc_code')
await upsertOrThrow(supabase, 'fixtures', fixtures, 'external_fixture_id')
await upsertOrThrow(supabase, 'content_posts', contentPosts, 'id')
await upsertOrThrow(supabase, 'polls', polls, 'id')
await upsertOrThrow(supabase, 'poll_options', pollOptions, 'id')
await upsertOrThrow(supabase, 'promotions', promotions, 'id')

console.log('Seed demo cargado: Macará, Liga de Quito y Barcelona SC.')
