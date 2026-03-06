'use client'

import { useState, useTransition } from 'react'
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
import { createTeam, updateTeam, deleteTeam } from '@/lib/actions/teams'
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'

type League = {
  id: string
  name: string
}

type Team = {
  id: string
  name: string
  abbreviation: string
  color: string
  league_id: string
}

// ---------- Create / Edit Dialog ----------

export function TeamFormDialog({
  leagues,
  team,
  children,
}: {
  leagues: League[]
  team?: Team
  children: React.ReactNode
}) {
  const isEditing = !!team
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState(team?.name ?? '')
  const [abbreviation, setAbbreviation] = useState(team?.abbreviation ?? '')
  const [color, setColor] = useState(team?.color ?? '#3B82F6')
  const [leagueId, setLeagueId] = useState(team?.league_id ?? '')

  function resetForm() {
    if (!isEditing) {
      setName('')
      setAbbreviation('')
      setColor('#3B82F6')
      setLeagueId('')
    }
    setError(null)
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      // Reset to original values on open
      setName(team?.name ?? '')
      setAbbreviation(team?.abbreviation ?? '')
      setColor(team?.color ?? '#3B82F6')
      setLeagueId(team?.league_id ?? '')
      setError(null)
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData()
    formData.set('name', name)
    formData.set('abbreviation', abbreviation.toUpperCase())
    formData.set('color', color)
    formData.set('league_id', leagueId)

    startTransition(async () => {
      const result = isEditing
        ? await updateTeam(team.id, formData)
        : await createTeam(formData)

      if (result.error) {
        setError(result.error)
      } else {
        setOpen(false)
        resetForm()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Team' : 'Add Team'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update team details below.'
              : 'Fill in the details to create a new team.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          {/* Team Name */}
          <div className="grid gap-2">
            <Label htmlFor="team-name">Team Name</Label>
            <Input
              id="team-name"
              placeholder="e.g. Warriors"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Abbreviation */}
          <div className="grid gap-2">
            <Label htmlFor="team-abbr">Abbreviation</Label>
            <Input
              id="team-abbr"
              placeholder="e.g. WAR"
              maxLength={4}
              value={abbreviation}
              onChange={(e) => setAbbreviation(e.target.value.toUpperCase())}
              className="uppercase"
              required
            />
            <p className="text-xs text-muted-foreground">Max 4 characters</p>
          </div>

          {/* Color */}
          <div className="grid gap-2">
            <Label htmlFor="team-color">Team Color</Label>
            <div className="flex items-center gap-3">
              <input
                id="team-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-9 w-14 cursor-pointer rounded-md border border-input p-1"
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#3B82F6"
                className="flex-1 font-mono"
                maxLength={7}
              />
            </div>
          </div>

          {/* League */}
          <div className="grid gap-2">
            <Label>League</Label>
            <Select value={leagueId} onValueChange={setLeagueId} required>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a league" />
              </SelectTrigger>
              <SelectContent>
                {leagues.map((league) => (
                  <SelectItem key={league.id} value={league.id}>
                    {league.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isPending || !leagueId}>
              {isPending && <Loader2 className="animate-spin" />}
              {isEditing ? 'Save Changes' : 'Create Team'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ---------- Delete Confirmation Dialog ----------

export function DeleteTeamDialog({
  team,
  children,
}: {
  team: Team
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteTeam(team.id)
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
          <DialogTitle>Delete Team</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete{' '}
            <strong>{team.name}</strong>? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

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

// ---------- Trigger Buttons (used on team cards) ----------

export function AddTeamButton({ leagues }: { leagues: League[] }) {
  return (
    <TeamFormDialog leagues={leagues}>
      <Button>
        <Plus />
        Add Team
      </Button>
    </TeamFormDialog>
  )
}

export function EditTeamButton({
  team,
  leagues,
}: {
  team: Team
  leagues: League[]
}) {
  return (
    <TeamFormDialog team={team} leagues={leagues}>
      <Button variant="ghost" size="icon-sm">
        <Pencil className="size-4" />
        <span className="sr-only">Edit</span>
      </Button>
    </TeamFormDialog>
  )
}

export function DeleteTeamButton({ team }: { team: Team }) {
  return (
    <DeleteTeamDialog team={team}>
      <Button variant="ghost" size="icon-sm">
        <Trash2 className="size-4 text-destructive" />
        <span className="sr-only">Delete</span>
      </Button>
    </DeleteTeamDialog>
  )
}
