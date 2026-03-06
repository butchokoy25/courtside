'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import type { Database } from '@/lib/supabase/database.types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type GameEventInsert = Database['public']['Tables']['game_events']['Insert']

interface Player {
  id: string
  first_name: string
  last_name: string
  jersey_number: string | null
  position: string | null
  user_id: string | null
  created_at: string
}

interface RosterEntry {
  id: string
  team_id: string
  player_id: string
  season_id: string
  is_active: boolean
  players: Player
}

interface Team {
  id: string
  name: string
  abbreviation: string
  color: string
}

interface Game {
  id: string
  season_id: string
  home_team_id: string
  away_team_id: string
  scheduled_at: string
  venue: string | null
  status: 'scheduled' | 'in_progress' | 'final'
  home_score: number
  away_score: number
  current_period: number
  periods: number
  entry_mode: 'live' | 'post_game'
  created_at: string
  home_team: Team
  away_team: Team
  seasons: {
    id: string
    league_id: string
    name: string
    start_date: string | null
    end_date: string | null
    is_active: boolean
    created_at: string
  }
}

interface PlayerStats {
  twoPM: number
  twoPA: number
  threePM: number
  threePA: number
  ftm: number
  fta: number
  reb: number
  ast: number
  stl: number
  blk: number
  to: number
  pf: number
}

const EMPTY_STATS: PlayerStats = {
  twoPM: 0,
  twoPA: 0,
  threePM: 0,
  threePA: 0,
  ftm: 0,
  fta: 0,
  reb: 0,
  ast: 0,
  stl: 0,
  blk: 0,
  to: 0,
  pf: 0,
}

