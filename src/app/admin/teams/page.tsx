import { createClient } from '@/lib/supabase/server'
import {
  Card,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import {
  AddTeamButton,
  EditTeamButton,
  DeleteTeamButton,
} from '@/components/admin/team-form'
import { Shield } from 'lucide-react'

export default async function TeamsPage() {
  const supabase = await createClient()

  const [{ data: teams, error: teamsError }, { data: leagues, error: leaguesError }] = await Promise.all([
    supabase
      .from('teams')
      .select('*, leagues(name)')
      .order('name'),
    supabase.from('leagues').select('id, name').order('name'),
  ])
  if (teamsError) console.error('[ADMIN] Failed to fetch teams:', teamsError.message)
  if (leaguesError) console.error('[ADMIN] Failed to fetch leagues:', leaguesError.message)

  const safeTeams = teams ?? []
  const safeLeagues = leagues ?? []

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Teams</h1>
          <p className="mt-1 text-muted-foreground">
            Manage teams across all leagues.
          </p>
        </div>
        <AddTeamButton leagues={safeLeagues} />
      </div>

      {safeTeams.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center text-center">
          <Shield className="size-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No teams yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Get started by adding your first team.
          </p>
          <div className="mt-4">
            <AddTeamButton leagues={safeLeagues} />
          </div>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {safeTeams.map((team) => {
            const leagueName =
              (team.leagues as unknown as { name: string } | null)?.name ?? 'Unknown'

            return (
              <Card key={team.id} className="overflow-hidden py-0">
                {/* Color bar */}
                <div
                  className="h-2"
                  style={{ backgroundColor: team.color }}
                />

                <CardContent className="pt-4 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-semibold">
                        {team.name}
                      </h3>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {leagueName}
                      </p>
                    </div>
                    <span
                      className="shrink-0 inline-flex items-center rounded-md px-2 py-1 text-xs font-bold tracking-wide text-white"
                      style={{ backgroundColor: team.color }}
                    >
                      {team.abbreviation}
                    </span>
                  </div>
                </CardContent>

                <CardFooter className="flex items-center justify-between border-t py-2">
                  <div className="flex items-center gap-1">
                    <div
                      className="size-3 rounded-full border"
                      style={{ backgroundColor: team.color }}
                    />
                    <span className="text-xs font-mono text-muted-foreground">
                      {team.color}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <EditTeamButton
                      team={{
                        id: team.id,
                        name: team.name,
                        abbreviation: team.abbreviation,
                        color: team.color,
                        league_id: team.league_id,
                      }}
                      leagues={safeLeagues}
                    />
                    <DeleteTeamButton
                      team={{
                        id: team.id,
                        name: team.name,
                        abbreviation: team.abbreviation,
                        color: team.color,
                        league_id: team.league_id,
                      }}
                    />
                  </div>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
