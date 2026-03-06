"use client"

import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

// ─── Types ───────────────────────────────────────────────────────────────────

type RosterPlayer = {
  id: string
  firstName: string
  lastName: string
  jerseyNumber: string | null
  position: string | null
  ppg: number | null
  rpg: number | null
  apg: number | null
}

type ScheduleGame = {
  gameId: string
  date: string
  prefix: string
  opponentName: string
  opponentAbbr: string
  resultText: string
  resultColor: string
  status: "scheduled" | "in_progress" | "final"
}

type TeamStats = {
  ppg: number | null
  rpg: number | null
  apg: number | null
  spg: number | null
  bpg: number | null
  fgPct: number | null
  threePct: number | null
  ftPct: number | null
}

type TeamTabsProps = {
  roster: RosterPlayer[]
  schedule: ScheduleGame[]
  teamStats: TeamStats
  teamColor: string
  teamId: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statDisplay(val: number | null): string {
  if (val === null || val === undefined) return "---"
  return val.toFixed(1)
}

function pctDisplay(val: number | null): string {
  if (val === null || val === undefined) return "---"
  return val.toFixed(3).replace(/^0/, "")
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TeamTabs({
  roster,
  schedule,
  teamStats,
  teamColor,
  teamId,
}: TeamTabsProps) {
  return (
    <Tabs defaultValue="roster" className="w-full">
      <TabsList className="w-full grid grid-cols-3">
        <TabsTrigger value="roster">Roster</TabsTrigger>
        <TabsTrigger value="schedule">Schedule</TabsTrigger>
        <TabsTrigger value="stats">Stats</TabsTrigger>
      </TabsList>

      {/* ── Roster Tab ─────────────────────────────────────────────────── */}
      <TabsContent value="roster">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Roster</CardTitle>
          </CardHeader>
          <CardContent>
            {roster.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No players on the roster yet.
              </p>
            ) : (
              <div className="overflow-x-auto -mx-6">
                <div className="min-w-[480px] px-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-14 text-center">#</TableHead>
                        <TableHead>Player</TableHead>
                        <TableHead className="w-16 text-center">Pos</TableHead>
                        <TableHead className="w-16 text-right">PPG</TableHead>
                        <TableHead className="w-16 text-right">RPG</TableHead>
                        <TableHead className="w-16 text-right">APG</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roster.map((player) => (
                        <TableRow key={player.id}>
                          <TableCell className="text-center font-mono text-muted-foreground">
                            {player.jerseyNumber ?? "-"}
                          </TableCell>
                          <TableCell>
                            <Link
                              href={`/player/${player.id}`}
                              className="font-medium hover:underline transition-colors"
                              style={{ color: teamColor }}
                            >
                              {player.firstName} {player.lastName}
                            </Link>
                          </TableCell>
                          <TableCell className="text-center">
                            {player.position ? (
                              <Badge variant="outline" className="text-xs">
                                {player.position}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {statDisplay(player.ppg)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {statDisplay(player.rpg)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {statDisplay(player.apg)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* ── Schedule Tab ───────────────────────────────────────────────── */}
      <TabsContent value="schedule">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            {schedule.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No games scheduled yet.
              </p>
            ) : (
              <div className="space-y-1">
                {schedule.map((game) => (
                  <Link
                    key={game.gameId}
                    href={`/game/${game.gameId}`}
                    className="flex items-center justify-between rounded-lg px-3 py-3 transition-colors hover:bg-muted/50 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm font-mono text-muted-foreground w-14 shrink-0">
                        {game.date}
                      </span>
                      <span className="text-xs text-muted-foreground w-6 shrink-0 text-center">
                        {game.prefix}
                      </span>
                      <span className="text-sm font-medium truncate">
                        {game.opponentName}
                      </span>
                    </div>
                    <span className={`text-sm font-medium shrink-0 ml-3 ${game.resultColor}`}>
                      {game.resultText}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* ── Stats Tab ──────────────────────────────────────────────────── */}
      <TabsContent value="stats">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Team Stats</CardTitle>
          </CardHeader>
          <CardContent>
            {teamStats.ppg === null ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No stats available yet. Games must be finalized to compute stats.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatBlock label="PPG" value={statDisplay(teamStats.ppg)} color={teamColor} />
                <StatBlock label="RPG" value={statDisplay(teamStats.rpg)} color={teamColor} />
                <StatBlock label="APG" value={statDisplay(teamStats.apg)} color={teamColor} />
                <StatBlock label="SPG" value={statDisplay(teamStats.spg)} color={teamColor} />
                <StatBlock label="BPG" value={statDisplay(teamStats.bpg)} color={teamColor} />
                <StatBlock label="FG%" value={pctDisplay(teamStats.fgPct)} color={teamColor} />
                <StatBlock label="3PT%" value={pctDisplay(teamStats.threePct)} color={teamColor} />
                <StatBlock label="FT%" value={pctDisplay(teamStats.ftPct)} color={teamColor} />
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

// ─── Stat Block Subcomponent ─────────────────────────────────────────────────

function StatBlock({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color: string
}) {
  return (
    <div className="rounded-lg border bg-card p-4 text-center">
      <div
        className="text-2xl font-bold tabular-nums"
        style={{ color }}
      >
        {value}
      </div>
      <div className="mt-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </div>
    </div>
  )
}
