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
import {
  createPlayer,
  updatePlayer,
  deletePlayer,
} from '@/lib/actions/players'
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'

type Player = {
  id: string
  first_name: string
  last_name: string
  jersey_number: string | null
  position: string | null
}

const POSITIONS = [
  { value: 'PG', label: 'Point Guard (PG)' },
  { value: 'SG', label: 'Shooting Guard (SG)' },
  { value: 'SF', label: 'Small Forward (SF)' },
  { value: 'PF', label: 'Power Forward (PF)' },
  { value: 'C', label: 'Center (C)' },
] as const

// ---------- Create / Edit Dialog ----------

export function PlayerFormDialog({
  player,
  children,
}: {
  player?: Player
  children: React.ReactNode
}) {
  const isEditing = !!player
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [firstName, setFirstName] = useState(player?.first_name ?? '')
  const [lastName, setLastName] = useState(player?.last_name ?? '')
  const [jerseyNumber, setJerseyNumber] = useState(player?.jersey_number ?? '')
  const [position, setPosition] = useState(player?.position ?? '')

  function resetForm() {
    if (!isEditing) {
      setFirstName('')
      setLastName('')
      setJerseyNumber('')
      setPosition('')
    }
    setError(null)
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      setFirstName(player?.first_name ?? '')
      setLastName(player?.last_name ?? '')
      setJerseyNumber(player?.jersey_number ?? '')
      setPosition(player?.position ?? '')
      setError(null)
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData()
    formData.set('first_name', firstName)
    formData.set('last_name', lastName)
    formData.set('jersey_number', jerseyNumber)
    formData.set('position', position)

    startTransition(async () => {
      const result = isEditing
        ? await updatePlayer(player.id, formData)
        : await createPlayer(formData)

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
          <DialogTitle>
            {isEditing ? 'Edit Player' : 'Add Player'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update player details below.'
              : 'Fill in the details to add a new player.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          {/* First Name */}
          <div className="grid gap-2">
            <Label htmlFor="player-first-name">First Name</Label>
            <Input
              id="player-first-name"
              placeholder="e.g. LeBron"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>

          {/* Last Name */}
          <div className="grid gap-2">
            <Label htmlFor="player-last-name">Last Name</Label>
            <Input
              id="player-last-name"
              placeholder="e.g. James"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>

          {/* Jersey Number */}
          <div className="grid gap-2">
            <Label htmlFor="player-jersey">Jersey Number</Label>
            <Input
              id="player-jersey"
              placeholder="e.g. 23"
              value={jerseyNumber}
              onChange={(e) => setJerseyNumber(e.target.value)}
              maxLength={3}
            />
            <p className="text-xs text-muted-foreground">Optional</p>
          </div>

          {/* Position */}
          <div className="grid gap-2">
            <Label>Position</Label>
            <Select value={position} onValueChange={setPosition}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select position (optional)" />
              </SelectTrigger>
              <SelectContent>
                {POSITIONS.map((pos) => (
                  <SelectItem key={pos.value} value={pos.value}>
                    {pos.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Optional</p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {isEditing ? 'Save Changes' : 'Add Player'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ---------- Delete Confirmation Dialog ----------

export function DeletePlayerDialog({
  player,
  children,
}: {
  player: Player
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleDelete() {
    startTransition(async () => {
      const result = await deletePlayer(player.id)
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
          <DialogTitle>Delete Player</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete{' '}
            <strong>
              {player.first_name} {player.last_name}
            </strong>
            ? This will also remove all their roster assignments. This action
            cannot be undone.
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

export function AddPlayerButton() {
  return (
    <PlayerFormDialog>
      <Button>
        <Plus />
        Add Player
      </Button>
    </PlayerFormDialog>
  )
}

export function EditPlayerButton({ player }: { player: Player }) {
  return (
    <PlayerFormDialog player={player}>
      <Button variant="ghost" size="icon-sm">
        <Pencil className="size-4" />
        <span className="sr-only">Edit</span>
      </Button>
    </PlayerFormDialog>
  )
}

export function DeletePlayerButton({ player }: { player: Player }) {
  return (
    <DeletePlayerDialog player={player}>
      <Button variant="ghost" size="icon-sm">
        <Trash2 className="size-4 text-destructive" />
        <span className="sr-only">Delete</span>
      </Button>
    </DeletePlayerDialog>
  )
}
