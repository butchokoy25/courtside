'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/utils/logger'
import { requireActionAuth } from '@/lib/auth/utils'

export async function createGameEvent(data: {
  game_id: string
  player_id: string
  team_id: string
  event_type: string
  period: number
  court_x?: number | null
  court_y?: number | null
}) {
  const auth = await requireActionAuth(['admin', 'scorer'])
  if (auth.error) return { error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase.from('game_events').insert({
    game_id: data.game_id,
    player_id: data.player_id,
    team_id: data.team_id,
    event_type: data.event_type as '2PT_MADE' | '2PT_MISS' | '3PT_MADE' | '3PT_MISS' | 'FT_MADE' | 'FT_MISS' | 'REB' | 'AST' | 'STL' | 'BLK' | 'TO' | 'FOUL_PERSONAL' | 'FOUL_TECH',
    period: data.period,
    court_x: data.court_x ?? null,
    court_y: data.court_y ?? null,
  })
  if (error) {
    logger.error('scorer', 'Failed to create game event', { gameId: data.game_id, eventType: data.event_type, error: error.message })
    return { error: error.message }
  }

  // Update game score based on event type
  if (['2PT_MADE', '3PT_MADE', 'FT_MADE'].includes(data.event_type)) {
    await updateGameScore(data.game_id)
  }

  revalidatePath(`/score/${data.game_id}`)
  return { success: true }
}

export async function deleteGameEvent(eventId: string, gameId: string) {
  const auth = await requireActionAuth(['admin', 'scorer'])
  if (auth.error) return { error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase
    .from('game_events')
    .delete()
    .eq('id', eventId)
  if (error) {
    logger.error('scorer', 'Failed to delete game event', { eventId, gameId, error: error.message })
    return { error: error.message }
  }
  await updateGameScore(gameId)
  revalidatePath(`/score/${gameId}`)
  return { success: true }
}

export async function updateGameScore(gameId: string) {
  const supabase = await createClient()

  // Get game to know home/away team IDs
  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('home_team_id, away_team_id')
    .eq('id', gameId)
    .single()
  if (gameError || !game) {
    logger.error('scorer', 'Failed to fetch game for score update', { gameId, error: gameError?.message })
    return { error: 'Failed to fetch game' }
  }

  // Compute scores from events
  const { data: events, error: eventsError } = await supabase
    .from('game_events')
    .select('team_id, event_type')
    .eq('game_id', gameId)
  if (eventsError || !events) {
    logger.error('scorer', 'Failed to fetch events for score update', { gameId, error: eventsError?.message })
    return { error: 'Failed to fetch events' }
  }

  let homeScore = 0
  let awayScore = 0
  for (const e of events) {
    const pts =
      e.event_type === '2PT_MADE'
        ? 2
        : e.event_type === '3PT_MADE'
          ? 3
          : e.event_type === 'FT_MADE'
            ? 1
            : 0
    if (e.team_id === game.home_team_id) homeScore += pts
    else awayScore += pts
  }

  const { error: updateError } = await supabase
    .from('games')
    .update({ home_score: homeScore, away_score: awayScore })
    .eq('id', gameId)
  if (updateError) {
    logger.error('scorer', 'Failed to update game score', { gameId, error: updateError.message })
    return { error: 'Failed to update score' }
  }
}

export async function updateGameStatus(
  gameId: string,
  status: 'scheduled' | 'in_progress' | 'final'
) {
  const auth = await requireActionAuth(['admin', 'scorer'])
  if (auth.error) return { error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase
    .from('games')
    .update({ status })
    .eq('id', gameId)
  if (error) {
    logger.error('scorer', 'Failed to update game status', { gameId, status, error: error.message })
    return { error: error.message }
  }
  revalidatePath(`/score/${gameId}`)
  return { success: true }
}

export async function updateGamePeriod(gameId: string, period: number) {
  const auth = await requireActionAuth(['admin', 'scorer'])
  if (auth.error) return { error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase
    .from('games')
    .update({ current_period: period })
    .eq('id', gameId)
  if (error) {
    logger.error('scorer', 'Failed to update game period', { gameId, period, error: error.message })
    return { error: error.message }
  }
  revalidatePath(`/score/${gameId}`)
  return { success: true }
}
