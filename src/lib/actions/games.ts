'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/utils/logger'
import { requireActionAuth } from '@/lib/auth/utils'

export async function createGame(formData: FormData) {
  const auth = await requireActionAuth(['admin'])
  if (auth.error) return { error: auth.error }

  const supabase = await createClient()
  const season_id = formData.get('season_id') as string
  const home_team_id = formData.get('home_team_id') as string
  const away_team_id = formData.get('away_team_id') as string
  const scheduled_at = formData.get('scheduled_at') as string
  const venue = (formData.get('venue') as string) || null

  if (home_team_id === away_team_id) {
    logger.warn('games', 'Create game validation failed: same team for home and away', { home_team_id })
    return { error: 'Home and away teams must be different.' }
  }

  const { error } = await supabase
    .from('games')
    .insert({ season_id, home_team_id, away_team_id, scheduled_at, venue })

  if (error) {
    logger.error('games', 'Failed to create game', { season_id, home_team_id, away_team_id, error: error.message })
    return { error: error.message }
  }
  revalidatePath('/admin/schedule')
  return { success: true }
}

export async function updateGame(id: string, formData: FormData) {
  const auth = await requireActionAuth(['admin'])
  if (auth.error) return { error: auth.error }

  const supabase = await createClient()
  const season_id = formData.get('season_id') as string
  const home_team_id = formData.get('home_team_id') as string
  const away_team_id = formData.get('away_team_id') as string
  const scheduled_at = formData.get('scheduled_at') as string
  const venue = (formData.get('venue') as string) || null

  if (home_team_id === away_team_id) {
    logger.warn('games', 'Update game validation failed: same team for home and away', { id, home_team_id })
    return { error: 'Home and away teams must be different.' }
  }

  const { error } = await supabase
    .from('games')
    .update({ season_id, home_team_id, away_team_id, scheduled_at, venue })
    .eq('id', id)

  if (error) {
    logger.error('games', 'Failed to update game', { id, season_id, error: error.message })
    return { error: error.message }
  }
  revalidatePath('/admin/schedule')
  return { success: true }
}

export async function deleteGame(id: string) {
  const auth = await requireActionAuth(['admin'])
  if (auth.error) return { error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase.from('games').delete().eq('id', id)

  if (error) {
    logger.error('games', 'Failed to delete game', { id, error: error.message })
    return { error: error.message }
  }
  revalidatePath('/admin/schedule')
  return { success: true }
}
