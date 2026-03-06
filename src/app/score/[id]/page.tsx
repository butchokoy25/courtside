import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/utils'
import { notFound } from 'next/navigation'
import { ScorerInterface } from '@/components/scorer/scorer-interface'

export default async function ScorePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params
  const supabase = await createClient()

  // Fetch game with teams and season
  const { data: game } = await supabase
    .from('games')
    .select(
      '*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*), seasons(*)'
    )
    .eq('id', id)
    .single()

  if (!game) notFound()

  // Fetch rosters for both teams in this season
  const { data: homeRoster, error: homeRosterError } = await supabase
    .from('team_rosters')
    .select('*, players(*)')
    .eq('team_id', game.home_team_id)
    .eq('season_id', game.season_id)
    .eq('is_active', true)
  if (homeRosterError) console.error('[SCORE] Failed to fetch home roster:', homeRosterError.message)

  const { data: awayRoster, error: awayRosterError } = await supabase
    .from('team_rosters')
    .select('*, players(*)')
    .eq('team_id', game.away_team_id)
    .eq('season_id', game.season_id)
    .eq('is_active', true)
  if (awayRosterError) console.error('[SCORE] Failed to fetch away roster:', awayRosterError.message)

  // Fetch existing events
  const { data: events, error: eventsError } = await supabase
    .from('game_events')
    .select('*, players(first_name, last_name, jersey_number)')
    .eq('game_id', id)
    .order('created_at', { ascending: false })
  if (eventsError) console.error('[SCORE] Failed to fetch events:', eventsError.message)

  return (
    <ScorerInterface
      game={game}
      homeRoster={homeRoster || []}
      awayRoster={awayRoster || []}
      initialEvents={events || []}
    />
  )
}
