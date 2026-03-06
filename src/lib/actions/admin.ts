'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/utils/logger'

export async function updateUserRole(
  userId: string,
  role: 'admin' | 'scorer' | 'player'
) {
  const supabase = await createClient()

  // Verify the caller is an admin
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    logger.warn('admin', 'Unauthenticated role update attempt', { targetUserId: userId })
    return { error: 'Not authenticated' }
  }

  const { data: callerProfile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !callerProfile) {
    logger.error('admin', 'Failed to fetch caller profile', { userId: user.id, error: profileError?.message })
    return { error: 'Failed to verify permissions' }
  }

  if (callerProfile.role !== 'admin') {
    logger.warn('admin', 'Unauthorized role update attempt', { callerId: user.id, callerRole: callerProfile.role, targetUserId: userId })
    return { error: 'Not authorized' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)

  if (error) {
    logger.error('admin', 'Failed to update user role', { targetUserId: userId, role, error: error.message })
    return { error: error.message }
  }

  revalidatePath('/admin/users')
  return { success: true }
}
