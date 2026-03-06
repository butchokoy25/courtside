import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDateTime, formatStat, getEventDescription } from '@/lib/utils/format'
import { ShotChartDisplay } from '@/components/public/shot-chart-display'

// Type for rows returned by the player_game_stats view
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

// Type for game events with player join
interface GameEvent {
  id: string
  game_id: string
  player_id: string
  team_id: string
  event_type: string
  period: number
  court_x: number | null
  court_y: number | null
  created_at: string
  players: {
    first_name: string
    last_name: string
    jersey_number: string | null
  } | null
}

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch game with teams and season/league info
  const { data: game } = await supabase
    .from('games')
    .select(
      '*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*), seasons(name, leagues(name, slug))'
    )
    .eq('id', id)
    .single()

  if (!game) notFound()

  const homeTeam = game.home_team!
  const awayTeam = game.away_team!
  const season = game.seasons!
  const league = (season as Record<string, unknown>).leagues as {
    name: string
    slug: string
  }

  // Fetch player game stats from the view
  const { data: playerStats, error: playerStatsError } = await supabase
    .from('player_game_stats' as never)
    .select('*')
    .eq('game_id' as never, id as never) as { data: PlayerGameStats[] | null; error: { message: string } | null }
  if (playerStatsError) console.error('[GAME] Failed to fetch player stats:', playerStatsError.message)

  // Fetch game events for play-by-play
  const { data: events, error: eventsError } = await supabase
    .from('game_events')
    .select('*, players(first_name, last_name, jersey_number)')
    .eq('game_id', id)
    .order('created_at', { ascending: false })
  if (eventsError) console.error('[GAME] Failed to fetch events:', eventsError.message)

  // Fetch shot events with coordinates for shot chart
  const { data: shotEvents, error: shotEventsError } = await supabase
    .from('game_events')
    .select('court_x, court_y, event_type, team_id')
    .eq('game_id', id)
    .in('event_type', ['2PT_MADE', '2PT_MISS', '3PT_MADE', '3PT_MISS'])
    .not('court_x', 'is', null)
    .not('court_y', 'is', null)
  if (shotEventsError) console.error('[GAME] Failed to fetch shot events:', shotEventsError.message)

  const homeShotEvents = (shotEvents ?? []).filter(
    (e) => e.team_id === game.home_team_id
  )
  const awayShotEvents = (shotEvents ?? []).filter(
    (e) => e.team_id === game.away_team_id
  )

  const homeStats = (playerStats ?? [])
    .filter((s) => s.team_id === game.home_team_id)
    .sort((a, b) => b.pts - a.pts)

  const awayStats = (playerStats ?? [])
    .filter((s) => s.team_id === game.away_team_id)
    .sort((a, b) => b.pts - a.pts)

  const gameEvents = (events ?? []) as unknown as GameEvent[]

  const hasStats = homeStats.length > 0 || awayStats.length > 0

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-5xl px-4 py-6">
        {/* Breadcrumb */}
        <nav className="mb-4 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href={`/league/${league.slug}`} className="hover:text-foreground">
            {league.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">Game Detail</span>
        </nav>

        {/* Score Header */}
        <ScoreHeader
          game={game}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
        />

        {/* Game content */}
        {game.status === 'scheduled' ? (
          <Card className="mt-6">
            <CardContent className="py-12 text-center">
              <p className="text-lg text-muted-foreground">
                Game has not started yet
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Scheduled for {formatDateTime(game.scheduled_at)}
              </p>
            </CardContent>
          </Card>
        ) : !hasStats ? (
          <Card className="mt-6">
            <CardContent className="py-12 text-center">
              <p className="text-lg text-muted-foreground">
                No stats recorded yet
              </p>
              {game.status === 'in_progress' && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Game is in progress
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="box-score" className="mt-6">
            <TabsList>
              <TabsTrigger value="box-score">Box Score</TabsTrigger>
              <TabsTrigger value="play-by-play">Play-by-Play</TabsTrigger>
              <TabsTrigger value="shot-chart">
                Shot Chart
              </TabsTrigger>
            </TabsList>

            <TabsContent value="box-score" className="mt-4 space-y-6">
              <BoxScoreTable
                teamName={homeTeam.name}
                teamColor={homeTeam.color}
                teamId={homeTeam.id}
                stats={homeStats}
              />
              <BoxScoreTable
                teamName={awayTeam.name}
                teamColor={awayTeam.color}
                teamId={awayTeam.id}
                stats={awayStats}
              />
            </TabsContent>

            <TabsContent value="play-by-play" className="mt-4">
              <PlayByPlay
                events={gameEvents}
                homeTeamId={game.home_team_id}
                homeTeamName={homeTeam.abbreviation}
                awayTeamName={awayTeam.abbreviation}
                periods={game.periods}
              />
            </TabsContent>

            <TabsContent value="shot-chart" className="mt-4">
              {homeShotEvents.length === 0 && awayShotEvents.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">
                      No shot location data available for this game
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardContent className="pt-6">
                      <ShotChartDisplay
                        shots={homeShotEvents}
                        title={homeTeam.name}
                      />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <ShotChartDisplay
                        shots={awayShotEvents}
                        title={awayTeam.name}
                      />
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Score Header                                                               */
/* -------------------------------------------------------------------------- */

function ScoreHeader({
  game,
  homeTeam,
  awayTeam,
}: {
  game: {
    status: 'scheduled' | 'in_progress' | 'final'
    home_score: number
    away_score: number
    scheduled_at: string
    current_period: number
    periods: number
  }
  homeTeam: { id: string; name: string; abbreviation: string; color: string }
  awayTeam: { id: string; name: string; abbreviation: string; color: string }
}) {
  const statusLabel =
    game.status === 'final'
      ? 'FINAL'
      : game.status === 'in_progress'
        ? `Q${game.current_period}`
        : formatDateTime(game.scheduled_at)

  return (
    <Card className="overflow-hidden py-0">
      <div className="grid grid-cols-3 items-center">
        {/* Home Team */}
        <div className="flex flex-col items-center gap-1 py-6 px-4">
          <Link
            href={`/team/${homeTeam.id}`}
            className="text-center hover:underline"
          >
            <span
              className="text-lg font-bold sm:text-2xl"
              style={{ color: homeTeam.color }}
            >
              {homeTeam.name}
            </span>
          </Link>
          {game.status !== 'scheduled' && (
            <span className="text-3xl font-extrabold sm:text-5xl">
              {game.home_score}
            </span>
          )}
        </div>

        {/* Status */}
        <div className="flex flex-col items-center justify-center gap-2 py-6">
          <Badge
            variant={
              game.status === 'in_progress'
                ? 'destructive'
                : game.status === 'final'
                  ? 'secondary'
                  : 'outline'
            }
          >
            {statusLabel}
          </Badge>
          {game.status !== 'scheduled' && (
            <span className="text-xs text-muted-foreground">
              {formatDateTime(game.scheduled_at)}
            </span>
          )}
        </div>

        {/* Away Team */}
        <div className="flex flex-col items-center gap-1 py-6 px-4">
          <Link
            href={`/team/${awayTeam.id}`}
            className="text-center hover:underline"
          >
            <span
              className="text-lg font-bold sm:text-2xl"
              style={{ color: awayTeam.color }}
            >
              {awayTeam.name}
            </span>
          </Link>
          {game.status !== 'scheduled' && (
            <span className="text-3xl font-extrabold sm:text-5xl">
              {game.away_score}
            </span>
          )}
        </div>
      </div>
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/* Box Score Table                                                            */
/* -------------------------------------------------------------------------- */

function BoxScoreTable({
  teamName,
  teamColor,
  teamId,
  stats,
}: {
  teamName: string
  teamColor: string
  teamId: string
  stats: PlayerGameStats[]
}) {
  // Compute team totals
  const totals = stats.reduce(
    (acc, s) => ({
      pts: acc.pts + s.pts,
      fgm: acc.fgm + s.fgm,
      fga: acc.fga + s.fga,
      three_pm: acc.three_pm + s.three_pm,
      three_pa: acc.three_pa + s.three_pa,
      ftm: acc.ftm + s.ftm,
      fta: acc.fta + s.fta,
      reb: acc.reb + s.reb,
      ast: acc.ast + s.ast,
      stl: acc.stl + s.stl,
      blk: acc.blk + s.blk,
      turnovers: acc.turnovers + s.turnovers,
      pf: acc.pf + s.pf,
    }),
    {
      pts: 0,
      fgm: 0,
      fga: 0,
      three_pm: 0,
      three_pa: 0,
      ftm: 0,
      fta: 0,
      reb: 0,
      ast: 0,
      stl: 0,
      blk: 0,
      turnovers: 0,
      pf: 0,
    }
  )

  return (
    <Card className="overflow-hidden py-0">
      {/* Team header */}
      <div
        className="px-4 py-3"
        style={{ backgroundColor: teamColor, color: '#fff' }}
      >
        <Link href={`/team/${teamId}`} className="hover:underline">
          <h3 className="text-sm font-bold uppercase tracking-wide">
            {teamName}
          </h3>
        </Link>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[120px] sticky left-0 bg-background z-10">
              Player
            </TableHead>
            <TableHead className="text-right">PTS</TableHead>
            <TableHead className="text-right">FG</TableHead>
            <TableHead className="text-right">3PT</TableHead>
            <TableHead className="text-right">FT</TableHead>
            <TableHead className="text-right">REB</TableHead>
            <TableHead className="text-right">AST</TableHead>
            <TableHead className="text-right">STL</TableHead>
            <TableHead className="text-right">BLK</TableHead>
            <TableHead className="text-right">TO</TableHead>
            <TableHead className="text-right">PF</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {stats.map((s) => (
            <TableRow key={s.player_id}>
              <TableCell className="sticky left-0 bg-background z-10">
                <Link
                  href={`/player/${s.player_id}`}
                  className="hover:underline"
                >
                  <span className="font-medium">
                    {s.jersey_number ? `#${s.jersey_number} ` : ''}
                    {s.first_name} {s.last_name}
                  </span>
                </Link>
              </TableCell>
              <TableCell className="text-right font-bold">{s.pts}</TableCell>
              <TableCell className="text-right">
                {formatStat(s.fgm, s.fga)}
              </TableCell>
              <TableCell className="text-right">
                {formatStat(s.three_pm, s.three_pa)}
              </TableCell>
              <TableCell className="text-right">
                {formatStat(s.ftm, s.fta)}
              </TableCell>
              <TableCell className="text-right">{s.reb}</TableCell>
              <TableCell className="text-right">{s.ast}</TableCell>
              <TableCell className="text-right">{s.stl}</TableCell>
              <TableCell className="text-right">{s.blk}</TableCell>
              <TableCell className="text-right">{s.turnovers}</TableCell>
              <TableCell className="text-right">{s.pf}</TableCell>
            </TableRow>
          ))}
        </TableBody>

        <TableFooter>
          <TableRow className="font-bold">
            <TableCell className="sticky left-0 bg-muted/50 z-10">
              TOTAL
            </TableCell>
            <TableCell className="text-right">{totals.pts}</TableCell>
            <TableCell className="text-right">
              {formatStat(totals.fgm, totals.fga)}
            </TableCell>
            <TableCell className="text-right">
              {formatStat(totals.three_pm, totals.three_pa)}
            </TableCell>
            <TableCell className="text-right">
              {formatStat(totals.ftm, totals.fta)}
            </TableCell>
            <TableCell className="text-right">{totals.reb}</TableCell>
            <TableCell className="text-right">{totals.ast}</TableCell>
            <TableCell className="text-right">{totals.stl}</TableCell>
            <TableCell className="text-right">{totals.blk}</TableCell>
            <TableCell className="text-right">{totals.turnovers}</TableCell>
            <TableCell className="text-right">{totals.pf}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/* Play-by-Play                                                               */
/* -------------------------------------------------------------------------- */

function PlayByPlay({
  events,
  homeTeamId,
  homeTeamName,
  awayTeamName,
  periods,
}: {
  events: GameEvent[]
  homeTeamId: string
  homeTeamName: string
  awayTeamName: string
  periods: number
}) {
  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No events recorded</p>
        </CardContent>
      </Card>
    )
  }

  // Group events by period
  const eventsByPeriod = new Map<number, GameEvent[]>()
  for (const event of events) {
    const period = event.period
    if (!eventsByPeriod.has(period)) {
      eventsByPeriod.set(period, [])
    }
    eventsByPeriod.get(period)!.push(event)
  }

  // Build running score (events are reverse-chronological, so we need to
  // compute from the oldest event forward, then display reversed)
  const chronologicalEvents = [...events].reverse()
  const scoreMap = new Map<string, { home: number; away: number }>()
  let runningHome = 0
  let runningAway = 0

  for (const event of chronologicalEvents) {
    const points = getPointsForEvent(event.event_type)
    if (points > 0) {
      if (event.team_id === homeTeamId) {
        runningHome += points
      } else {
        runningAway += points
      }
    }
    scoreMap.set(event.id, { home: runningHome, away: runningAway })
  }

  // Sort periods descending (most recent first)
  const sortedPeriods = [...eventsByPeriod.keys()].sort((a, b) => b - a)

  return (
    <div className="space-y-4">
      {sortedPeriods.map((period) => (
        <Card key={period}>
          <div className="border-b px-4 py-2">
            <h4 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
              {period <= periods ? `Quarter ${period}` : `OT${period - periods}`}
            </h4>
          </div>
          <div className="divide-y">
            {eventsByPeriod.get(period)!.map((event) => {
              const score = scoreMap.get(event.id)
              const isHome = event.team_id === homeTeamId
              const teamAbbr = isHome ? homeTeamName : awayTeamName
              const playerName = event.players
                ? `${event.players.first_name} ${event.players.last_name}`
                : 'Unknown'

              return (
                <div
                  key={event.id}
                  className="flex items-center gap-3 px-4 py-2 text-sm"
                >
                  <span className="w-16 shrink-0 font-mono text-xs text-muted-foreground">
                    {score ? `${score.home}-${score.away}` : ''}
                  </span>
                  <Badge
                    variant="outline"
                    className="w-12 justify-center text-xs shrink-0"
                  >
                    {teamAbbr}
                  </Badge>
                  <span className="flex-1">
                    <Link
                      href={`/player/${event.player_id}`}
                      className="font-medium hover:underline"
                    >
                      {playerName}
                    </Link>
                    <span className="ml-1 text-muted-foreground">
                      {getEventDescription(event.event_type)}
                    </span>
                  </span>
                </div>
              )
            })}
          </div>
        </Card>
      ))}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function getPointsForEvent(eventType: string): number {
  switch (eventType) {
    case '2PT_MADE':
      return 2
    case '3PT_MADE':
      return 3
    case 'FT_MADE':
      return 1
    default:
      return 0
  }
}
