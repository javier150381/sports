'use server'

import type { Route } from 'next'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/server/supabase/server'

const predictionSchema = z.object({
  fixtureId: z.string().uuid(),
  homeScore: z.coerce.number().int().min(0).max(30),
  awayScore: z.coerce.number().int().min(0).max(30),
})

function fixturePath(id: string, message?: string): Route {
  const params = new URLSearchParams()

  if (message) {
    params.set('message', message)
  }

  return `/partidos/${id}${params.size > 0 ? `?${params.toString()}` : ''}` as Route
}

export async function savePredictionAction(formData: FormData) {
  const parsed = predictionSchema.safeParse({
    fixtureId: formData.get('fixtureId'),
    homeScore: formData.get('homeScore'),
    awayScore: formData.get('awayScore'),
  })

  if (!parsed.success) {
    redirect('/mi-cuenta/pronosticos')
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: fixture } = await supabase
    .from('fixtures')
    .select('match_date')
    .eq('id', parsed.data.fixtureId)
    .single()

  if (!fixture || new Date(fixture.match_date) <= new Date()) {
    redirect(fixturePath(parsed.data.fixtureId, 'closed'))
  }

  const { error } = await supabase.from('predictions').upsert(
    {
      fixture_id: parsed.data.fixtureId,
      user_id: user.id,
      home_score: parsed.data.homeScore,
      away_score: parsed.data.awayScore,
      points_awarded: 0,
    },
    { onConflict: 'fixture_id,user_id' },
  )

  if (error) {
    redirect(fixturePath(parsed.data.fixtureId, 'error'))
  }

  revalidatePath(`/partidos/${parsed.data.fixtureId}`)
  revalidatePath('/mi-cuenta/pronosticos')
  redirect(fixturePath(parsed.data.fixtureId, 'saved'))
}
