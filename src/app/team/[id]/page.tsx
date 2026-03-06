import { notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TeamTabs } from "./team-tabs"

// ─── Types ───────────────────────────────────────────────────────────────────

type TeamRow = {
  id: string
  name: string
  abbreviation: string
  color: string
  league_id: string
  leagues: { name: string; slug: string } | null
}

type StandingsRow = {
  team_id: string
  season_id: string
  wins: number
  losses: number
  win_pct: number | null
}

type RosterPlayer = {
  player_id: string
  players: {
    id: string
    first_name: string
    last_name: string
    jersey_number: string | null
    position: string | null
  } | null
}

type PlayerSeasonStat = {
  player_id: string
  ppg: number | null
  rpg: number | null
  apg: number | null
  spg: number | null
  bpg: number | null
  fg_pct: number | null
  three_pct: number | null
  ft_pct: number | null
  games_played: number | null
  total_pts: number | null
  total_reb: number | null
  total_ast: number | null
  total_stl: number | null
  total_blk: number | null
  total_fgm: number | null
  total_fga: number | null
  total_three_pm: number | null
  total_three_pa: number | null
  total_ftm: number | null
  total_fta: number | null
}

type GameRow = {
  id: string
  scheduled_at: string
  status: "scheduled" | "in_progress" | "final"
  home_score: number
  away_score: number
  home_team_id: string
  away_team_id: string
  venue: string | null
  home_team: { id: string; name: string; abbreviation: string } | null
  away_team: { id: string; name: string; abbreviation: string } | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })
}

function pctDisplay(val: number | null): string {
  if (val === null || val === undefined) return "---"
  return val.toFixed(3).replace(/^0/, "")
}

function statDisplay(val: number | null): string {
  if (val === null || val === undefined) return "---"
  return val.toFixed(1)
}

// ─── Page Component ──────────────────────────────────────────────────────────