const STAT_COLUMNS: { key: keyof PlayerStats; label: string }[] = [
  { key: 'twoPM', label: '2PM' },
  { key: 'twoPA', label: '2PA' },
  { key: 'threePM', label: '3PM' },
  { key: 'threePA', label: '3PA' },
  { key: 'ftm', label: 'FTM' },
  { key: 'fta', label: 'FTA' },
  { key: 'reb', label: 'REB' },
  { key: 'ast', label: 'AST' },
  { key: 'stl', label: 'STL' },
  { key: 'blk', label: 'BLK' },
  { key: 'to', label: 'TO' },
  { key: 'pf', label: 'PF' },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computePoints(stats: PlayerStats): number {
  return stats.twoPM * 2 + stats.threePM * 3 + stats.ftm
}

function generateSyntheticEvents(
  playerId: string,
  teamId: string,
  gameId: string,
  stats: PlayerStats
): GameEventInsert[] {
  const events: GameEventInsert[] = []
  const period = 1 // All synthetic events assigned to period 1

  // 2-pointers
  for (let i = 0; i < stats.twoPM; i++)
    events.push({
      game_id: gameId,
      player_id: playerId,
      team_id: teamId,
      event_type: '2PT_MADE',
      period,
    })
  for (let i = 0; i < stats.twoPA - stats.twoPM; i++)
    events.push({
      game_id: gameId,
      player_id: playerId,
      team_id: teamId,
      event_type: '2PT_MISS',
      period,
    })

  // 3-pointers
  for (let i = 0; i < stats.threePM; i++)
    events.push({
      game_id: gameId,
      player_id: playerId,
      team_id: teamId,
      event_type: '3PT_MADE',
      period,
    })
  for (let i = 0; i < stats.threePA - stats.threePM; i++)
    events.push({
      game_id: gameId,
      player_id: playerId,
      team_id: teamId,
      event_type: '3PT_MISS',
      period,
    })

  // Free throws
  for (let i = 0; i < stats.ftm; i++)
    events.push({
      game_id: gameId,
      player_id: playerId,
      team_id: teamId,
      event_type: 'FT_MADE',
      period,
    })
  for (let i = 0; i < stats.fta - stats.ftm; i++)
    events.push({
      game_id: gameId,
      player_id: playerId,
      team_id: teamId,
      event_type: 'FT_MISS',
      period,
    })

  // Other stats
  for (let i = 0; i < stats.reb; i++)
    events.push({
      game_id: gameId,
      player_id: playerId,
      team_id: teamId,
      event_type: 'REB',
      period,
    })
  for (let i = 0; i < stats.ast; i++)
    events.push({
      game_id: gameId,
      player_id: playerId,
      team_id: teamId,
      event_type: 'AST',
      period,
    })
  for (let i = 0; i < stats.stl; i++)
    events.push({
      game_id: gameId,
      player_id: playerId,
      team_id: teamId,
      event_type: 'STL',
      period,
    })
  for (let i = 0; i < stats.blk; i++)
    events.push({
      game_id: gameId,
      player_id: playerId,
      team_id: teamId,
      event_type: 'BLK',
      period,
    })
  for (let i = 0; i < stats.to; i++)
    events.push({
      game_id: gameId,
      player_id: playerId,
      team_id: teamId,
      event_type: 'TO',
      period,
    })
  for (let i = 0; i < stats.pf; i++)
    events.push({
      game_id: gameId,
      player_id: playerId,
      team_id: teamId,
      event_type: 'FOUL_PERSONAL',
      period,
    })

  return events
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatInput({
  value,
  onChange,
  ariaLabel,
}: {
  value: number
  onChange: (v: number) => void
  ariaLabel: string
}) {
  return (
    <Input
      type="number"
      inputMode="numeric"
      min={0}
      max={99}
      value={value === 0 ? '' : value}
      onChange={(e) => {
        const raw = e.target.value
        if (raw === '') {
          onChange(0)
          return
        }
        const num = parseInt(raw, 10)
        if (!isNaN(num) && num >= 0) {
          onChange(Math.min(num, 99))
        }
      }}
      aria-label={ariaLabel}
      className="w-12 h-8 px-1 text-center text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
    />
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface PostGameEntryProps {
  game: Game
  homeRoster: RosterEntry[]
  awayRoster: RosterEntry[]
}

export function PostGameEntry({
  game,
  homeRoster,
  awayRoster,
}: PostGameEntryProps) {
  const router = useRouter()
  const supabase = createClient()

  // Per-player stats state keyed by player ID
  const [playerStats, setPlayerStats] = useState<Record<string, PlayerStats>>(
    () => {
      const init: Record<string, PlayerStats> = {}
      ;[...homeRoster, ...awayRoster].forEach((r) => {
        init[r.players.id] = { ...EMPTY_STATS }
      })
      return init
    }
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Update a single stat for a player
  const updateStat = useCallback(
    (playerId: string, key: keyof PlayerStats, value: number) => {
      setPlayerStats((prev) => ({
        ...prev,
        [playerId]: {
          ...prev[playerId],
          [key]: value,
        },
      }))
    },
    []
  )

  // Validation errors
  const validationErrors = useMemo(() => {
    const errors: Record<string, string[]> = {}
    for (const [playerId, stats] of Object.entries(playerStats)) {
      const playerErrors: string[] = []
      if (stats.twoPM > stats.twoPA) playerErrors.push('2PM > 2PA')
      if (stats.threePM > stats.threePA) playerErrors.push('3PM > 3PA')
      if (stats.ftm > stats.fta) playerErrors.push('FTM > FTA')
      if (playerErrors.length > 0) errors[playerId] = playerErrors
    }
    return errors
  }, [playerStats])

  const hasErrors = Object.keys(validationErrors).length > 0

  // Compute team totals
  const teamScores = useMemo(() => {
    let homeScore = 0
    let awayScore = 0

    homeRoster.forEach((r) => {
      const stats = playerStats[r.players.id]
      if (stats) homeScore += computePoints(stats)
    })
    awayRoster.forEach((r) => {
      const stats = playerStats[r.players.id]
      if (stats) awayScore += computePoints(stats)
    })

    return { homeScore, awayScore }
  }, [playerStats, homeRoster, awayRoster])

  // Submit handler
  const handleSubmit = useCallback(async () => {
    if (hasErrors) {
      toast.error('Fix validation errors before submitting')
      return
    }

    setIsSubmitting(true)

    try {
      // Generate all synthetic events
      const allEvents: GameEventInsert[] = []

      for (const entry of homeRoster) {
        const stats = playerStats[entry.players.id]
        if (stats) {
          allEvents.push(
            ...generateSyntheticEvents(
              entry.players.id,
              game.home_team_id,
              game.id,
              stats
            )
          )
        }
      }
      for (const entry of awayRoster) {
        const stats = playerStats[entry.players.id]
        if (stats) {
          allEvents.push(
            ...generateSyntheticEvents(
              entry.players.id,
              game.away_team_id,
              game.id,
              stats
            )
          )
        }
      }

      // Bulk insert events in chunks (Supabase has a row limit per insert)
      const CHUNK_SIZE = 500
      for (let i = 0; i < allEvents.length; i += CHUNK_SIZE) {
        const chunk = allEvents.slice(i, i + CHUNK_SIZE)
        const { error } = await supabase.from('game_events').insert(chunk)
        if (error) {
          throw new Error(`Failed to insert events: ${error.message}`)
        }
      }

      // Update game: set status to final, entry_mode to post_game, scores
      const { error: updateError } = await supabase
        .from('games')
        .update({
          status: 'final' as const,
          entry_mode: 'post_game' as const,
          home_score: teamScores.homeScore,
          away_score: teamScores.awayScore,
        })
        .eq('id', game.id)

      if (updateError) {
        throw new Error(`Failed to update game: ${updateError.message}`)
      }

      toast.success('Box score submitted successfully!')
      router.push(`/admin/schedule`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }, [
    hasErrors,
    homeRoster,
    awayRoster,
    playerStats,
    game.id,
    game.home_team_id,
    game.away_team_id,
    teamScores,
    supabase,
    router,
  ])

  // Format date
  const gameDate = new Date(game.scheduled_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  // Render the stats table for a team
  const renderTeamTable = (
    team: Team,
    roster: RosterEntry[],
    teamLabel: string
  ) => {
    const sorted = [...roster].sort((a, b) => {
      const numA = parseInt(a.players.jersey_number ?? '999', 10)
      const numB = parseInt(b.players.jersey_number ?? '999', 10)
      return numA - numB
    })

    // Team totals
    const totals = sorted.reduce(
      (acc, entry) => {
        const stats = playerStats[entry.players.id]
        if (!stats) return acc
        return {
          pts: acc.pts + computePoints(stats),
          twoPM: acc.twoPM + stats.twoPM,
          twoPA: acc.twoPA + stats.twoPA,
          threePM: acc.threePM + stats.threePM,
          threePA: acc.threePA + stats.threePA,
          ftm: acc.ftm + stats.ftm,
          fta: acc.fta + stats.fta,
          reb: acc.reb + stats.reb,
          ast: acc.ast + stats.ast,
          stl: acc.stl + stats.stl,
          blk: acc.blk + stats.blk,
          to: acc.to + stats.to,
          pf: acc.pf + stats.pf,
        }
      },
      {
        pts: 0,
        twoPM: 0,
        twoPA: 0,
        threePM: 0,
        threePA: 0,
        ftm: 0,
        fta: 0,
        reb: 0,
        ast: 0,
        stl: 0,
        blk: 0,
        to: 0,
        pf: 0,
      }
    )

    return (
      <Card className="py-0 gap-0 overflow-hidden">
        <CardHeader className="py-3 px-4 border-b bg-muted/30">
          <CardTitle className="text-sm flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: team.color }}
            />
            <span className="uppercase tracking-wide">
              {teamLabel}: {team.name}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/20">
                  <th className="text-left px-3 py-2 font-medium whitespace-nowrap sticky left-0 bg-muted/20 z-10">
                    Player
                  </th>
                  <th className="text-center px-1 py-2 font-medium whitespace-nowrap min-w-[48px]">
                    PTS
                  </th>
                  {STAT_COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      className="text-center px-1 py-2 font-medium whitespace-nowrap min-w-[56px]"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((entry) => {
                  const player = entry.players
                  const stats = playerStats[player.id] ?? EMPTY_STATS
                  const pts = computePoints(stats)
                  const errors = validationErrors[player.id]

                  return (
                    <tr
                      key={entry.id}
                      className={
                        errors
                          ? 'border-b border-destructive/30 bg-destructive/5'
                          : 'border-b'
                      }
                    >
                      <td className="px-3 py-2 whitespace-nowrap sticky left-0 bg-background z-10">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs w-6 text-center">
                            {player.jersey_number ?? '--'}
                          </span>
                          <span className="truncate max-w-[100px] text-xs">
                            {player.last_name}
                          </span>
                        </div>
                        {errors && (
                          <div className="text-[10px] text-destructive mt-0.5">
                            {errors.join(', ')}
                          </div>
                        )}
                      </td>
                      <td className="text-center px-1 py-2">
                        <span className="font-bold text-sm tabular-nums">
                          {pts}
                        </span>
                      </td>
                      {STAT_COLUMNS.map((col) => (
                        <td key={col.key} className="px-1 py-1 text-center">
                          <StatInput
                            value={stats[col.key]}
                            onChange={(v) => updateStat(player.id, col.key, v)}
                            ariaLabel={`${player.first_name} ${player.last_name} ${col.label}`}
                          />
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 bg-muted/30 font-semibold">
                  <td className="px-3 py-2 text-xs uppercase sticky left-0 bg-muted/30 z-10">
                    Totals
                  </td>
                  <td className="text-center px-1 py-2 text-sm tabular-nums">
                    {totals.pts}
                  </td>
                  <td className="text-center px-1 py-2 text-xs tabular-nums">
                    {totals.twoPM}
                  </td>
                  <td className="text-center px-1 py-2 text-xs tabular-nums">
                    {totals.twoPA}
                  </td>
                  <td className="text-center px-1 py-2 text-xs tabular-nums">
                    {totals.threePM}
                  </td>
                  <td className="text-center px-1 py-2 text-xs tabular-nums">
                    {totals.threePA}
                  </td>
                  <td className="text-center px-1 py-2 text-xs tabular-nums">
                    {totals.ftm}
                  </td>
                  <td className="text-center px-1 py-2 text-xs tabular-nums">
                    {totals.fta}
                  </td>
                  <td className="text-center px-1 py-2 text-xs tabular-nums">
                    {totals.reb}
                  </td>
                  <td className="text-center px-1 py-2 text-xs tabular-nums">
                    {totals.ast}
                  </td>
                  <td className="text-center px-1 py-2 text-xs tabular-nums">
                    {totals.stl}
                  </td>
                  <td className="text-center px-1 py-2 text-xs tabular-nums">
                    {totals.blk}
                  </td>
                  <td className="text-center px-1 py-2 text-xs tabular-nums">
                    {totals.to}
                  </td>
                  <td className="text-center px-1 py-2 text-xs tabular-nums">
                    {totals.pf}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="border-b px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-lg font-bold">
            Post-Game Entry: {game.home_team.name} vs {game.away_team.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{gameDate}</p>
          {/* Score summary */}
          <div className="mt-2 flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: game.home_team.color }}
              />
              <span className="font-semibold">
                {game.home_team.abbreviation}
              </span>
              <span className="font-bold text-lg tabular-nums">
                {teamScores.homeScore}
              </span>
            </span>
            <span className="text-muted-foreground">-</span>
            <span className="flex items-center gap-1.5">
              <span className="font-bold text-lg tabular-nums">
                {teamScores.awayScore}
              </span>
              <span className="font-semibold">
                {game.away_team.abbreviation}
              </span>
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: game.away_team.color }}
              />
            </span>
          </div>
        </div>
      </div>

      {/* Tables */}
      <div className="flex-1 overflow-auto p-4 space-y-6 max-w-4xl mx-auto w-full">
        {renderTeamTable(game.home_team, homeRoster, 'Home')}
        {renderTeamTable(game.away_team, awayRoster, 'Away')}
      </div>

      {/* Submit button */}
      <div className="border-t p-4 bg-background">
        <div className="max-w-4xl mx-auto">
          {hasErrors && (
            <p className="text-sm text-destructive mb-2 text-center">
              Fix validation errors above (made cannot exceed attempted)
            </p>
          )}
          <Button
            size="lg"
            className="w-full"
            disabled={hasErrors || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting && <Loader2 className="animate-spin" />}
            Submit Box Score
          </Button>
        </div>
      </div>
    </div>
  )
}
