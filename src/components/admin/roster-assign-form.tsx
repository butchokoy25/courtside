'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  assignPlayerToTeam,
  removePlayerFromTeam,
} from '@/lib/actions/players'
import { Loader2, UserPlus, X } from 'lucide-react'

type Team = {
  id: string
  name: string
  color: string
}

type Season = {
  id: string
  name: string
}

type RosterAssignment = {
  id: string
  team_id: string
  season_id: string
  is_active: boolean
  teams: {
    id: string
    name: string
    color: string
  }
  seasons: {
    id: string
    name: string
  }
}

// ---------- Assign to Team Dialog ----------

export function RosterAssignDialog({
  playerId,
  playerName,
  teams,
  seasons,
  children,
}: {
  playerId: string
  playerName: string
  teams: Team[]
  seasons: Season[]
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [teamId, setTeamId] = useState('')
  const [seasonId, setSeasonId] = useState('')

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      setTeamId('')
      setSeasonId('')
      setError(null)
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData()
    formData.set('player_id', playerId)
    formData.set('team_id', teamId)
    formData.set('season_id', seasonId)

    startTransition(async () => {
      const result = await assignPlayerToTeam(formData)
      if (result.error) {
        setError(result.error)
      } else {
        setOpen(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign to Team</DialogTitle>
          <DialogDescription>
            Assign <strong>{playerName}</strong> to a team for a specific
            season.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          {/* Team */}
          <div className="grid gap-2">
            <Label>Team</Label>
            <Select value={teamId} onValueChange={setTeamId} required>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block size-3 rounded-full"
                        style={{ backgroundColor: team.color }}
                      />
                      {team.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Season */}
          <div className="grid gap-2">
            <Label>Season</Label>
            <Select value={seasonId} onValueChange={setSeasonId} required>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a season" />
              </SelectTrigger>
              <SelectContent>
                {seasons.map((season) => (
                  <SelectItem key={season.id} value={season.id}>
                    {season.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={isPending || !teamId || !seasonId}>
              {isPending && <Loader2 className="animate-spin" />}
              Assign to Team
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ---------- Assign Button ----------

export function AssignToTeamButton({
  playerId,
  playerName,
  teams,
  seasons,
}: {
  playerId: string
  playerName: string
  teams: Team[]
  seasons: Season[]
}) {
  return (
    <RosterAssignDialog
      playerId={playerId}
      playerName={playerName}
      teams={teams}
      seasons={seasons}
    >
      <Button variant="ghost" size="icon-sm">
        <UserPlus className="size-4" />
        <span className="sr-only">Assign to Team</span>
      </Button>
    </RosterAssignDialog>
  )
}

// ---------- Roster Badges (with remove) ----------

export function RosterBadges({
  assignments,
}: {
  assignments: RosterAssignment[]
}) {
  if (assignments.length === 0) {
    return (
      <span className="text-xs text-muted-foreground italic">No team</span>
    )
  }

  return (
    <div className="flex flex-wrap gap-1">
      {assignments.map((roster) => (
        <RosterBadge key={roster.id} roster={roster} />
      ))}
    </div>
  )
}

function RosterBadge({ roster }: { roster: RosterAssignment }) {
  const [isPending, startTransition] = useTransition()

  function handleRemove() {
    startTransition(async () => {
      await removePlayerFromTeam(roster.id)
    })
  }

  return (
    <Badge
      variant="outline"
      className="gap-1 pr-1"
      style={{
        borderColor: roster.teams.color,
        color: roster.teams.color,
      }}
    >
      <span
        className="inline-block size-2 rounded-full"
        style={{ backgroundColor: roster.teams.color }}
      />
      <span className="max-w-[100px] truncate">{roster.teams.name}</span>
      <span className="text-muted-foreground">
        ({roster.seasons.name})
      </span>
      <button
        type="button"
        onClick={handleRemove}
        disabled={isPending}
        className="ml-0.5 rounded-full p-0.5 hover:bg-muted transition-colors disabled:opacity-50"
        title={`Remove from ${roster.teams.name}`}
      >
        {isPending ? (
          <Loader2 className="size-3 animate-spin" />
        ) : (
          <X className="size-3" />
        )}
      </button>
    </Badge>
  )
}
