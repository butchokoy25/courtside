import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ArrowRight, Calendar, Trophy, TrendingUp } from "lucide-react"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: league } = await supabase
    .from("leagues")
    .select("name")
    .eq("slug", slug)
    .single()

  return {
    title: league ? `${league.name} - Courtside` : "League - Courtside",
  }
}

export default async function LeaguePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  // Fetch the league
  const { data: league } = await supabase
    .from("leagues")
    .select("*")
    .eq("slug", slug)
    .single()

  if (!league) notFound()

  // Fetch active season
  const { data: activeSeason } = await supabase
    .from("seasons")
    .select("*")
    .eq("league_id", league.id)
    .eq("is_active", true)
    .single()

  // Fetch standings for the active season
  let standings: Array<{
    team_id: string
    season_id: string
    team_name: string
    team_abbreviation: string
    team_color: string
    wins: number
    losses: number
    win_pct: number | null
  }> = []

  if (activeSeason) {
    const { data, error: standingsError } = await supabase
      .from("team_standings")
      .select("*")
      .eq("season_id", activeSeason.id)
      .order("win_pct", { ascending: false })
    if (standingsError) console.error('[LEAGUE] Failed to fetch standings:', standingsError.message)

    standings = (data ?? []) as typeof standings
  }

  // Fetch recent finalized games for this season
  let recentGames: Array<{
    id: string
    home_score: number
    away_score: number
    scheduled_at: string
    status: string
    home_team: { id: string; name: string; abbreviation: string; color: string }
    away_team: { id: string; name: string; abbreviation: string; color: string }
  }> = []

  if (activeSeason) {
    const { data, error: recentGamesError } = await supabase
      .from("games")
      .select(`
        id,
        home_score,
        away_score,
        scheduled_at,
        status,
        home_team:teams!games_home_team_id_fkey(id, name, abbreviation, color),
        away_team:teams!games_away_team_id_fkey(id, name, abbreviation, color)
      `)
      .eq("season_id", activeSeason.id)
      .eq("status", "final")
      .order("scheduled_at", { ascending: false })
      .limit(10)
    if (recentGamesError) console.error('[LEAGUE] Failed to fetch recent games:', recentGamesError.message)

    recentGames = (data ?? []) as unknown as typeof recentGames
  }

  // Fetch upcoming games
  let upcomingGames: Array<{
    id: string
    scheduled_at: string
    status: string
    venue: string | null
    home_team: { id: string; name: string; abbreviation: string; color: string }
    away_team: { id: string; name: string; abbreviation: string; color: string }
  }> = []

  if (activeSeason) {
    const { data, error: upcomingGamesError } = await supabase
      .from("games")
      .select(`
        id,
        scheduled_at,
        status,
        venue,
        home_team:teams!games_home_team_id_fkey(id, name, abbreviation, color),
        away_team:teams!games_away_team_id_fkey(id, name, abbreviation, color)
      `)
      .eq("season_id", activeSeason.id)
      .eq("status", "scheduled")
      .order("scheduled_at", { ascending: true })
      .limit(5)
    if (upcomingGamesError) console.error('[LEAGUE] Failed to fetch upcoming games:', upcomingGamesError.message)

    upcomingGames = (data ?? []) as unknown as typeof upcomingGames
  }

  // Fetch stat leaders (top 3 in ppg, rpg, apg)
  let statLeaders: Array<{
    player_id: string
    season_id: string
    team_id: string
    first_name: string
    last_name: string
    jersey_number: string | null
    games_played: number
    ppg: number
    rpg: number
    apg: number
    spg: number
    bpg: number
    fg_pct: number | null
    three_pct: number | null
    ft_pct: number | null
    ppg_rank: number
    rpg_rank: number
    apg_rank: number
    spg_rank: number
    bpg_rank: number
  }> = []

  if (activeSeason) {
    const { data, error: leadersError } = await supabase
      .from("stat_leaders")
      .select("*")
      .eq("season_id", activeSeason.id)
    if (leadersError) console.error('[LEAGUE] Failed to fetch stat leaders:', leadersError.message)

    statLeaders = (data ?? []) as typeof statLeaders
  }

  // Get top 3 for each category
  const topScorers = [...statLeaders].sort((a, b) => Number(b.ppg) - Number(a.ppg)).slice(0, 3)
  const topRebounders = [...statLeaders].sort((a, b) => Number(b.rpg) - Number(a.rpg)).slice(0, 3)
  const topAssisters = [...statLeaders].sort((a, b) => Number(b.apg) - Number(a.apg)).slice(0, 3)

  // Get team color for a player
  const getTeamForPlayer = (teamId: string) => {
    return standings.find((s) => s.team_id === teamId)
  }

  return (
    <main className="min-h-screen bg-background">
      {/* League Header */}
      <section className="border-b bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <span>/</span>
            <span>{league.name}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {league.name}
          </h1>
          {league.description && (
            <p className="mt-1 text-muted-foreground">{league.description}</p>
          )}
          {activeSeason && (
            <Badge variant="outline" className="mt-3">
              {activeSeason.name}
            </Badge>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {!activeSeason ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No active season for this league. Check back when the next season starts!
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Standings + Recent Games side by side */}
            <div className="grid gap-8 lg:grid-cols-5">
              {/* Standings (wider) */}
              <section className="lg:col-span-3">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Trophy className="size-5" />
                    Standings
                  </h2>
                </div>
                {standings.length > 0 ? (
                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-10 text-center">#</TableHead>
                            <TableHead>Team</TableHead>
                            <TableHead className="text-center w-14">W</TableHead>
                            <TableHead className="text-center w-14">L</TableHead>
                            <TableHead className="text-center w-16">PCT</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {standings.map((team, index) => (
                            <TableRow key={team.team_id}>
                              <TableCell className="text-center text-muted-foreground tabular-nums">
                                {index + 1}
                              </TableCell>
                              <TableCell>
                                <Link
                                  href={`/team/${team.team_id}`}
                                  className="flex items-center gap-2 hover:underline"
                                >
                                  <span
                                    className="size-3 rounded-full shrink-0"
                                    style={{ backgroundColor: team.team_color }}
                                  />
                                  <span className="font-medium">{team.team_name}</span>
                                  <span className="text-muted-foreground text-xs hidden sm:inline">
                                    {team.team_abbreviation}
                                  </span>
                                </Link>
                              </TableCell>
                              <TableCell className="text-center tabular-nums font-medium">
                                {team.wins}
                              </TableCell>
                              <TableCell className="text-center tabular-nums">
                                {team.losses}
                              </TableCell>
                              <TableCell className="text-center tabular-nums">
                                {team.win_pct != null
                                  ? `.${String(Math.round(Number(team.win_pct) * 1000)).padStart(3, "0")}`
                                  : ".000"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      No standings available yet. Games need to be finalized first.
                    </CardContent>
                  </Card>
                )}
              </section>

              {/* Upcoming Schedule */}
              <section className="lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Calendar className="size-5" />
                    Upcoming
                  </h2>
                  <Link
                    href={`/league/${slug}/schedule`}
                    className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Full schedule
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
                {upcomingGames.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingGames.map((game) => {
                      const gameDate = new Date(game.scheduled_at)
                      return (
                        <Card key={game.id} className="transition-shadow hover:shadow-md">
                          <CardContent className="py-3 px-4">
                            <div className="text-xs text-muted-foreground mb-2">
                              {gameDate.toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })}
                              {" at "}
                              {gameDate.toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                              {game.venue && ` -- ${game.venue}`}
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className="size-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: game.away_team.color }}
                              />
                              <span className="text-sm font-medium flex-1 truncate">
                                {game.away_team.name}
                              </span>
                              <span className="text-xs text-muted-foreground">@</span>
                              <span className="text-sm font-medium flex-1 truncate text-right">
                                {game.home_team.name}
                              </span>
                              <span
                                className="size-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: game.home_team.color }}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      No upcoming games scheduled.
                    </CardContent>
                  </Card>
                )}
              </section>
            </div>

            {/* Recent Results */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Recent Results</h2>
              {recentGames.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {recentGames.map((game) => {
                    const homeWon = game.home_score > game.away_score
                    const gameDate = new Date(game.scheduled_at)

                    return (
                      <Link key={game.id} href={`/game/${game.id}`}>
                        <Card className="transition-shadow hover:shadow-md h-full">
                          <CardContent className="py-3 px-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-muted-foreground">
                                {gameDate.toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                              <Badge variant="secondary" className="text-[10px]">Final</Badge>
                            </div>
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span
                                  className="size-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: game.away_team.color }}
                                />
                                <span className={`text-sm flex-1 truncate ${!homeWon ? "font-bold" : "text-muted-foreground"}`}>
                                  {game.away_team.name}
                                </span>
                                <span className={`text-sm tabular-nums ${!homeWon ? "font-bold" : "text-muted-foreground"}`}>
                                  {game.away_score}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span
                                  className="size-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: game.home_team.color }}
                                />
                                <span className={`text-sm flex-1 truncate ${homeWon ? "font-bold" : "text-muted-foreground"}`}>
                                  {game.home_team.name}
                                </span>
                                <span className={`text-sm tabular-nums ${homeWon ? "font-bold" : "text-muted-foreground"}`}>
                                  {game.home_score}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No games have been completed this season yet.
                  </CardContent>
                </Card>
              )}
            </section>

            {/* Stat Leaders */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <TrendingUp className="size-5" />
                  Stat Leaders
                </h2>
                <Link
                  href={`/league/${slug}/leaders`}
                  className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                >
                  View all leaders
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
              {statLeaders.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-3">
                  {/* PPG Leaders */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Points Per Game</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {topScorers.map((player, index) => {
                          const team = getTeamForPlayer(player.team_id)
                          return (
                            <div key={player.player_id} className="flex items-center gap-2 text-sm">
                              <span className="w-5 text-muted-foreground text-right tabular-nums">
                                {index + 1}
                              </span>
                              {team && (
                                <span
                                  className="size-2 rounded-full shrink-0"
                                  style={{ backgroundColor: team.team_color }}
                                />
                              )}
                              <span className="flex-1 truncate">
                                {player.first_name} {player.last_name}
                              </span>
                              <span className="font-bold tabular-nums">
                                {Number(player.ppg).toFixed(1)}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* RPG Leaders */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Rebounds Per Game</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {topRebounders.map((player, index) => {
                          const team = getTeamForPlayer(player.team_id)
                          return (
                            <div key={player.player_id} className="flex items-center gap-2 text-sm">
                              <span className="w-5 text-muted-foreground text-right tabular-nums">
                                {index + 1}
                              </span>
                              {team && (
                                <span
                                  className="size-2 rounded-full shrink-0"
                                  style={{ backgroundColor: team.team_color }}
                                />
                              )}
                              <span className="flex-1 truncate">
                                {player.first_name} {player.last_name}
                              </span>
                              <span className="font-bold tabular-nums">
                                {Number(player.rpg).toFixed(1)}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* APG Leaders */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Assists Per Game</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {topAssisters.map((player, index) => {
                          const team = getTeamForPlayer(player.team_id)
                          return (
                            <div key={player.player_id} className="flex items-center gap-2 text-sm">
                              <span className="w-5 text-muted-foreground text-right tabular-nums">
                                {index + 1}
                              </span>
                              {team && (
                                <span
                                  className="size-2 rounded-full shrink-0"
                                  style={{ backgroundColor: team.team_color }}
                                />
                              )}
                              <span className="flex-1 truncate">
                                {player.first_name} {player.last_name}
                              </span>
                              <span className="font-bold tabular-nums">
                                {Number(player.apg).toFixed(1)}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No player stats available yet. Stats appear after games are finalized.
                  </CardContent>
                </Card>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  )
}