export default async function TeamPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Validate UUID to prevent filter injection
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!UUID_REGEX.test(id)) notFound()

  // 1. Fetch team with league info
  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("*, leagues(name, slug)")
    .eq("id", id)
    .single()

  if (teamError || !team) {
    notFound()
  }

  const typedTeam = team as unknown as TeamRow

  // 2. Get the active season for this team's league
  const { data: activeSeason } = await supabase
    .from("seasons")
    .select("*")
    .eq("league_id", typedTeam.league_id)
    .eq("is_active", true)
    .single()

  const seasonId = activeSeason?.id

  // 3. Fetch team standings for this season
  let standings: StandingsRow | null = null
  if (seasonId) {
    const { data, error: standingsError } = await supabase
      .from("team_standings" as never)
      .select("*")
      .eq("team_id", id)
      .eq("season_id", seasonId)
      .single()
    if (standingsError && standingsError.code !== 'PGRST116') console.error('[TEAM] Failed to fetch standings:', standingsError.message)
    standings = data as unknown as StandingsRow | null
  }

  // 4. Fetch roster players for active season
  let rosterPlayers: RosterPlayer[] = []
  if (seasonId) {
    const { data, error: rosterError } = await supabase
      .from("team_rosters")
      .select("player_id, players(id, first_name, last_name, jersey_number, position)")
      .eq("team_id", id)
      .eq("season_id", seasonId)
      .eq("is_active", true)
    if (rosterError) console.error('[TEAM] Failed to fetch roster:', rosterError.message)
    rosterPlayers = (data ?? []) as unknown as RosterPlayer[]
  }

  // 5. Fetch player season stats for this team and season
  let playerStats: PlayerSeasonStat[] = []
  if (seasonId) {
    const { data, error: statsError } = await supabase
      .from("player_season_stats" as never)
      .select("*")
      .eq("team_id", id)
      .eq("season_id", seasonId)
    if (statsError) console.error('[TEAM] Failed to fetch player stats:', (statsError as { message: string }).message)
    playerStats = (data ?? []) as unknown as PlayerSeasonStat[]
  }

  // 6. Fetch games for this team in active season
  let games: GameRow[] = []
  if (seasonId) {
    const { data: homeGames, error: gamesError } = await supabase
      .from("games")
      .select("id, scheduled_at, status, home_score, away_score, home_team_id, away_team_id, venue, home_team:teams!games_home_team_id_fkey(id, name, abbreviation), away_team:teams!games_away_team_id_fkey(id, name, abbreviation)")
      .eq("season_id", seasonId)
      .or(`home_team_id.eq.${id},away_team_id.eq.${id}`)
      .order("scheduled_at", { ascending: true })
    if (gamesError) console.error('[TEAM] Failed to fetch games:', gamesError.message)
    games = (homeGames ?? []) as unknown as GameRow[]
  }

  // ─── Build roster with stats ─────────────────────────────────────────────

  const statsMap = new Map(playerStats.map((s) => [s.player_id, s]))

  const roster = rosterPlayers
    .filter((r) => r.players)
    .map((r) => {
      const p = r.players!
      const s = statsMap.get(r.player_id)
      return {
        id: p.id,
        firstName: p.first_name,
        lastName: p.last_name,
        jerseyNumber: p.jersey_number,
        position: p.position,
        ppg: s?.ppg ?? null,
        rpg: s?.rpg ?? null,
        apg: s?.apg ?? null,
      }
    })
    .sort((a, b) => (b.ppg ?? 0) - (a.ppg ?? 0))

  // ─── Build schedule data ─────────────────────────────────────────────────

  const schedule = games.map((g) => {
    const isHome = g.home_team_id === id
    const opponent = isHome ? g.away_team : g.home_team
    const prefix = isHome ? "vs" : "@"
    let resultText = ""
    let resultColor = ""

    if (g.status === "final") {
      const teamScore = isHome ? g.home_score : g.away_score
      const opponentScore = isHome ? g.away_score : g.home_score
      const won = teamScore > opponentScore
      resultText = `${won ? "W" : "L"} ${teamScore}-${opponentScore}`
      resultColor = won ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
    } else if (g.status === "in_progress") {
      const teamScore = isHome ? g.home_score : g.away_score
      const opponentScore = isHome ? g.away_score : g.home_score
      resultText = `Live ${teamScore}-${opponentScore}`
      resultColor = "text-amber-600 dark:text-amber-400"
    } else {
      resultText = `Scheduled ${formatTime(g.scheduled_at)}`
      resultColor = "text-muted-foreground"
    }

    return {
      gameId: g.id,
      date: formatDate(g.scheduled_at),
      prefix,
      opponentName: opponent?.name ?? "TBD",
      opponentAbbr: opponent?.abbreviation ?? "TBD",
      resultText,
      resultColor,
      status: g.status,
    }
  })

  // ─── Compute team aggregate stats ────────────────────────────────────────

  const totalGames = standings ? (standings.wins + standings.losses) : 0

  const aggTotalPts = playerStats.reduce((sum, s) => sum + (s.total_pts ?? 0), 0)
  const aggTotalReb = playerStats.reduce((sum, s) => sum + (s.total_reb ?? 0), 0)
  const aggTotalAst = playerStats.reduce((sum, s) => sum + (s.total_ast ?? 0), 0)
  const aggTotalStl = playerStats.reduce((sum, s) => sum + (s.total_stl ?? 0), 0)
  const aggTotalBlk = playerStats.reduce((sum, s) => sum + (s.total_blk ?? 0), 0)
  const aggTotalFgm = playerStats.reduce((sum, s) => sum + (s.total_fgm ?? 0), 0)
  const aggTotalFga = playerStats.reduce((sum, s) => sum + (s.total_fga ?? 0), 0)
  const aggTotal3pm = playerStats.reduce((sum, s) => sum + (s.total_three_pm ?? 0), 0)
  const aggTotal3pa = playerStats.reduce((sum, s) => sum + (s.total_three_pa ?? 0), 0)
  const aggTotalFtm = playerStats.reduce((sum, s) => sum + (s.total_ftm ?? 0), 0)
  const aggTotalFta = playerStats.reduce((sum, s) => sum + (s.total_fta ?? 0), 0)

  const teamStats = {
    ppg: totalGames > 0 ? aggTotalPts / totalGames : null,
    rpg: totalGames > 0 ? aggTotalReb / totalGames : null,
    apg: totalGames > 0 ? aggTotalAst / totalGames : null,
    spg: totalGames > 0 ? aggTotalStl / totalGames : null,
    bpg: totalGames > 0 ? aggTotalBlk / totalGames : null,
    fgPct: aggTotalFga > 0 ? aggTotalFgm / aggTotalFga : null,
    threePct: aggTotal3pa > 0 ? aggTotal3pm / aggTotal3pa : null,
    ftPct: aggTotalFta > 0 ? aggTotalFtm / aggTotalFta : null,
  }

  // ─── Build record string ────────────────────────────────────────────────

  const wins = standings?.wins ?? 0
  const losses = standings?.losses ?? 0
  const winPct = standings?.win_pct ?? null
  const recordStr = standings
    ? `${wins}-${losses} (${pctDisplay(winPct)})`
    : "0-0"

  // ─── Render ──────────────────────────────────────────────────────────────

  const leagueName = typedTeam.leagues?.name ?? "League"
  const leagueSlug = typedTeam.leagues?.slug ?? ""
  const teamColor = typedTeam.color || "#6366f1"

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-4 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <span className="mx-2">&gt;</span>
          <Link
            href={`/league/${leagueSlug}`}
            className="hover:text-foreground transition-colors"
          >
            {leagueName}
          </Link>
          <span className="mx-2">&gt;</span>
          <span className="text-foreground">{typedTeam.name}</span>
        </nav>

        {/* Team Header Card */}
        <Card className="mb-6 overflow-hidden">
          <div className="h-2" style={{ backgroundColor: teamColor }} />
          <CardHeader>
            <div className="flex items-center gap-3">
              <div
                className="flex size-12 items-center justify-center rounded-lg text-lg font-bold text-white"
                style={{ backgroundColor: teamColor }}
              >
                {typedTeam.abbreviation}
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl">{typedTeam.name}</CardTitle>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">
                    Record: {recordStr}
                  </Badge>
                  <Link href={`/league/${leagueSlug}`}>
                    <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                      {leagueName}
                    </Badge>
                  </Link>
                  {activeSeason && (
                    <Badge variant="outline">
                      {activeSeason.name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Tabs: Roster / Schedule / Stats */}
        <TeamTabs
          roster={roster}
          schedule={schedule}
          teamStats={teamStats}
          teamColor={teamColor}
          teamId={id}
        />
      </div>
    </div>
  )
}
