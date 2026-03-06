import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/utils'
import { notFound } from 'next/navigation'
import { PostGameEntry } from '@/components/scorer/post-game-entry'

export default async function PostGamePage({
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

  // If game is already final, redirect or show notice
  if (game.status === 'final') {
    notFound()
  }

  // Fetch rosters for both teams in this season
  const { data: homeRoster, error: homeRosterError } = await supabase
    .from('team_rosters')
    .select('*, players(*)')
    .eq('team_id', game.home_team_id)
    .eq('season_id', game.season_id)
    .eq('is_active', true)
  if (homeRosterError) console.error('[POST-GAME] Failed to fetch home roster:', homeRosterError.message)

  const { data: awayRoster, error: awayRosterError } = await supabase
    .from('team_rosters')
    .select('*, players(*)')
    .eq('team_id', game.away_team_id)
    .eq('season_id', game.season_id)
    .eq('is_active', true)
  if (awayRosterError) console.error('[POST-GAME] Failed to fetch away roster:', awayRosterError.message)

  return (
    <PostGameEntry
      game={game as any}
      homeRoster={homeRoster || []}
      awayRoster={awayRoster || []}
    />
  )
}
