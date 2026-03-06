'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/utils/logger'

export async function createTeam(formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string
  const abbreviation = formData.get('abbreviation') as string
  const color = formData.get('color') as string
  const league_id = formData.get('league_id') as string

  const { error } = await supabase
    .from('teams')
    .insert({ name, abbreviation, color, league_id })

  if (error) {
    logger.error('teams', 'Failed to create team', { name, league_id, error: error.message })
    return { error: error.message }
  }
  revalidatePath('/admin/teams')
  return { success: true }
}

export async function updateTeam(id: string, formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string
  const abbreviation = formData.get('abbreviation') as string
  const color = formData.get('color') as string
  const league_id = formData.get('league_id') as string

  const { error } = await supabase
    .from('teams')
    .update({ name, abbreviation, color, league_id })
    .eq('id', id)

  if (error) {
    logger.error('teams', 'Failed to update team', { id, name, error: error.message })
    return { error: error.message }
  }
  revalidatePath('/admin/teams')
  return { success: true }
}

export async function deleteTeam(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('teams').delete().eq('id', id)

  if (error) {
    logger.error('teams', 'Failed to delete team', { id, error: error.message })
    return { error: error.message }
  }
  revalidatePath('/admin/teams')
  return { success: true }
}
