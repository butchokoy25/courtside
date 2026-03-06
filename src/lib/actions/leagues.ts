'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/utils/logger'

export async function createLeague(formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string
  const slug = formData.get('slug') as string
  const description = (formData.get('description') as string) || null

  if (!name || !slug) {
    logger.warn('leagues', 'Create league missing required fields', { name, slug })
    return { error: 'Name and slug are required' }
  }

  const { error } = await supabase.from('leagues').insert({ name, slug, description })
  if (error) {
    logger.error('leagues', 'Failed to create league', { name, slug, error: error.message })
    return { error: error.message }
  }
  revalidatePath('/admin/leagues')
  return { success: true }
}

export async function updateLeague(id: string, formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string
  const slug = formData.get('slug') as string
  const description = (formData.get('description') as string) || null

  if (!name || !slug) {
    logger.warn('leagues', 'Update league missing required fields', { id, name, slug })
    return { error: 'Name and slug are required' }
  }

  const { error } = await supabase
    .from('leagues')
    .update({ name, slug, description })
    .eq('id', id)
  if (error) {
    logger.error('leagues', 'Failed to update league', { id, name, error: error.message })
    return { error: error.message }
  }
  revalidatePath('/admin/leagues')
  return { success: true }
}

export async function deleteLeague(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('leagues').delete().eq('id', id)
  if (error) {
    logger.error('leagues', 'Failed to delete league', { id, error: error.message })
    return { error: error.message }
  }
  revalidatePath('/admin/leagues')
  return { success: true }
}

export async function createSeason(formData: FormData) {
  const supabase = await createClient()
  const league_id = formData.get('league_id') as string
  const name = formData.get('name') as string
  const start_date = (formData.get('start_date') as string) || null
  const end_date = (formData.get('end_date') as string) || null
  const is_active = formData.get('is_active') === 'on'

  if (!league_id || !name) {
    logger.warn('leagues', 'Create season missing required fields', { league_id, name })
    return { error: 'League and name are required' }
  }

  const { error } = await supabase
    .from('seasons')
    .insert({ league_id, name, start_date, end_date, is_active })
  if (error) {
    logger.error('leagues', 'Failed to create season', { league_id, name, error: error.message })
    return { error: error.message }
  }
  revalidatePath('/admin/leagues')
  return { success: true }
}

export async function updateSeason(id: string, formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string
  const start_date = (formData.get('start_date') as string) || null
  const end_date = (formData.get('end_date') as string) || null
  const is_active = formData.get('is_active') === 'on'

  if (!name) {
    logger.warn('leagues', 'Update season missing required fields', { id, name })
    return { error: 'Name is required' }
  }

  const { error } = await supabase
    .from('seasons')
    .update({ name, start_date, end_date, is_active })
    .eq('id', id)
  if (error) {
    logger.error('leagues', 'Failed to update season', { id, name, error: error.message })
    return { error: error.message }
  }
  revalidatePath('/admin/leagues')
  return { success: true }
}

export async function deleteSeason(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('seasons').delete().eq('id', id)
  if (error) {
    logger.error('leagues', 'Failed to delete season', { id, error: error.message })
    return { error: error.message }
  }
  revalidatePath('/admin/leagues')
  return { success: true }
}
