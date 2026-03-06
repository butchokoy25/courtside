'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Player {
  id: string
  first_name: string
  last_name: string
  jersey_number: string | null
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

interface RosterConfirmProps {
  gameId: string
  homeTeam: Team
  awayTeam: Team
  homeRoster: RosterEntry[]
  awayRoster: RosterEntry[]
  onConfirm: (activePlayers: Set<string>) => void | Promise<void>
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RosterConfirm({
  gameId,
  homeTeam,
  awayTeam,
  homeRoster,
  awayRoster,
  onConfirm,
}: RosterConfirmProps) {
  // Initialize with all players checked
  const [activePlayers, setActivePlayers] = useState<Set<string>>(() => {
    const all = new Set<string>()
    homeRoster.forEach((r) => all.add(r.players.id))
    awayRoster.forEach((r) => all.add(r.players.id))
    return all
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const togglePlayer = useCallback((playerId: string) => {
    setActivePlayers((prev) => {
      const next = new Set(prev)
      if (next.has(playerId)) {
        next.delete(playerId)
      } else {
        next.add(playerId)
      }
      return next
    })
  }, [])

  const handleStart = useCallback(async () => {
    setIsSubmitting(true)
    try {
      await onConfirm(activePlayers)
    } finally {
      setIsSubmitting(false)
    }
  }, [activePlayers, onConfirm])

  const renderTeamRoster = (
    team: Team,
    roster: RosterEntry[],
    label: string
  ) => {
    const sorted = [...roster].sort((a, b) => {
      const numA = parseInt(a.players.jersey_number ?? '999', 10)
      const numB = parseInt(b.players.jersey_number ?? '999', 10)
      return numA - numB
    })

    const checkedCount = sorted.filter((r) =>
      activePlayers.has(r.players.id)
    ).length

    return (
      <Card className="py-0 gap-0 overflow-hidden">
        <CardHeader className="py-3 px-4 border-b bg-muted/30">
          <CardTitle className="text-sm flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: team.color }}
            />
            <span className="uppercase tracking-wide">
              {label}: {team.name}
            </span>
            <span className="ml-auto text-xs font-normal text-muted-foreground">
              {checkedCount}/{sorted.length}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {sorted.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No players on roster
            </p>
          ) : (
            <div className="divide-y">
              {sorted.map((entry) => {
                const player = entry.players
                const isChecked = activePlayers.has(player.id)

                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => togglePlayer(player.id)}
                    className={cn(
                      'flex items-center gap-3 w-full px-4 py-3 text-left transition-colors touch-manipulation',
                      isChecked
                        ? 'bg-background hover:bg-muted/50'
                        : 'bg-muted/20 opacity-50 hover:opacity-70'
                    )}
                  >
                    {/* Checkbox */}
                    <div
                      className={cn(
                        'flex items-center justify-center size-5 rounded border-2 shrink-0 transition-colors',
                        isChecked
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground/40 bg-background'
                      )}
                    >
                      {isChecked && <Check className="size-3" />}
                    </div>

                    {/* Jersey number */}
                    <span
                      className={cn(
                        'text-sm font-bold w-8 text-center shrink-0',
                        !isChecked && 'text-muted-foreground'
                      )}
                    >
                      {player.jersey_number ?? '--'}
                    </span>

                    {/* Name */}
                    <span
                      className={cn(
                        'text-sm truncate',
                        isChecked ? 'font-medium' : 'text-muted-foreground'
                      )}
                    >
                      {player.first_name} {player.last_name}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const totalActive = activePlayers.size

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="border-b px-4 py-4 text-center">
        <h1 className="text-lg font-bold">Confirm Rosters</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Uncheck players who are not playing today
        </p>
      </div>

      {/* Roster lists */}
      <div className="flex-1 overflow-auto p-4 space-y-4 max-w-2xl mx-auto w-full">
        {renderTeamRoster(homeTeam, homeRoster, 'Home')}
        {renderTeamRoster(awayTeam, awayRoster, 'Away')}
      </div>

      {/* Start Game button */}
      <div className="border-t p-4 bg-background">
        <div className="max-w-2xl mx-auto">
          <Button
            size="lg"
            className="w-full"
            disabled={totalActive === 0 || isSubmitting}
            onClick={handleStart}
          >
            {isSubmitting && <Loader2 className="animate-spin" />}
            Start Game ({totalActive} players)
          </Button>
        </div>
      </div>
    </div>
  )
}
