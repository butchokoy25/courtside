'use client'

import { useState, useTransition, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { createGame, updateGame, deleteGame } from '@/lib/actions/games'
import { Loader2, Pencil, Plus, Trash2, Play, ClipboardList } from 'lucide-react'

type Season = {
  id: string
  name: string
  league_id: string
  leagues: { name: string } | null
}

type Team = {
  id: string
  name: string
  abbreviation: string
  color: string
  league_id: string
}

type Game = {
  id: string
  season_id: string
  home_team_id: string
  away_team_id: string
  scheduled_at: string
  venue: string | null
  status: 'scheduled' | 'in_progress' | 'final'
}

// Helper: convert UTC ISO string to local datetime-local value
function toLocalDatetimeValue(isoString: string): string {
  const date = new Date(isoString)
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60 * 1000)
  return local.toISOString().slice(0, 16)
}

// ---------- Create / Edit Dialog ----------

export function GameFormDialog({
  seasons,
  teams,
  game,
  children,
}: {
  seasons: Season[]
  teams: Team[]
  game?: Game
  children: React.ReactNode
}) {
  const isEditing = !!game
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [seasonId, setSeasonId] = useState(game?.season_id ?? '')
  const [homeTeamId, setHomeTeamId] = useState(game?.home_team_id ?? '')
  const [awayTeamId, setAwayTeamId] = useState(game?.away_team_id ?? '')
  const [scheduledAt, setScheduledAt] = useState(
    game?.scheduled_at ? toLocalDatetimeValue(game.scheduled_at) : ''
  )
  const [venue, setVenue] = useState(game?.venue ?? '')

  // Determine the league for the selected season
  const selectedSeason = seasons.find((s) => s.id === seasonId)
  const selectedLeagueId = selectedSeason?.league_id ?? ''

  // Filter teams to only those in the same league as the selected season
  const leagueTeams = useMemo(
    () => teams.filter((t) => t.league_id === selectedLeagueId),
    [teams, selectedLeagueId]
  )

  // Away teams exclude the selected home team
  const awayTeamOptions = useMemo(
    () => leagueTeams.filter((t) => t.id !== homeTeamId),
    [leagueTeams, homeTeamId]
  )

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      // Reset to original values on open
      setSeasonId(game?.season_id ?? '')
      setHomeTeamId(game?.home_team_id ?? '')
      setAwayTeamId(game?.away_team_id ?? '')
      setScheduledAt(
        game?.scheduled_at ? toLocalDatetimeValue(game.scheduled_at) : ''
      )
      setVenue(game?.venue ?? '')
      setError(null)
    }
  }

  // When season changes, reset team selections if they are no longer valid
  function handleSeasonChange(value: string) {
    setSeasonId(value)
    const newSeason = seasons.find((s) => s.id === value)
    const newLeagueId = newSeason?.league_id ?? ''
    const homeStillValid = teams.some(
      (t) => t.id === homeTeamId && t.league_id === newLeagueId
    )
    const awayStillValid = teams.some(
      (t) => t.id === awayTeamId && t.league_id === newLeagueId
    )
    if (!homeStillValid) setHomeTeamId('')
    if (!awayStillValid) setAwayTeamId('')
  }

  function handleHomeTeamChange(value: string) {
    setHomeTeamId(value)
    // If away team is the same, clear it
    if (value === awayTeamId) setAwayTeamId('')
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData()
    formData.set('season_id', seasonId)
    formData.set('home_team_id', homeTeamId)
    formData.set('away_team_id', awayTeamId)
    // Convert local datetime to ISO string for Supabase TIMESTAMPTZ
    formData.set('scheduled_at', new Date(scheduledAt).toISOString())
    formData.set('venue', venue)

    startTransition(async () => {
      const result = isEditing
        ? await updateGame(game.id, formData)
        : await createGame(formData)

      if (result.error) {
        setError(result.error)
      } else {
        setOpen(false)
      }
    })
  }

  const canSubmit =
    seasonId && homeTeamId && awayTeamId && scheduledAt && !isPending

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Game' : 'Add Game'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update game details below.'
              : 'Fill in the details to schedule a new game.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          {/* Season */}
          <div className="grid gap-2">
            <Label>Season</Label>
            <Select value={seasonId} onValueChange={handleSeasonChange} required>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a season" />
              </SelectTrigger>
              <SelectContent>
                {seasons.map((season) => (
                  <SelectItem key={season.id} value={season.id}>
                    {season.leagues?.name ? `${season.leagues.name} - ` : ''}
                    {season.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Home Team */}
          <div className="grid gap-2">
            <Label>Home Team</Label>
            <Select
              value={homeTeamId}
              onValueChange={handleHomeTeamChange}
              disabled={!seasonId}
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    seasonId ? 'Select home team' : 'Select a season first'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {leagueTeams.map((team) => (
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

          {/* Away Team */}
          <div className="grid gap-2">
            <Label>Away Team</Label>
            <Select
              value={awayTeamId}
              onValueChange={setAwayTeamId}
              disabled={!seasonId || !homeTeamId}
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    !seasonId
                      ? 'Select a season first'
                      : !homeTeamId
                        ? 'Select home team first'
                        : 'Select away team'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {awayTeamOptions.map((team) => (
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

          {/* Date & Time */}
          <div className="grid gap-2">
            <Label htmlFor="game-datetime">Date & Time</Label>
            <Input
              id="game-datetime"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
            />
          </div>

          {/* Venue */}
          <div className="grid gap-2">
            <Label htmlFor="game-venue">Venue</Label>
            <Input
              id="game-venue"
              placeholder="e.g. Downtown Rec Center"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Optional</p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={!canSubmit}>
              {isPending && <Loader2 className="animate-spin" />}
              {isEditing ? 'Save Changes' : 'Create Game'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ---------- Delete Confirmation Dialog ----------

export function DeleteGameDialog({
  game,
  homeTeamName,
  awayTeamName,
  children,
}: {
  game: Game
  homeTeamName: string
  awayTeamName: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteGame(game.id)
      if (result.error) {
        setError(result.error)
      } else {
        setOpen(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Game</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete{' '}
            <strong>
              {homeTeamName} vs {awayTeamName}
            </strong>
            ? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending && <Loader2 className="animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------- Trigger Buttons ----------

export function AddGameButton({
  seasons,
  teams,
}: {
  seasons: Season[]
  teams: Team[]
}) {
  return (
    <GameFormDialog seasons={seasons} teams={teams}>
      <Button>
        <Plus />
        Add Game
      </Button>
    </GameFormDialog>
  )
}

export function EditGameButton({
  game,
  seasons,
  teams,
}: {
  game: Game
  seasons: Season[]
  teams: Team[]
}) {
  return (
    <GameFormDialog game={game} seasons={seasons} teams={teams}>
      <Button variant="ghost" size="icon-sm">
        <Pencil className="size-4" />
        <span className="sr-only">Edit</span>
      </Button>
    </GameFormDialog>
  )
}

export function DeleteGameButton({
  game,
  homeTeamName,
  awayTeamName,
}: {
  game: Game
  homeTeamName: string
  awayTeamName: string
}) {
  return (
    <DeleteGameDialog
      game={game}
      homeTeamName={homeTeamName}
      awayTeamName={awayTeamName}
    >
      <Button variant="ghost" size="icon-sm">
        <Trash2 className="size-4 text-destructive" />
        <span className="sr-only">Delete</span>
      </Button>
    </DeleteGameDialog>
  )
}

export function ScoreGameButton({ gameId }: { gameId: string }) {
  return (
    <Button variant="outline" size="xs" asChild>
      <Link href={`/score/${gameId}`}>
        <Play className="size-3" />
        Live
      </Link>
    </Button>
  )
}

export function PostGameButton({ gameId }: { gameId: string }) {
  return (
    <Button variant="outline" size="xs" asChild>
      <Link href={`/score/${gameId}/post-game`}>
        <ClipboardList className="size-3" />
        Box Score
      </Link>
    </Button>
  )
}
