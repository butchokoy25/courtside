'use client'

import { cn } from '@/lib/utils'

interface PlayerCardProps {
  playerId: string
  firstName: string
  lastName: string
  jerseyNumber: string | null
  points: number
  isSelected: boolean
  teamColor: string
  onSelect: () => void
}

export function PlayerCard({
  firstName,
  lastName,
  jerseyNumber,
  points,
  isSelected,
  teamColor,
  onSelect,
}: PlayerCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all text-left',
        'min-h-[44px] touch-manipulation',
        'active:scale-[0.97]',
        isSelected
          ? 'ring-2 ring-offset-1 bg-accent shadow-sm'
          : 'hover:bg-accent/50 border-transparent'
      )}
      style={
        isSelected
          ? ({
              borderColor: teamColor,
              '--tw-ring-color': teamColor,
            } as React.CSSProperties)
          : undefined
      }
    >
      {/* Jersey number */}
      <span
        className={cn(
          'text-sm font-bold w-8 h-8 flex items-center justify-center rounded-md shrink-0',
          isSelected ? 'text-white' : 'text-white/90'
        )}
        style={{ backgroundColor: teamColor }}
      >
        {jerseyNumber ?? '--'}
      </span>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {firstName} {lastName}
        </p>
      </div>

      {/* Points in this game */}
      {points > 0 && (
        <span className="text-xs font-semibold bg-muted rounded-full px-2 py-0.5 tabular-nums shrink-0">
          {points}pts
        </span>
      )}
    </button>
  )
}
