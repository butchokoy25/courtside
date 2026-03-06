import { createClient } from '@/lib/supabase/server'
import { Plus, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LeagueForm } from '@/components/admin/league-form'
import { LeagueCard } from '@/components/admin/league-card'

export default async function LeaguesPage() {
  const supabase = await createClient()

  const { data: leagues, error: leaguesError } = await supabase
    .from('leagues')
    .select('*')
    .order('created_at', { ascending: true })
  if (leaguesError) console.error('[ADMIN] Failed to fetch leagues:', leaguesError.message)

  const { data: seasons, error: seasonsError } = await supabase
    .from('seasons')
    .select('*')
    .order('start_date', { ascending: false })
  if (seasonsError) console.error('[ADMIN] Failed to fetch seasons:', seasonsError.message)

  // Group seasons by league_id
  const seasonsByLeague = new Map<string, typeof seasons>()
  for (const season of seasons ?? []) {
    const existing = seasonsByLeague.get(season.league_id) ?? []
    existing.push(season)
    seasonsByLeague.set(season.league_id, existing)
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leagues</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your leagues and their seasons.
          </p>
        </div>
        <LeagueForm
          trigger={
            <Button>
              <Plus className="size-4" />
              Add League
            </Button>
          }
        />
      </div>

      <div className="mt-6 space-y-4">
        {(!leagues || leagues.length === 0) ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
            <Trophy className="size-10 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No leagues yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first league to get started.
            </p>
            <LeagueForm
              trigger={
                <Button className="mt-4">
                  <Plus className="size-4" />
                  Add League
                </Button>
              }
            />
          </div>
        ) : (
          leagues.map((league) => (
            <LeagueCard
              key={league.id}
              league={league}
              seasons={seasonsByLeague.get(league.id) ?? []}
            />
          ))
        )}
      </div>
    </div>
  )
}
