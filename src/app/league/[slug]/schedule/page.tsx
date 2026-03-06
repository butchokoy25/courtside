import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Calendar } from "lucide-react"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: league } = await supabase
    .from("leagues")
    .select("name")
    .eq("slug", slug)
    .single()

  return {
    title: league ? `Schedule - ${league.name} - Courtside` : "Schedule - Courtside",
  }
}

export default async function SchedulePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ team?: string }>
}) {
  const { slug } = await params
  const { team: filterTeamId } = await searchParams
  const supabase = await createClient()

  // Validate UUID to prevent filter injection
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const safeFilterTeamId = filterTeamId && UUID_REGEX.test(filterTeamId) ? filterTeamId : undefined

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

  // Fetch teams for filter dropdown
  const { data: teams, error: teamsError } = await supabase
    .from("teams")
    .select("id, name, abbreviation, color")
    .eq("league_id", league.id)
    .order("name")
  if (teamsError) console.error('[SCHEDULE] Failed to fetch teams:', teamsError.message)

  // Fetch all games for the active season
  type GameRow = {
    id: string
    home_score: number
    away_score: number
    scheduled_at: string
    status: "scheduled" | "in_progress" | "final"
    venue: string | null
    home_team: { id: string; name: string; abbreviation: string; color: string }
    away_team: { id: string; name: string; abbreviation: string; color: string }
  }

  let games: GameRow[] = []

  if (activeSeason) {
    let query = supabase
      .from("games")
      .select(`
        id,
        home_score,
        away_score,
        scheduled_at,
        status,
        venue,
        home_team:teams!games_home_team_id_fkey(id, name, abbreviation, color),
        away_team:teams!games_away_team_id_fkey(id, name, abbreviation, color)
      `)
      .eq("season_id", activeSeason.id)
      .order("scheduled_at", { ascending: true })

    // Apply team filter if provided
    if (safeFilterTeamId) {
      query = query.or(`home_team_id.eq.${safeFilterTeamId},away_team_id.eq.${safeFilterTeamId}`)
    }

    const { data, error: gamesError } = await query
    if (gamesError) console.error('[SCHEDULE] Failed to fetch games:', gamesError.message)
    games = (data ?? []) as unknown as GameRow[]
  }

  // Group games by date
  const gamesByDate = new Map<string, GameRow[]>()
  games.forEach((game) => {
    const dateKey = new Date(game.scheduled_at).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    if (!gamesByDate.has(dateKey)) {
      gamesByDate.set(dateKey, [])
    }
    gamesByDate.get(dateKey)!.push(game)
  })

  const statusColors: Record<string, "default" | "secondary" | "outline"> = {
    final: "secondary",
    in_progress: "default",
    scheduled: "outline",
  }

  const statusLabels: Record<string, string> = {
    final: "Final",
    in_progress: "Live",
    scheduled: "Scheduled",
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <section className="border-b bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <span>/</span>
            <Link href={`/league/${slug}`} className="hover:text-foreground">{league.name}</Link>
            <span>/</span>
            <span>Schedule</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl flex items-center gap-2">
            <Calendar className="size-7" />
            Schedule
          </h1>
          {activeSeason && (
            <p className="mt-1 text-muted-foreground">{activeSeason.name}</p>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {!activeSeason ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No active season for this league.
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Team Filter */}
            {teams && teams.length > 0 && (
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground mr-1">Filter:</span>
                <Link
                  href={`/league/${slug}/schedule`}
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    !safeFilterTeamId
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  All Teams
                </Link>
                {teams.map((team) => (
                  <Link
                    key={team.id}
                    href={`/league/${slug}/schedule?team=${team.id}`}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      safeFilterTeamId === team.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: team.color }}
                    />
                    {team.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Games */}
            {games.length > 0 ? (
              <div className="space-y-8">
                {Array.from(gamesByDate.entries()).map(([date, dateGames]) => (
                  <div key={date}>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                      {date}
                    </h3>
                    {/* Mobile: cards; Desktop: table */}
                    {/* Mobile view */}
                    <div className="space-y-3 md:hidden">
                      {dateGames.map((game) => {
                        const homeWon = game.status === "final" && game.home_score > game.away_score
                        const awayWon = game.status === "final" && game.away_score > game.home_score
                        const gameTime = new Date(game.scheduled_at).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })

                        return (
                          <Link key={game.id} href={`/game/${game.id}`}>
                            <Card className="transition-shadow hover:shadow-md">
                              <CardContent className="py-3 px-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs text-muted-foreground">{gameTime}</span>
                                  <Badge variant={statusColors[game.status]}>
                                    {statusLabels[game.status]}
                                  </Badge>
                                </div>
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="size-2.5 rounded-full shrink-0"
                                      style={{ backgroundColor: game.away_team.color }}
                                    />
                                    <span className={`text-sm flex-1 truncate ${awayWon ? "font-bold" : ""}`}>
                                      {game.away_team.name}
                                    </span>
                                    {game.status !== "scheduled" && (
                                      <span className={`text-sm tabular-nums ${awayWon ? "font-bold" : "text-muted-foreground"}`}>
                                        {game.away_score}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="size-2.5 rounded-full shrink-0"
                                      style={{ backgroundColor: game.home_team.color }}
                                    />
                                    <span className={`text-sm flex-1 truncate ${homeWon ? "font-bold" : ""}`}>
                                      {game.home_team.name}
                                    </span>
                                    {game.status !== "scheduled" && (
                                      <span className={`text-sm tabular-nums ${homeWon ? "font-bold" : "text-muted-foreground"}`}>
                                        {game.home_score}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {game.venue && (
                                  <p className="text-xs text-muted-foreground mt-2">{game.venue}</p>
                                )}
                              </CardContent>
                            </Card>
                          </Link>
                        )
                      })}
                    </div>

                    {/* Desktop view */}
                    <Card className="hidden md:block">
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-20">Time</TableHead>
                              <TableHead>Away</TableHead>
                              <TableHead className="w-12 text-center">Score</TableHead>
                              <TableHead>Home</TableHead>
                              <TableHead className="w-24">Venue</TableHead>
                              <TableHead className="w-24 text-center">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {dateGames.map((game) => {
                              const homeWon = game.status === "final" && game.home_score > game.away_score
                              const awayWon = game.status === "final" && game.away_score > game.home_score
                              const gameTime = new Date(game.scheduled_at).toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                              })

                              return (
                                <TableRow key={game.id} className="cursor-pointer">
                                  <TableCell className="text-sm text-muted-foreground">
                                    {gameTime}
                                  </TableCell>
                                  <TableCell>
                                    <Link href={`/game/${game.id}`} className="flex items-center gap-2 hover:underline">
                                      <span
                                        className="size-2.5 rounded-full shrink-0"
                                        style={{ backgroundColor: game.away_team.color }}
                                      />
                                      <span className={awayWon ? "font-bold" : ""}>
                                        {game.away_team.name}
                                      </span>
                                    </Link>
                                  </TableCell>
                                  <TableCell className="text-center tabular-nums text-sm">
                                    {game.status !== "scheduled" ? (
                                      <Link href={`/game/${game.id}`} className="hover:underline">
                                        <span className={awayWon ? "font-bold" : ""}>{game.away_score}</span>
                                        <span className="text-muted-foreground mx-1">-</span>
                                        <span className={homeWon ? "font-bold" : ""}>{game.home_score}</span>
                                      </Link>
                                    ) : (
                                      <span className="text-muted-foreground">vs</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Link href={`/game/${game.id}`} className="flex items-center gap-2 hover:underline">
                                      <span
                                        className="size-2.5 rounded-full shrink-0"
                                        style={{ backgroundColor: game.home_team.color }}
                                      />
                                      <span className={homeWon ? "font-bold" : ""}>
                                        {game.home_team.name}
                                      </span>
                                    </Link>
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground truncate max-w-[120px]">
                                    {game.venue ?? "--"}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Badge variant={statusColors[game.status]} className="text-xs">
                                      {statusLabels[game.status]}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Calendar className="size-8 mx-auto mb-2 opacity-50" />
                  {safeFilterTeamId
                    ? "No games found for this team."
                    : "No games scheduled for this season yet."}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </main>
  )
}
