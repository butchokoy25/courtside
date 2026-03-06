'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { createLeague, updateLeague } from '@/lib/actions/leagues'
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
import type { Database } from '@/lib/supabase/database.types'

type League = Database['public']['Tables']['leagues']['Row']

interface LeagueFormProps {
  league?: League
  trigger: React.ReactNode
}

export function LeagueForm({ league, trigger }: LeagueFormProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(league?.name ?? '')
  const [slug, setSlug] = useState(league?.slug ?? '')
  const [description, setDescription] = useState(league?.description ?? '')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)

  const isEditing = !!league

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setName(league?.name ?? '')
      setSlug(league?.slug ?? '')
      setDescription(league?.description ?? '')
      setSlugManuallyEdited(false)
    }
  }, [open, league])

  // Auto-generate slug from name
  function generateSlug(value: string) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  function handleNameChange(value: string) {
    setName(value)
    if (!slugManuallyEdited) {
      setSlug(generateSlug(value))
    }
  }

  function handleSlugChange(value: string) {
    setSlugManuallyEdited(true)
    setSlug(generateSlug(value))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData()
    formData.set('name', name)
    formData.set('slug', slug)
    formData.set('description', description)

    try {
      const result = isEditing
        ? await updateLeague(league.id, formData)
        : await createLeague(formData)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(isEditing ? 'League updated' : 'League created')
        setOpen(false)
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit League' : 'Create League'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the league details below.'
              : 'Fill in the details to create a new league.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="league-name">Name</Label>
            <Input
              id="league-name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Sunday Rec League"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="league-slug">Slug</Label>
            <Input
              id="league-slug"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="e.g. sunday-rec-league"
              required
            />
            <p className="text-xs text-muted-foreground">
              Used in URLs. Auto-generated from name.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="league-description">Description</Label>
            <Input
              id="league-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? isEditing
                  ? 'Saving...'
                  : 'Creating...'
                : isEditing
                  ? 'Save Changes'
                  : 'Create League'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
