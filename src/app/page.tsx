import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Calendar, Users, Zap } from "lucide-react"

export default async function HomePage() {
  const supabase = await createClient()

  // Fetch all leagues with their teams count and active season
  const { data: leagues, error: leaguesError } = await supabase
    .from("leagues")
    .select("id, name, slug, description")
    .order("name")
  if (leaguesError) console.error('[HOME] Failed to fetch leagues:', leaguesError.message)

  // Fetch active seasons for each league
  const { data: activeSeasons, error: seasonsError } = await supabase
    .from("seasons")
    .select("id, league_id, name")
    .eq("is_active", true)
  if (seasonsError) console.error('[HOME] Failed to fetch active seasons:', seasonsError.message)

  // Fetch team counts per league
  const { data: teams, error: teamsError } = await supabase
    .from("teams")
    .select("id, league_id")
  if (teamsError) console.error('[HOME] Failed to fetch teams:', teamsError.message)

  // Fetch last 5 finalized games with team info
  const { data: recentGames, error: recentGamesError } = await supabase
    .from("games")
    .select(`
      id,
      home_score,
      away_score,
      scheduled_at,
      status,
      home_team:teams!games_home_team_id_fkey(id, name, abbreviation, color),
      away_team:teams!games_away_team_id_fkey(id, name, abbreviation, color),
      season:seasons!games_season_id_fkey(id, league_id)
    `)
    .eq("status", "final")
    .order("scheduled_at", { ascending: false })
    .limit(5)
  if (recentGamesError) console.error('[HOME] Failed to fetch recent games:', recentGamesError.message)

  // Fetch standings for active seasons (top 4 per season)
  const activeSeasonIds = activeSeasons?.map((s) => s.id) ?? []
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

  if (activeSeasonIds.length > 0) {
    const { data, error: standingsError } = await supabase
      .from("team_standings")
      .select("*")
      .in("season_id", activeSeasonIds)
      .order("win_pct", { ascending: false })
    if (standingsError) console.error('[HOME] Failed to fetch standings:', standingsError.message)

    standings = (data ?? []) as typeof standings
  }

  // Build helper maps
  const seasonByLeague = new Map(
    activeSeasons?.map((s) => [s.league_id, s]) ?? []
  )
  const teamCountByLeague = new Map<string, number>()
  teams?.forEach((t) => {
    teamCountByLeague.set(t.league_id, (teamCountByLeague.get(t.league_id) ?? 0) + 1)
  })

  // Group standings by season
  const standingsBySeason = new Map<string, typeof standings>()
  standings.forEach((s) => {
    if (!standingsBySeason.has(s.season_id)) {
      standingsBySeason.set(s.season_id, [])
    }
    standingsBySeason.get(s.season_id)!.push(s)
  })

  const hasLeagues = leagues && leagues.length > 0
  const hasRecentGames = recentGames && recentGames.length > 0

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b court-pattern">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="text-center">
            <h1 className="font-display text-6xl sm:text-8xl tracking-wider text-gradient-orange mb-3">
              COURTSIDE
            </h1>
            <p className="mx-auto max-w-xl text-muted-foreground text-base sm:text-lg">
              Scores, standings, and stats for your weekend basketball leagues.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
        {/* League Cards */}
        <section>
          <h2 className="font-display text-2xl tracking-wide mb-4">LEAGUES</h2>
          {hasLeagues ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {leagues.map((league) => {
                const season = seasonByLeague.get(league.id)
                const teamCount = teamCountByLeague.get(league.id) ?? 0
                return (
                  <Link key={league.id} href={`/league/${league.slug}`}>
                    <Card className="group relative overflow-hidden transition-all hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 h-full">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <CardHeader className="relative">
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">{league.name}</CardTitle>
                        {league.description && (
                          <CardDescription>{league.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="relative">
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <Badge variant="secondary" className="gap-1">
                            <Users className="size-3" />
                            {teamCount} {teamCount === 1 ? "team" : "teams"}
                          </Badge>
                          {season && (
                            <Badge variant="outline" className="gap-1">
                              <Zap className="size-3" />
                              {season.name}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <div className="font-display text-4xl text-muted-foreground/30 mb-3">NO LEAGUES YET</div>
                <p className="text-muted-foreground text-sm">Check back soon — the season is about to start!</p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Recent Games & Standings side by side on desktop */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Recent Games */}
          <section>
            <h2 className="font-display text-2xl tracking-wide mb-4">RECENT GAMES</h2>
            {hasRecentGames ? (
              <div className="space-y-2">
                {recentGames.map((game) => {
                  const homeTeam = game.home_team as unknown as { id: string; name: string; abbreviation: string; color: string }
                  const awayTeam = game.away_team as unknown as { id: string; name: string; abbreviation: string; color: string }
                  const homeWon = game.home_score > game.away_score
                  const gameDate = new Date(game.scheduled_at)

                  return (
                    <Link key={game.id} href={`/game/${game.id}`}>
                      <Card className="group transition-all hover:shadow-md hover:border-primary/20">
                        <CardContent className="py-3 px-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 space-y-1.5">
                              {/* Away team */}
                              <div className="flex items-center gap-2">
                                <span
                                  className="size-3 rounded-sm shrink-0"
                                  style={{ backgroundColor: awayTeam.color }}
                                />
                                <span className={`text-sm ${!homeWon ? "font-bold" : "text-muted-foreground"}`}>
                                  {awayTeam.name}
                                </span>
                                <span className={`ml-auto font-display text-lg tracking-wide ${!homeWon ? "text-primary" : "text-muted-foreground"}`}>
                                  {game.away_score}
                                </span>
                              </div>
                              {/* Home team */}
                              <div className="flex items-center gap-2">
                                <span
                                  className="size-3 rounded-sm shrink-0"
                                  style={{ backgroundColor: homeTeam.color }}
                                />
                                <span className={`text-sm ${homeWon ? "font-bold" : "text-muted-foreground"}`}>
                                  {homeTeam.name}
                                </span>
                                <span className={`ml-auto font-display text-lg tracking-wide ${homeWon ? "text-primary" : "text-muted-foreground"}`}>
                                  {game.home_score}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4 flex flex-col items-end text-xs text-muted-foreground">
                              <Badge variant="secondary" className="text-[10px] font-display tracking-wider">FINAL</Badge>
                              <span className="mt-1">
                                {gameDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
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
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <Calendar className="size-8 mx-auto mb-2 text-muted-foreground/30" />
                  <div className="font-display text-2xl text-muted-foreground/30 mb-1">NO GAMES YET</div>
                  <p className="text-muted-foreground text-sm">Stay tuned — tip-off is coming!</p>
                </CardContent>
              </Card>
            )}
          </section>

          {/* Quick Standings */}
          <section>
            <h2 className="font-display text-2xl tracking-wide mb-4">STANDINGS</h2>
            {activeSeasons && activeSeasons.length > 0 ? (
              <div className="space-y-4">
                {activeSeasons.map((season) => {
                  const league = leagues?.find((l) => l.id === season.league_id)
                  const seasonStandings = (standingsBySeason.get(season.id) ?? []).slice(0, 4)

                  return (
                    <Card key={season.id}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-baseline gap-2">
                          <span>{league?.name ?? "League"}</span>
                          <span className="text-muted-foreground font-normal text-xs font-display tracking-wider">
                            {season.name}
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {seasonStandings.length > 0 ? (
                          <>
                            <div className="space-y-2.5">
                              {seasonStandings.map((team, index) => (
                                <div
                                  key={team.team_id}
                                  className="flex items-center gap-3 text-sm"
                                >
                                  <span className="font-display text-lg w-5 text-right text-muted-foreground/50">
                                    {index + 1}
                                  </span>
                                  <span
                                    className="size-3 rounded-sm shrink-0"
                                    style={{ backgroundColor: team.team_color }}
                                  />
                                  <span className="font-medium flex-1 truncate">
                                    {team.team_name}
                                  </span>
                                  <span className="font-display text-base tracking-wide text-muted-foreground">
                                    {team.wins}-{team.losses}
                                  </span>
                                  <span className="w-12 text-right text-xs text-muted-foreground tabular-nums">
                                    {team.win_pct != null
                                      ? (Number(team.win_pct) * 100).toFixed(0) + "%"
                                      : "--"}
                                  </span>
                                </div>
                              ))}
                            </div>
                            {league && (
                              <Link
                                href={`/league/${league.slug}`}
                                className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-4 font-medium"
                              >
                                View full standings
                                <ArrowRight className="size-3.5" />
                              </Link>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No games finalized yet this season.
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <div className="font-display text-2xl text-muted-foreground/30 mb-1">NO ACTIVE SEASONS</div>
                  <p className="text-muted-foreground text-sm">Seasons will appear here when they start.</p>
                </CardContent>
              </Card>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
