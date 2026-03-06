import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ShotChartDisplay } from '@/components/public/shot-chart-display'
import { formatDate, formatStat, formatPct } from '@/lib/utils/format'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PlayerSeasonStats {
  player_id: string
  season_id: string
  team_id: string
  first_name: string
  last_name: string
  jersey_number: string | null
  games_played: number
  total_pts: number
  total_fgm: number
  total_fga: number
  fg_pct: number | null
  total_three_pm: number
  total_three_pa: number
  three_pct: number | null
  total_ftm: number
  total_fta: number
  ft_pct: number | null
  total_reb: number
  total_ast: number
  total_stl: number
  total_blk: number
  total_turnovers: number
  total_pf: number
  ppg: number
  rpg: number
  apg: number
  spg: number
  bpg: number
  topg: number
  fgm_pg: number
  fga_pg: number
  ftm_pg: number
  fta_pg: number
  fpg: number
}

interface PlayerGameStats {
  player_id: string
  game_id: string
  team_id: string
  first_name: string
  last_name: string
  jersey_number: string | null
  pts: number
  fgm: number
  fga: number
  fg_pct: number | null
  three_pm: number
  three_pa: number
  three_pct: number | null
  ftm: number
  fta: number
  ft_pct: number | null
  reb: number
  ast: number
  stl: number
  blk: number
  turnovers: number
  pf: number
}

interface ShotEvent {
  court_x: number | null
  court_y: number | null
  event_type: string
}

interface GameLogEntry {
  gameId: string
  date: string
  prefix: string
  opponentName: string
  opponentAbbr: string
  resultText: string
  resultColor: string
  score: string
  status: string
  stats: PlayerGameStats
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Fetch player
  const { data: player } = await supabase
    .from('players')
    .select('*')
    .eq('id', id)
    .single()

  if (!player) notFound()

  // 2. Fetch current team(s) via team_rosters with team and season info
  const { data: rosterEntries, error: rosterError } = await supabase
    .from('team_rosters')
    .select('*, teams(*), seasons(*, leagues(name, slug))')
    .eq('player_id', id)
    .eq('is_active', true)
  if (rosterError) console.error('[PLAYER] Failed to fetch roster entries:', rosterError.message)

  // Find teams on active seasons (prefer active season, fall back to any)
  const activeRosters = (rosterEntries ?? []).filter(
    (r: Record<string, unknown>) => {
      const season = r.seasons as Record<string, unknown> | null
      return season?.is_active === true
    }
  )
  const displayRosters = activeRosters.length > 0 ? activeRosters : (rosterEntries ?? [])

  // Get the primary team info for header display
  const primaryRoster = displayRosters[0] as Record<string, unknown> | undefined
  const primaryTeam = primaryRoster?.teams as {
    id: string
    name: string
    abbreviation: string
    color: string
  } | null
  const primarySeason = primaryRoster?.seasons as {
    id: string
    name: string
    is_active: boolean
    leagues: { name: string; slug: string } | null
  } | null
  const league = primarySeason?.leagues ?? null

  // 3. Fetch season stats
  const { data: seasonStatsRaw, error: seasonStatsError } = await supabase
    .from('player_season_stats' as never)
    .select('*')
    .eq('player_id' as never, id as never) as { data: PlayerSeasonStats[] | null; error: { message: string } | null }
  if (seasonStatsError) console.error('[PLAYER] Failed to fetch season stats:', seasonStatsError.message)

  const seasonStats = seasonStatsRaw ?? []

  // Find the active season stats (most relevant)
  const activeSeasonStats = primarySeason
    ? seasonStats.find((s) => s.season_id === primarySeason.id)
    : seasonStats[0] ?? null

  // 4. Fetch game log from player_game_stats view
  const { data: gameStatsRaw, error: gameStatsError } = await supabase
    .from('player_game_stats' as never)
    .select('*')
    .eq('player_id' as never, id as never) as { data: PlayerGameStats[] | null; error: { message: string } | null }
  if (gameStatsError) console.error('[PLAYER] Failed to fetch game stats:', gameStatsError.message)

  const gameStats = gameStatsRaw ?? []

  // Fetch game details for each game in the game log
  const gameIds = [...new Set(gameStats.map((g) => g.game_id))]
  let gamesData: Record<
    string,
    {
      id: string
      scheduled_at: string
      status: string
      home_team_id: string
      away_team_id: string
      home_score: number
      away_score: number
      home_team: { id: string; name: string; abbreviation: string } | null
      away_team: { id: string; name: string; abbreviation: string } | null
    }
  > = {}

