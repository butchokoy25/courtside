import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp } from "lucide-react"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: league } = await supabase
    .from("leagues")
    .select("name")
    .eq("slug", slug)
    .single()

  return {
    title: league ? `Leaders - ${league.name} - Courtside` : "Leaders - Courtside",
  }
}

type StatLeader = {
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
}

export default async function LeadersPage({ params }: { params: Promise<{ slug: string }> }) {
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

  // Fetch stat leaders
  let statLeaders: StatLeader[] = []

  if (activeSeason) {
    const { data, error: leadersError } = await supabase
      .from("stat_leaders")
      .select("*")
      .eq("season_id", activeSeason.id)
    if (leadersError) console.error('[LEADERS] Failed to fetch stat leaders:', leadersError.message)

    statLeaders = (data ?? []) as StatLeader[]
  }

  // Fetch team info for color dots
  const { data: teams, error: teamsError } = await supabase
    .from("teams")
    .select("id, name, abbreviation, color")
    .eq("league_id", league.id)
  if (teamsError) console.error('[LEADERS] Failed to fetch teams:', teamsError.message)

  const teamMap = new Map(teams?.map((t) => [t.id, t]) ?? [])

  // Sort for each category (top 10)
  const topPPG = [...statLeaders].sort((a, b) => Number(b.ppg) - Number(a.ppg)).slice(0, 10)
  const topRPG = [...statLeaders].sort((a, b) => Number(b.rpg) - Number(a.rpg)).slice(0, 10)
  const topAPG = [...statLeaders].sort((a, b) => Number(b.apg) - Number(a.apg)).slice(0, 10)
  const topSPG = [...statLeaders].sort((a, b) => Number(b.spg) - Number(a.spg)).slice(0, 10)
  const topBPG = [...statLeaders].sort((a, b) => Number(b.bpg) - Number(a.bpg)).slice(0, 10)

  function LeaderTable({
    players,
    statKey,
    statLabel,
  }: {
    players: StatLeader[]
    statKey: keyof StatLeader
    statLabel: string
  }) {
    if (players.length === 0) {
      return (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No stats available yet.
          </CardContent>
        </Card>
      )
    }

    return (
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 text-center">#</TableHead>
                <TableHead>Player</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="text-center w-12">GP</TableHead>
                <TableHead className="text-right w-16">{statLabel}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.map((player, index) => {
                const team = teamMap.get(player.team_id)
                return (
                  <TableRow key={player.player_id}>
                    <TableCell className="text-center text-muted-foreground tabular-nums">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {player.jersey_number && (
                          <span className="text-xs text-muted-foreground w-5 text-right">
                            #{player.jersey_number}
                          </span>
                        )}
                        <span className="font-medium">
                          {player.first_name} {player.last_name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {team && (
                        <Link
                          href={`/team/${team.id}`}
                          className="flex items-center gap-1.5 hover:underline"
                        >
                          <span
                            className="size-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: team.color }}
                          />
                          <span className="text-sm">{team.abbreviation}</span>
                        </Link>
                      )}
                    </TableCell>
                    <TableCell className="text-center tabular-nums text-muted-foreground">
                      {player.games_played}
                    </TableCell>
                    <TableCell className="text-right font-bold tabular-nums">
                      {Number(player[statKey]).toFixed(1)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    )
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
            <span>Leaders</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl flex items-center gap-2">
            <TrendingUp className="size-7" />
            Stat Leaders
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
        ) : statLeaders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <TrendingUp className="size-8 mx-auto mb-2 opacity-50" />
              No player stats available yet. Stats appear after games are finalized.
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="ppg" className="w-full">
            <TabsList className="mb-6 w-full flex-wrap h-auto p-1">
              <TabsTrigger value="ppg">Points</TabsTrigger>
              <TabsTrigger value="rpg">Rebounds</TabsTrigger>
              <TabsTrigger value="apg">Assists</TabsTrigger>
              <TabsTrigger value="spg">Steals</TabsTrigger>
              <TabsTrigger value="bpg">Blocks</TabsTrigger>
            </TabsList>

            <TabsContent value="ppg">
              <LeaderTable players={topPPG} statKey="ppg" statLabel="PPG" />
            </TabsContent>

            <TabsContent value="rpg">
              <LeaderTable players={topRPG} statKey="rpg" statLabel="RPG" />
            </TabsContent>

            <TabsContent value="apg">
              <LeaderTable players={topAPG} statKey="apg" statLabel="APG" />
            </TabsContent>

            <TabsContent value="spg">
              <LeaderTable players={topSPG} statKey="spg" statLabel="SPG" />
            </TabsContent>

            <TabsContent value="bpg">
              <LeaderTable players={topBPG} statKey="bpg" statLabel="BPG" />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </main>
  )
}
