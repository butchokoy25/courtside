import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { logger } from '@/lib/utils/logger'

export async function requireAuth() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    logger.error('auth', 'Failed to get user in requireAuth', { error: error.message })
  }

  if (!user) redirect('/login')
  return user
}

export async function requireAdmin() {
  const user = await requireAuth()
  const supabase = await createClient()

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError) {
    logger.error('auth', 'Failed to fetch profile in requireAdmin', { userId: user.id, error: profileError.message })
    redirect('/')
  }

  if (!profile || !['admin', 'scorer'].includes(profile.role)) {
    logger.warn('auth', 'Unauthorized access attempt in requireAdmin', { userId: user.id, role: profile?.role })
    redirect('/')
  }

  return { user, role: profile.role }
}

export async function getProfile() {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    logger.error('auth', 'Failed to get user in getProfile', { error: userError.message })
  }

  if (!user) return null

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError) {
    logger.error('auth', 'Failed to fetch profile in getProfile', { userId: user.id, error: profileError.message })
  }

  return profile
}