  if (gameIds.length > 0) {
    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select(
        'id, scheduled_at, status, home_team_id, away_team_id, home_score, away_score, home_team:teams!games_home_team_id_fkey(id, name, abbreviation), away_team:teams!games_away_team_id_fkey(id, name, abbreviation)'
      )
      .in('id', gameIds)
      .order('scheduled_at', { ascending: false })
    if (gamesError) console.error('[PLAYER] Failed to fetch games:', gamesError.message)

    for (const g of (games ?? []) as unknown as Array<typeof gamesData[string]>) {
      gamesData[g.id] = g
    }
  }

  // Build game log sorted by date (most recent first)
  const gameLog: GameLogEntry[] = gameStats
    .map((gs) => {
      const game = gamesData[gs.game_id]
      if (!game) return null

      const isHome = gs.team_id === game.home_team_id
      const opponent = isHome ? game.away_team : game.home_team
      const prefix = isHome ? 'vs' : '@'
      const teamScore = isHome ? game.home_score : game.away_score
      const opponentScore = isHome ? game.away_score : game.home_score
      const won = teamScore > opponentScore
      const resultText = game.status === 'final' ? (won ? 'W' : 'L') : ''

      return {
        gameId: game.id,
        date: game.scheduled_at,
        prefix,
        opponentName: opponent?.name ?? 'TBD',
        opponentAbbr: opponent?.abbreviation ?? 'TBD',
        resultText,
        resultColor: won
          ? 'text-green-600 dark:text-green-400'
          : 'text-red-600 dark:text-red-400',
        score: `${teamScore}-${opponentScore}`,
        status: game.status,
        stats: gs,
      } satisfies GameLogEntry
    })
    .filter((entry): entry is GameLogEntry => entry !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // 5. Fetch shot data for shot chart (all games)
  const { data: shotEvents, error: shotEventsError } = await supabase
    .from('game_events')
    .select('court_x, court_y, event_type')
    .eq('player_id', id)
    .in('event_type', ['2PT_MADE', '2PT_MISS', '3PT_MADE', '3PT_MISS'])
  if (shotEventsError) console.error('[PLAYER] Failed to fetch shot events:', shotEventsError.message)

  const shots: ShotEvent[] = (shotEvents ?? []) as ShotEvent[]

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-4 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          {league && (
            <>
              <span className="mx-2">&gt;</span>
              <Link
                href={`/league/${league.slug}`}
                className="hover:text-foreground transition-colors"
              >
                {league.name}
              </Link>
            </>
          )}
          {primaryTeam && (
            <>
              <span className="mx-2">&gt;</span>
              <Link
                href={`/team/${primaryTeam.id}`}
                className="hover:text-foreground transition-colors"
              >
                {primaryTeam.name}
              </Link>
            </>
          )}
          <span className="mx-2">&gt;</span>
          <span className="text-foreground">
            {player.first_name} {player.last_name}
          </span>
        </nav>

        {/* Player Header */}
        <Card className="mb-6 overflow-hidden">
          {primaryTeam && (
            <div
              className="h-2"
              style={{ backgroundColor: primaryTeam.color }}
            />
          )}
          <CardHeader>
            <div className="flex items-center gap-4">
              {/* Jersey number badge */}
              <div
                className="flex size-14 items-center justify-center rounded-lg text-xl font-bold text-white"
                style={{
                  backgroundColor: primaryTeam?.color ?? '#6366f1',
                }}
              >
                {player.jersey_number ? `#${player.jersey_number}` : '--'}
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl">
                  {player.first_name} {player.last_name}
                </CardTitle>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {player.position && (
                    <Badge variant="secondary">{player.position}</Badge>
                  )}
                  {displayRosters.map((r: Record<string, unknown>, idx: number) => {
                    const team = r.teams as {
                      id: string
                      name: string
                      color: string
                    } | null
                    const season = r.seasons as {
                      name: string
                    } | null
                    if (!team) return null
                    return (
                      <Link key={idx} href={`/team/${team.id}`}>
                        <Badge
                          variant="outline"
                          className="cursor-pointer hover:bg-accent"
                        >
                          {team.name}
                          {season ? ` (${season.name})` : ''}
                        </Badge>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Season Averages */}
        {activeSeasonStats && (
          <div className="mb-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Season Averages
              {primarySeason ? ` - ${primarySeason.name}` : ''}
            </h2>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              <StatCard label="PPG" value={activeSeasonStats.ppg.toFixed(1)} />
              <StatCard label="RPG" value={activeSeasonStats.rpg.toFixed(1)} />
              <StatCard label="APG" value={activeSeasonStats.apg.toFixed(1)} />
              <StatCard label="SPG" value={activeSeasonStats.spg.toFixed(1)} />
              <StatCard label="BPG" value={activeSeasonStats.bpg.toFixed(1)} />
              <StatCard
                label="FG%"
                value={formatPct(activeSeasonStats.fg_pct)}
              />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-6">
              <StatCard
                label="3P%"
                value={formatPct(activeSeasonStats.three_pct)}
              />
              <StatCard
                label="FT%"
                value={formatPct(activeSeasonStats.ft_pct)}
              />
              <StatCard
                label="TOPG"
                value={activeSeasonStats.topg.toFixed(1)}
              />
              <StatCard
                label="FPG"
                value={activeSeasonStats.fpg.toFixed(1)}
              />
              <StatCard
                label="GP"
                value={String(activeSeasonStats.games_played)}
              />
              <StatCard
                label="PTS"
                value={String(activeSeasonStats.total_pts)}
              />
            </div>
          </div>
        )}

        {/* Tabs: Game Log / Shot Chart */}
        {gameLog.length > 0 || shots.length > 0 ? (
          <Tabs defaultValue="game-log">
            <TabsList>
              <TabsTrigger value="game-log">Game Log</TabsTrigger>
              <TabsTrigger value="shot-chart">Shot Chart</TabsTrigger>
            </TabsList>

            <TabsContent value="game-log" className="mt-4">
              <GameLogTable gameLog={gameLog} />
            </TabsContent>

            <TabsContent value="shot-chart" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <ShotChartDisplay
                    shots={shots}
                    title="All Games - Shot Chart"
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-lg text-muted-foreground">
                No game stats recorded yet
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Stats will appear here after games are played.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="py-0">
      <CardContent className="flex flex-col items-center justify-center px-2 py-3">
        <span className="text-lg font-bold tabular-nums">{value}</span>
        <span className="text-xs text-muted-foreground uppercase">
          {label}
        </span>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Game Log Table
// ---------------------------------------------------------------------------

function GameLogTable({
  gameLog,
}: {
  gameLog: GameLogEntry[]
}) {
  return (
    <Card className="overflow-hidden py-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[70px] sticky left-0 bg-background z-10">
              Date
            </TableHead>
            <TableHead className="min-w-[80px]">OPP</TableHead>
            <TableHead className="text-center w-[50px]">W/L</TableHead>
            <TableHead className="text-right">PTS</TableHead>
            <TableHead className="text-right">FG</TableHead>
            <TableHead className="text-right">3PT</TableHead>
            <TableHead className="text-right">FT</TableHead>
            <TableHead className="text-right">REB</TableHead>
            <TableHead className="text-right">AST</TableHead>
            <TableHead className="text-right">STL</TableHead>
            <TableHead className="text-right">BLK</TableHead>
            <TableHead className="text-right">TO</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {gameLog.map((g) => (
            <TableRow key={g.gameId}>
              <TableCell className="sticky left-0 bg-background z-10">
                <Link
                  href={`/game/${g.gameId}`}
                  className="hover:underline text-sm"
                >
                  {formatDate(g.date)}
                </Link>
              </TableCell>
              <TableCell>
                <span className="text-muted-foreground text-xs mr-1">
                  {g.prefix}
                </span>
                <span className="font-medium text-sm">{g.opponentAbbr}</span>
              </TableCell>
              <TableCell className="text-center">
                {g.status === 'final' && (
                  <span className={`text-sm font-bold ${g.resultColor}`}>
                    {g.resultText}
                  </span>
                )}
                {g.status === 'in_progress' && (
                  <Badge variant="destructive" className="text-xs">
                    LIVE
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right font-bold">
                {g.stats.pts}
              </TableCell>
              <TableCell className="text-right">
                {formatStat(g.stats.fgm, g.stats.fga)}
              </TableCell>
              <TableCell className="text-right">
                {formatStat(g.stats.three_pm, g.stats.three_pa)}
              </TableCell>
              <TableCell className="text-right">
                {formatStat(g.stats.ftm, g.stats.fta)}
              </TableCell>
              <TableCell className="text-right">{g.stats.reb}</TableCell>
              <TableCell className="text-right">{g.stats.ast}</TableCell>
              <TableCell className="text-right">{g.stats.stl}</TableCell>
              <TableCell className="text-right">{g.stats.blk}</TableCell>
              <TableCell className="text-right">
                {g.stats.turnovers}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
