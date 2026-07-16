import { createSupabaseServerClient } from '@/server/supabase/server'
import { normalizeContentPostType } from '@/server/content/content-types'
import { getActiveTeams } from '@/server/teams/queries'

export type AdminContentPost = {
  id: string
  title: string
  description: string | null
  content_type: string
  status: string
  external_url: string | null
  image_url: string | null
  alt_text: string | null
  is_featured: boolean
  nfc_exclusive: boolean
  display_order: number
  team: { name: string; slug: string } | null
}

type AdminContentRow = Omit<AdminContentPost, 'team'> & {
  team: AdminContentPost['team'] | AdminContentPost['team'][]
}

function firstRelation<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value
}

export async function getAdminContentPageData(teamSlug?: string) {
  const supabase = await createSupabaseServerClient()
  const teams = await getActiveTeams()
  const selectedTeam = teams.find((team) => team.slug === teamSlug)
  let contentQuery = supabase
    .from('content_posts')
    .select(
      'id, title, description, content_type, status, external_url, image_url, alt_text, is_featured, nfc_exclusive, display_order, team:team_id(name, slug)',
    )
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(80)

  if (teamSlug === 'sin-equipo') {
    contentQuery = contentQuery.is('team_id', null)
  } else if (selectedTeam) {
    contentQuery = contentQuery.eq('team_id', selectedTeam.id)
  }

  const contentResult = await contentQuery

  if (contentResult.error) {
    throw new Error(contentResult.error.message)
  }

  const posts = (contentResult.data as unknown as AdminContentRow[]).map(
    (post) =>
      normalizeContentPostType({
        ...post,
        team: firstRelation(post.team),
      }),
  )

  return { teams, posts, selectedTeam }
}
