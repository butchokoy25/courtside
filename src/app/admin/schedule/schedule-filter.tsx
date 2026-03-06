'use client'

import { useRouter, usePathname } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

export function ScheduleSeasonFilter({
  seasons,
  currentSeason,
}: {
  seasons: { id: string; label: string }[]
  currentSeason: string
}) {
  const router = useRouter()
  const pathname = usePathname()

  function handleChange(value: string) {
    const params = new URLSearchParams()
    params.set('season', value)
    router.push(`${pathname}?${params.toString()}`)
  }

  function handleClear() {
    router.push(pathname)
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">
        Filter by season:
      </span>
      <Select value={currentSeason} onValueChange={handleChange}>
        <SelectTrigger className="w-[240px]">
          <SelectValue placeholder="All seasons" />
        </SelectTrigger>
        <SelectContent>
          {seasons.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {currentSeason && (
        <Button variant="ghost" size="icon-sm" onClick={handleClear}>
          <X className="size-4" />
          <span className="sr-only">Clear filter</span>
        </Button>
      )}
    </div>
  )
}
