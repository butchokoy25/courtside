'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { createSeason, updateSeason } from '@/lib/actions/leagues'
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

type Season = Database['public']['Tables']['seasons']['Row']

interface SeasonFormProps {
  leagueId: string
  season?: Season
  trigger: React.ReactNode
}

export function SeasonForm({ leagueId, season, trigger }: SeasonFormProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(season?.name ?? '')
  const [startDate, setStartDate] = useState(season?.start_date ?? '')
  const [endDate, setEndDate] = useState(season?.end_date ?? '')
  const [isActive, setIsActive] = useState(season?.is_active ?? false)

  const isEditing = !!season

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setName(season?.name ?? '')
      setStartDate(season?.start_date ?? '')
      setEndDate(season?.end_date ?? '')
      setIsActive(season?.is_active ?? false)
    }
  }, [open, season])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData()
    formData.set('league_id', leagueId)
    formData.set('name', name)
    formData.set('start_date', startDate)
    formData.set('end_date', endDate)
    if (isActive) formData.set('is_active', 'on')

    try {
      const result = isEditing
        ? await updateSeason(season.id, formData)
        : await createSeason(formData)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(isEditing ? 'Season updated' : 'Season created')
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
          <DialogTitle>{isEditing ? 'Edit Season' : 'Add Season'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the season details below.'
              : 'Fill in the details to add a new season.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="season-name">Name</Label>
            <Input
              id="season-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Spring 2026"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="season-start">Start Date</Label>
              <Input
                id="season-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="season-end">End Date</Label>
              <Input
                id="season-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="season-active"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="size-4 rounded border-input accent-primary"
            />
            <Label htmlFor="season-active">Active season</Label>
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
                  : 'Add Season'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
