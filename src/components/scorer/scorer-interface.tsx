'use client'

import { useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { updateGameStatus, updateGamePeriod } from '@/lib/actions/scorer'
import { toast } from 'sonner'
import { Scoreboard } from './scoreboard'
import { PlayerCard } from './player-card'
import { StatButtons, SHOT_EVENTS } from './stat-buttons'
import type { EventType } from './stat-buttons'
import { ShotChart } from './shot-chart'
import { RosterConfirm } from './roster-confirm'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Team {
  id: string
  name: string
  abbreviation: string
  color: string
  league_id: string
  created_at: string
}

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
  }
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

interface SelectedPlayer {
  id: string
  firstName: string
  lastName: string
  jerseyNumber: string | null
  teamId: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pointsForEventType(eventType: string): number {
  if (eventType === '2PT_MADE') return 2
  if (eventType === '3PT_MADE') return 3
  if (eventType === 'FT_MADE') return 1
  return 0
}

function eventTypeLabel(eventType: string): string {
  const map: Record<string, string> = {
    '2PT_MADE': '+2',
    '3PT_MADE': '+3',
    FT_MADE: 'FT',
    '2PT_MISS': 'Miss 2',
    '3PT_MISS': 'Miss 3',
    FT_MISS: 'Miss FT',
    REB: 'REB',
    AST: 'AST',
    STL: 'STL',
    BLK: 'BLK',
    TO: 'TO',
    FOUL_PERSONAL: 'FOUL',
    FOUL_TECH: 'TECH',
  }
  return map[eventType] ?? eventType
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ScorerInterfaceProps {
  game: Game
  homeRoster: RosterEntry[]
  awayRoster: RosterEntry[]
  initialEvents: GameEvent[]
}

export function ScorerInterface({
  game,
  homeRoster,
  awayRoster,
  initialEvents,
}: ScorerInterfaceProps) {
  const supabase = createClient()

  // State
  const [events, setEvents] = useState<GameEvent[]>(initialEvents)
  const [selectedPlayer, setSelectedPlayer] = useState<SelectedPlayer | null>(
    null
  )
  const [homeScore, setHomeScore] = useState(game.home_score)
  const [awayScore, setAwayScore] = useState(game.away_score)
  const [currentPeriod, setCurrentPeriod] = useState(game.current_period)
  const [gameStatus, setGameStatus] = useState(game.status)
  const [isRecording, setIsRecording] = useState(false)
  const [pendingShotEvent, setPendingShotEvent] = useState<EventType | null>(
    null
  )
  const [showUndoId, setShowUndoId] = useState<string | null>(null)
  const [showRosterConfirm, setShowRosterConfirm] = useState(
    game.status === 'scheduled'
  )

  // Compute per-player points for this game
  const playerPoints = useMemo(() => {
    const pts: Record<string, number> = {}
    for (const e of events) {
      const p = pointsForEventType(e.event_type)
      if (p > 0) {
        pts[e.player_id] = (pts[e.player_id] ?? 0) + p
      }
    }
    return pts
  }, [events])

  // ------ Recording events ------

  const recordEvent = useCallback(
    async (eventType: EventType, courtX?: number, courtY?: number) => {
      if (!selectedPlayer || isRecording) return
      setIsRecording(true)

      const newEventData = {
        game_id: game.id,
        player_id: selectedPlayer.id,
        team_id: selectedPlayer.teamId,
        event_type: eventType as '2PT_MADE' | '2PT_MISS' | '3PT_MADE' | '3PT_MISS' | 'FT_MADE' | 'FT_MISS' | 'REB' | 'AST' | 'STL' | 'BLK' | 'TO' | 'FOUL_PERSONAL' | 'FOUL_TECH',
        period: currentPeriod,
        court_x: courtX ?? null,
        court_y: courtY ?? null,
      }

      // Optimistic: update local score immediately
      const pts = pointsForEventType(eventType)
      if (pts > 0) {
        if (selectedPlayer.teamId === game.home_team_id) {
          setHomeScore((s) => s + pts)
        } else {
          setAwayScore((s) => s + pts)
        }
      }

      const playerName = `${selectedPlayer.firstName} ${selectedPlayer.lastName}`
      const label = eventTypeLabel(eventType)

      // Insert via browser client for speed
      const { data, error } = await supabase
        .from('game_events')
        .insert(newEventData)
        .select('*, players(first_name, last_name, jersey_number)')
        .single()

      if (error) {
        // Revert optimistic score
        if (pts > 0) {
          if (selectedPlayer.teamId === game.home_team_id) {
            setHomeScore((s) => s - pts)
          } else {
            setAwayScore((s) => s - pts)
          }
        }
        toast.error(`Failed to record: ${error.message}`)
      } else if (data) {
        setEvents((prev) => [data as GameEvent, ...prev])
        toast.success(`${playerName}: ${label}`, { duration: 1500 })

        // Also update score in DB
        if (pts > 0) {
          const { error: scoreError } = await supabase
            .from('games')
            .update({
              home_score:
                selectedPlayer.teamId === game.home_team_id
                  ? homeScore + pts
                  : homeScore,
              away_score:
                selectedPlayer.teamId === game.away_team_id
                  ? awayScore + pts
                  : awayScore,
            })
            .eq('id', game.id)
          if (scoreError) console.error('[SCORER] Score update failed:', scoreError.message)
        }

        // Show undo briefly
        setShowUndoId(data.id)
        setTimeout(() => setShowUndoId(null), 5000)
      }

      setSelectedPlayer(null)
      setPendingShotEvent(null)
      setIsRecording(false)
    },
    [
      selectedPlayer,
      isRecording,
      currentPeriod,
      game.id,
      game.home_team_id,
      game.away_team_id,
      homeScore,
      awayScore,
      supabase,
    ]
  )

  // Delete (undo) an event
  const undoEvent = useCallback(
    async (eventId: string) => {
      const event = events.find((e) => e.id === eventId)
      if (!event) return

      const { error } = await supabase
        .from('game_events')
        .delete()
        .eq('id', eventId)

      if (error) {
        toast.error(`Failed to undo: ${error.message}`)
        return
      }

      setEvents((prev) => prev.filter((e) => e.id !== eventId))

      // Revert score
      const pts = pointsForEventType(event.event_type)
      if (pts > 0) {
        if (event.team_id === game.home_team_id) {
          setHomeScore((s) => s - pts)
        } else {
          setAwayScore((s) => s - pts)
        }

        // Update DB score
        const newHome =
          event.team_id === game.home_team_id ? homeScore - pts : homeScore
        const newAway =
          event.team_id === game.away_team_id ? awayScore - pts : awayScore
        const { error: scoreError } = await supabase
          .from('games')
          .update({ home_score: newHome, away_score: newAway })
          .eq('id', game.id)
        if (scoreError) console.error('[SCORER] Score update failed:', scoreError.message)
      }

      setShowUndoId(null)
      toast.info('Event undone', { duration: 1500 })
    },
    [events, game.home_team_id, game.away_team_id, game.id, homeScore, awayScore, supabase]
  )

  // ------ Stat button handler ------

  const handleStatRecord = useCallback(
    (eventType: EventType, needsShotChart: boolean) => {
      if (!selectedPlayer) return

      if (needsShotChart) {
        // Show shot chart overlay
        setPendingShotEvent(eventType)
      } else {
        // Record immediately (FTs and non-shot stats)
        recordEvent(eventType)
      }
    },
    [selectedPlayer, recordEvent]
  )

  // ------ Shot chart tap handler ------

  const handleShotChartTap = useCallback(
    (courtX: number, courtY: number) => {
      if (!pendingShotEvent) return
      recordEvent(pendingShotEvent, courtX, courtY)
    },
    [pendingShotEvent, recordEvent]
  )

  // ------ Period controls ------

  const handleNextPeriod = useCallback(async () => {
    const nextPeriod = currentPeriod + 1
    setCurrentPeriod(nextPeriod)
    const periodResult = await updateGamePeriod(game.id, nextPeriod)
    if (periodResult?.error) {
      console.error('[SCORER] Period update failed:', periodResult.error)
    }

    if (gameStatus === 'scheduled') {
      setGameStatus('in_progress')
      const statusResult = await updateGameStatus(game.id, 'in_progress')
      if (statusResult?.error) {
        console.error('[SCORER] Status update failed:', statusResult.error)
      }
    }

    toast.success(`Period ${nextPeriod} started`)
  }, [currentPeriod, gameStatus, game.id])

  const handleStartGame = useCallback(async () => {
    setGameStatus('in_progress')
    setCurrentPeriod(1)
    const statusResult = await updateGameStatus(game.id, 'in_progress')
    if (statusResult?.error) {
      console.error('[SCORER] Status update failed:', statusResult.error)
    }
    const periodResult = await updateGamePeriod(game.id, 1)
    if (periodResult?.error) {
      console.error('[SCORER] Period update failed:', periodResult.error)
    }
    toast.success('Game started!')
  }, [game.id])

  const handleEndGame = useCallback(async () => {
    setGameStatus('final')
    const statusResult = await updateGameStatus(game.id, 'final')
    if (statusResult?.error) {
      console.error('[SCORER] Status update failed:', statusResult.error)
    }
    toast.success('Game marked as final')
  }, [game.id])

  // ------ Roster confirm handler ------

  const handleRosterConfirm = useCallback(
    async (_activePlayers: Set<string>) => {
      setGameStatus('in_progress')
      setCurrentPeriod(1)
      const statusResult = await updateGameStatus(game.id, 'in_progress')
      if (statusResult?.error) {
        console.error('[SCORER] Status update failed:', statusResult.error)
      }
      const periodResult = await updateGamePeriod(game.id, 1)
      if (periodResult?.error) {
        console.error('[SCORER] Period update failed:', periodResult.error)
      }
      setShowRosterConfirm(false)
      toast.success('Game started!')
    },
    [game.id]
  )

  // ------ Player select helper ------

  const selectPlayer = useCallback(
    (roster: RosterEntry, teamId: string) => {
      const player = roster.players
      const isSame = selectedPlayer?.id === player.id

      if (isSame) {
        setSelectedPlayer(null)
        return
      }

      setSelectedPlayer({
        id: player.id,
        firstName: player.first_name,
        lastName: player.last_name,
        jerseyNumber: player.jersey_number,
        teamId,
      })
      // Clear any pending shot chart when switching players
      setPendingShotEvent(null)
    },
    [selectedPlayer]
  )

  // ------ Roster rendering ------

  const renderRoster = (roster: RosterEntry[], teamId: string, teamColor: string) => (
    <div className="space-y-1">
      {roster.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No players on roster
        </p>
      ) : (
        roster
          .sort((a, b) => {
            const numA = parseInt(a.players.jersey_number ?? '999', 10)
            const numB = parseInt(b.players.jersey_number ?? '999', 10)
            return numA - numB
          })
          .map((entry) => (
            <PlayerCard
              key={entry.id}
              playerId={entry.players.id}
              firstName={entry.players.first_name}
              lastName={entry.players.last_name}
              jerseyNumber={entry.players.jersey_number}
              points={playerPoints[entry.players.id] ?? 0}
              isSelected={selectedPlayer?.id === entry.players.id}
              teamColor={teamColor}
              onSelect={() => selectPlayer(entry, teamId)}
            />
          ))
      )}
    </div>
  )

  // ------ Render ------

  const isGameActive = gameStatus === 'in_progress'

  // Show roster confirmation for scheduled games
  if (showRosterConfirm && gameStatus === 'scheduled') {
    return (
      <RosterConfirm
        gameId={game.id}
        homeTeam={game.home_team}
        awayTeam={game.away_team}
        homeRoster={homeRoster}
        awayRoster={awayRoster}
        onConfirm={handleRosterConfirm}
      />
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Scoreboard */}
      <Scoreboard
        homeName={game.home_team.name}
        homeAbbr={game.home_team.abbreviation}
        homeColor={game.home_team.color}
        homeScore={homeScore}
        awayName={game.away_team.name}
        awayAbbr={game.away_team.abbreviation}
        awayColor={game.away_team.color}
        awayScore={awayScore}
        currentPeriod={currentPeriod}
        totalPeriods={game.periods}
        status={gameStatus}
      />

      {/* Period controls */}
      <div className="border-b px-3 py-2 flex items-center justify-between max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {game.periods === 4 ? '4 Quarters' : `${game.periods} Periods`}
          </Badge>
          {gameStatus === 'in_progress' && (
            <Badge variant="secondary" className="text-xs">
              Period {currentPeriod}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {gameStatus === 'scheduled' && (
            <>
              <Button size="sm" onClick={handleStartGame}>
                Start Game
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link href={`/score/${game.id}/post-game`}>
                  Post-Game Entry
                </Link>
              </Button>
            </>
          )}
          {isGameActive && currentPeriod < game.periods && (
            <Button size="sm" variant="outline" onClick={handleNextPeriod}>
              Next Period
            </Button>
          )}
          {isGameActive && currentPeriod >= game.periods && (
            <>
              <Button size="sm" variant="outline" onClick={handleNextPeriod}>
                OT
              </Button>
              <Button size="sm" variant="destructive" onClick={handleEndGame}>
                End Game
              </Button>
            </>
          )}
          {gameStatus === 'final' && (
            <Badge variant="default" className="text-xs">
              Game Over
            </Badge>
          )}
        </div>
      </div>

      {/* Rosters -- Tabs on mobile, side-by-side on tablet+ */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto w-full">
          {/* Mobile: Tabbed view */}
          <div className="md:hidden p-2">
            <Tabs defaultValue="home">
              <TabsList className="w-full">
                <TabsTrigger value="home" className="flex-1">
                  <span
                    className="w-2 h-2 rounded-full mr-1 inline-block"
                    style={{ backgroundColor: game.home_team.color }}
                  />
                  {game.home_team.abbreviation}
                </TabsTrigger>
                <TabsTrigger value="away" className="flex-1">
                  <span
                    className="w-2 h-2 rounded-full mr-1 inline-block"
                    style={{ backgroundColor: game.away_team.color }}
                  />
                  {game.away_team.abbreviation}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="home" className="mt-2">
                {renderRoster(homeRoster, game.home_team_id, game.home_team.color)}
              </TabsContent>
              <TabsContent value="away" className="mt-2">
                {renderRoster(awayRoster, game.away_team_id, game.away_team.color)}
              </TabsContent>
            </Tabs>
          </div>

          {/* Tablet+: Side by side */}
          <div className="hidden md:grid md:grid-cols-2 gap-2 p-2">
            <div>
              <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: game.home_team.color }}
                />
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {game.home_team.name} (Home)
                </span>
              </div>
              {renderRoster(homeRoster, game.home_team_id, game.home_team.color)}
            </div>
            <div>
              <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: game.away_team.color }}
                />
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {game.away_team.name} (Away)
                </span>
              </div>
              {renderRoster(awayRoster, game.away_team_id, game.away_team.color)}
            </div>
          </div>
        </div>
      </div>

      {/* Shot chart overlay */}
      {pendingShotEvent && selectedPlayer && (
        <ShotChart
          onLocationSelect={handleShotChartTap}
          onCancel={() => setPendingShotEvent(null)}
          eventType={pendingShotEvent}
          playerName={`#${selectedPlayer.jerseyNumber ?? '--'} ${selectedPlayer.firstName} ${selectedPlayer.lastName}`}
        />
      )}

      {/* Stat buttons - fixed at bottom when game active */}
      {gameStatus !== 'final' && (
        <StatButtons
          selectedPlayerName={
            selectedPlayer
              ? `#${selectedPlayer.jerseyNumber ?? '--'} ${selectedPlayer.firstName} ${selectedPlayer.lastName}`
              : null
          }
          disabled={!selectedPlayer || !isGameActive || isRecording}
          onStatRecord={handleStatRecord}
        />
      )}

      {/* Play-by-play feed */}
      {events.length > 0 && (
        <div className="border-t bg-muted/30">
          <div className="max-w-2xl mx-auto w-full">
            <div className="px-3 py-2 border-b">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Play-by-Play
              </span>
            </div>
            <div className="max-h-48 overflow-y-auto divide-y">
              {events.slice(0, 30).map((event) => {
                const pts = pointsForEventType(event.event_type)
                const isHome = event.team_id === game.home_team_id
                const teamColor = isHome
                  ? game.home_team.color
                  : game.away_team.color
                const teamAbbr = isHome
                  ? game.home_team.abbreviation
                  : game.away_team.abbreviation

                return (
                  <div
                    key={event.id}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm"
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: teamColor }}
                    />
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      Q{event.period}
                    </Badge>
                    <span className="text-muted-foreground text-xs shrink-0">
                      {teamAbbr}
                    </span>
                    <span className="truncate flex-1">
                      <span className="font-medium">
                        #{event.players.jersey_number ?? '--'}{' '}
                        {event.players.last_name}
                      </span>{' '}
                      <span
                        className={cn(
                          'text-xs',
                          pts > 0
                            ? 'text-green-600 dark:text-green-400 font-semibold'
                            : event.event_type.includes('MISS')
                              ? 'text-red-500 dark:text-red-400'
                              : 'text-muted-foreground'
                        )}
                      >
                        {eventTypeLabel(event.event_type)}
                      </span>
                    </span>
                    {showUndoId === event.id && (
                      <button
                        type="button"
                        onClick={() => undoEvent(event.id)}
                        className="text-xs text-destructive hover:underline shrink-0 font-medium touch-manipulation min-h-[32px] px-2"
                      >
                        Undo
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
