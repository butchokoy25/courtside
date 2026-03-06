import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import {
  AddGameButton,
  EditGameButton,
  DeleteGameButton,
  ScoreGameButton,
  PostGameButton,
} from '@/components/admin/game-form'
import { CalendarDays } from 'lucide-react'
import { ScheduleSeasonFilter } from './schedule-filter'

function formatDateTime(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }) +
    ' \u2022 ' +
    date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
}

function statusVariant(
  status: 'scheduled' | 'in_progress' | 'final'
): 'secondary' | 'outline' | 'default' {
  switch (status) {
    case 'scheduled':
      return 'secondary'
    case 'in_progress':
      return 'outline'
    case 'final':
      return 'default'
  }
}

function statusLabel(status: 'scheduled' | 'in_progress' | 'final'): string {
  switch (status) {
    case 'scheduled':
      return 'Scheduled'
    case 'in_progress':
      return 'In Progress'
    case 'final':
      return 'Final'
  }
}

function statusClassName(
  status: 'scheduled' | 'in_progress' | 'final'
): string {
  switch (status) {
    case 'scheduled':
      return ''
    case 'in_progress':
      return 'border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
    case 'final':
      return 'border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400'
  }
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>
}) {
  const { season: seasonFilter } = await searchParams
  const supabase = await createClient()

  const [{ data: games, error: gamesError }, { data: seasons, error: seasonsError }, { data: teams, error: teamsError }] =
    await Promise.all([
      supabase
        .from('games')
        .select(
          '*, home_team:teams!home_team_id(name, abbreviation, color), away_team:teams!away_team_id(name, abbreviation, color), seasons(name, league_id, leagues(name))'
        )
        .order('scheduled_at', { ascending: false }),
      supabase
        .from('seasons')
        .select('id, name, league_id, leagues(name)')
        .order('name'),
      supabase.from('teams').select('id, name, abbreviation, color, league_id').order('name'),
    ])
  if (gamesError) console.error('[ADMIN] Failed to fetch games:', gamesError.message)
  if (seasonsError) console.error('[ADMIN] Failed to fetch seasons:', seasonsError.message)
  if (teamsError) console.error('[ADMIN] Failed to fetch teams:', teamsError.message)

  const safeGames = games ?? []
  const safeSeasons = seasons ?? []
  const safeTeams = teams ?? []

  // Build season options for filter
  const seasonOptions = safeSeasons.map((s) => ({
    id: s.id,
    label: `${(s.leagues as unknown as { name: string } | null)?.name ?? ''} - ${s.name}`,
  }))

  // Filter games by season if filter is set
  const filteredGames = seasonFilter
    ? safeGames.filter((g) => g.season_id === seasonFilter)
    : safeGames

  // Prepare seasons prop for form (with league info)
  const seasonsForForm = safeSeasons.map((s) => ({
    id: s.id,
    name: s.name,
    league_id: s.league_id,
    leagues: s.leagues as unknown as { name: string } | null,
  }))

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Schedule</h1>
          <p className="mt-1 text-muted-foreground">
            Manage games across all leagues and seasons.
          </p>
        </div>
        <AddGameButton seasons={seasonsForForm} teams={safeTeams} />
      </div>

      {/* Season Filter */}
      {seasonOptions.length > 0 && (
        <div className="mt-4">
          <ScheduleSeasonFilter
            seasons={seasonOptions}
            currentSeason={seasonFilter ?? ''}
          />
        </div>
      )}

      {filteredGames.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center text-center">
          <CalendarDays className="size-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No games yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Get started by scheduling your first game.
          </p>
          <div className="mt-4">
            <AddGameButton seasons={seasonsForForm} teams={safeTeams} />
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="mt-6 hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Matchup</TableHead>
                  <TableHead>Season</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGames.map((game) => {
                  const homeTeam = game.home_team as unknown as {
                    name: string
                    abbreviation: string
                    color: string
                  } | null
                  const awayTeam = game.away_team as unknown as {
                    name: string
                    abbreviation: string
                    color: string
                  } | null
                  const seasonInfo = game.seasons as unknown as {
                    name: string
                    league_id: string
                    leagues: { name: string } | null
                  } | null

                  const homeTeamName = homeTeam?.name ?? 'Unknown'
                  const awayTeamName = awayTeam?.name ?? 'Unknown'

                  return (
                    <TableRow key={game.id}>
                      <TableCell className="font-medium">
                        {formatDateTime(game.scheduled_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span
                            className="inline-block size-3 rounded-full"
                            style={{
                              backgroundColor: homeTeam?.color ?? '#888',
                            }}
                          />
                          <span className="font-medium">{homeTeamName}</span>
                          <span className="text-muted-foreground">vs</span>
                          <span
                            className="inline-block size-3 rounded-full"
                            style={{
                              backgroundColor: awayTeam?.color ?? '#888',
                            }}
                          />
                          <span className="font-medium">{awayTeamName}</span>
                          {game.status === 'final' && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({game.home_score} - {game.away_score})
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {seasonInfo?.leagues?.name
                            ? `${seasonInfo.leagues.name} - `
                            : ''}
                          {seasonInfo?.name ?? 'Unknown'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {game.venue ?? '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={statusVariant(game.status)}
                          className={statusClassName(game.status)}
                        >
                          {statusLabel(game.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {game.status !== 'final' && (
                            <>
                              <ScoreGameButton gameId={game.id} />
                              <PostGameButton gameId={game.id} />
                            </>
                          )}
                          <EditGameButton
                            game={{
                              id: game.id,
                              season_id: game.season_id,
                              home_team_id: game.home_team_id,
                              away_team_id: game.away_team_id,
                              scheduled_at: game.scheduled_at,
                              venue: game.venue,
                              status: game.status,
                            }}
                            seasons={seasonsForForm}
                            teams={safeTeams}
                          />
                          <DeleteGameButton
                            game={{
                              id: game.id,
                              season_id: game.season_id,
                              home_team_id: game.home_team_id,
                              away_team_id: game.away_team_id,
                              scheduled_at: game.scheduled_at,
                              venue: game.venue,
                              status: game.status,
                            }}
                            homeTeamName={homeTeamName}
                            awayTeamName={awayTeamName}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="mt-6 grid gap-3 md:hidden">
            {filteredGames.map((game) => {
              const homeTeam = game.home_team as unknown as {
                name: string
                abbreviation: string
                color: string
              } | null
              const awayTeam = game.away_team as unknown as {
                name: string
                abbreviation: string
                color: string
              } | null
              const seasonInfo = game.seasons as unknown as {
                name: string
                league_id: string
                leagues: { name: string } | null
              } | null

              const homeTeamName = homeTeam?.name ?? 'Unknown'
              const awayTeamName = awayTeam?.name ?? 'Unknown'

              return (
                <Card key={game.id} className="overflow-hidden py-0">
                  <CardContent className="p-4">
                    {/* Top row: date + status */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(game.scheduled_at)}
                      </span>
                      <Badge
                        variant={statusVariant(game.status)}
                        className={statusClassName(game.status)}
                      >
                        {statusLabel(game.status)}
                      </Badge>
                    </div>

                    {/* Matchup */}
                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <span
                        className="inline-block size-3 shrink-0 rounded-full"
                        style={{
                          backgroundColor: homeTeam?.color ?? '#888',
                        }}
                      />
                      <span className="font-semibold">{homeTeamName}</span>
                      <span className="text-muted-foreground">vs</span>
                      <span
                        className="inline-block size-3 shrink-0 rounded-full"
                        style={{
                          backgroundColor: awayTeam?.color ?? '#888',
                        }}
                      />
                      <span className="font-semibold">{awayTeamName}</span>
                      {game.status === 'final' && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          {game.home_score} - {game.away_score}
                        </span>
                      )}
                    </div>

                    {/* Season & Venue */}
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>
                        {seasonInfo?.leagues?.name
                          ? `${seasonInfo.leagues.name} - `
                          : ''}
                        {seasonInfo?.name ?? 'Unknown'}
                      </span>
                      {game.venue && <span>{game.venue}</span>}
                    </div>

                    {/* Actions */}
                    <div className="mt-3 flex items-center justify-end gap-1 border-t pt-3">
                      {game.status !== 'final' && (
                        <>
                          <ScoreGameButton gameId={game.id} />
                          <PostGameButton gameId={game.id} />
                        </>
                      )}
                      <EditGameButton
                        game={{
                          id: game.id,
                          season_id: game.season_id,
                          home_team_id: game.home_team_id,
                          away_team_id: game.away_team_id,
                          scheduled_at: game.scheduled_at,
                          venue: game.venue,
                          status: game.status,
                        }}
                        seasons={seasonsForForm}
                        teams={safeTeams}
                      />
                      <DeleteGameButton
                        game={{
                          id: game.id,
                          season_id: game.season_id,
                          home_team_id: game.home_team_id,
                          away_team_id: game.away_team_id,
                          scheduled_at: game.scheduled_at,
                          venue: game.venue,
                          status: game.status,
                        }}
                        homeTeamName={homeTeamName}
                        awayTeamName={awayTeamName}
                      />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
