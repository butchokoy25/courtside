import { createClient } from '@/lib/supabase/server'
import { Users } from 'lucide-react'
import {
  AddPlayerButton,
} from '@/components/admin/player-form'
import { PlayersTableClient } from '@/components/admin/players-table'

export default async function PlayersPage() {
  const supabase = await createClient()

  const [{ data: players, error: playersError }, { data: teams, error: teamsError }, { data: seasons, error: seasonsError }] =
    await Promise.all([
      supabase
        .from('players')
        .select('*, team_rosters(*, teams(*), seasons(*))')
        .order('last_name')
        .order('first_name'),
      supabase
        .from('teams')
        .select('id, name, color')
        .order('name'),
      supabase
        .from('seasons')
        .select('id, name')
        .order('name'),
    ])
  if (playersError) console.error('[ADMIN] Failed to fetch players:', playersError.message)
  if (teamsError) console.error('[ADMIN] Failed to fetch teams:', teamsError.message)
  if (seasonsError) console.error('[ADMIN] Failed to fetch seasons:', seasonsError.message)

  const safePlayers = players ?? []
  const safeTeams = teams ?? []
  const safeSeasons = seasons ?? []

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Players</h1>
          <p className="mt-1 text-muted-foreground">
            Manage players and their team assignments.
          </p>
        </div>
        <AddPlayerButton />
      </div>

      {safePlayers.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center text-center">
          <Users className="size-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No players yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Get started by adding your first player.
          </p>
          <div className="mt-4">
            <AddPlayerButton />
          </div>
        </div>
      ) : (
        <PlayersTableClient
          players={safePlayers}
          teams={safeTeams}
          seasons={safeSeasons}
        />
      )}
    </div>
  )
}
