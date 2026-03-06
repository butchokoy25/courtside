'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/utils/logger'

export async function createPlayer(formData: FormData) {
  const supabase = await createClient()
  const first_name = formData.get('first_name') as string
  const last_name = formData.get('last_name') as string
  const jersey_number = (formData.get('jersey_number') as string) || null
  const position = (formData.get('position') as string) || null

  if (!first_name || !last_name) {
    logger.warn('players', 'Create player missing required fields', { first_name, last_name })
    return { error: 'First name and last name are required' }
  }

  const { error } = await supabase
    .from('players')
    .insert({ first_name, last_name, jersey_number, position })
  if (error) {
    logger.error('players', 'Failed to create player', { first_name, last_name, error: error.message })
    return { error: error.message }
  }
  revalidatePath('/admin/players')
  return { success: true }
}

export async function updatePlayer(id: string, formData: FormData) {
  const supabase = await createClient()
  const first_name = formData.get('first_name') as string
  const last_name = formData.get('last_name') as string
  const jersey_number = (formData.get('jersey_number') as string) || null
  const position = (formData.get('position') as string) || null

  if (!first_name || !last_name) {
    logger.warn('players', 'Update player missing required fields', { id, first_name, last_name })
    return { error: 'First name and last name are required' }
  }

  const { error } = await supabase
    .from('players')
    .update({ first_name, last_name, jersey_number, position })
    .eq('id', id)
  if (error) {
    logger.error('players', 'Failed to update player', { id, first_name, last_name, error: error.message })
    return { error: error.message }
  }
  revalidatePath('/admin/players')
  return { success: true }
}

export async function deletePlayer(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('players').delete().eq('id', id)
  if (error) {
    logger.error('players', 'Failed to delete player', { id, error: error.message })
    return { error: error.message }
  }
  revalidatePath('/admin/players')
  return { success: true }
}

// Roster management
export async function assignPlayerToTeam(formData: FormData) {
  const supabase = await createClient()
  const player_id = formData.get('player_id') as string
  const team_id = formData.get('team_id') as string
  const season_id = formData.get('season_id') as string

  if (!player_id || !team_id || !season_id) {
    logger.warn('players', 'Assign player missing required fields', { player_id, team_id, season_id })
    return { error: 'Player, team, and season are required' }
  }

  const { error } = await supabase
    .from('team_rosters')
    .insert({ player_id, team_id, season_id, is_active: true })
  if (error) {
    logger.error('players', 'Failed to assign player to team', { player_id, team_id, season_id, error: error.message })
    return { error: error.message }
  }
  revalidatePath('/admin/players')
  return { success: true }
}

export async function removePlayerFromTeam(rosterId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('team_rosters')
    .delete()
    .eq('id', rosterId)
  if (error) {
    logger.error('players', 'Failed to remove player from team', { rosterId, error: error.message })
    return { error: error.message }
  }
  revalidatePath('/admin/players')
  return { success: true }
}
