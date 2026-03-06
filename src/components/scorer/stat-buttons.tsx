'use client'

import { cn } from '@/lib/utils'

type EventType =
  | '2PT_MADE'
  | '2PT_MISS'
  | '3PT_MADE'
  | '3PT_MISS'
  | 'FT_MADE'
  | 'FT_MISS'
  | 'REB'
  | 'AST'
  | 'STL'
  | 'BLK'
  | 'TO'
  | 'FOUL_PERSONAL'
  | 'FOUL_TECH'

interface StatButtonConfig {
  label: string
  eventType: EventType
  category: 'scoring' | 'miss' | 'other'
}

const STAT_BUTTONS: StatButtonConfig[] = [
  { label: '+2', eventType: '2PT_MADE', category: 'scoring' },
  { label: '+3', eventType: '3PT_MADE', category: 'scoring' },
  { label: 'FT', eventType: 'FT_MADE', category: 'scoring' },
  { label: 'Miss 2', eventType: '2PT_MISS', category: 'miss' },
  { label: 'Miss 3', eventType: '3PT_MISS', category: 'miss' },
  { label: 'Miss FT', eventType: 'FT_MISS', category: 'miss' },
  { label: 'REB', eventType: 'REB', category: 'other' },
  { label: 'AST', eventType: 'AST', category: 'other' },
  { label: 'STL', eventType: 'STL', category: 'other' },
  { label: 'BLK', eventType: 'BLK', category: 'other' },
  { label: 'TO', eventType: 'TO', category: 'other' },
  { label: 'FOUL', eventType: 'FOUL_PERSONAL', category: 'other' },
  { label: 'TECH', eventType: 'FOUL_TECH', category: 'other' },
]

// Shot events that need court location
const SHOT_EVENTS: EventType[] = [
  '2PT_MADE',
  '2PT_MISS',
  '3PT_MADE',
  '3PT_MISS',
]

interface StatButtonsProps {
  selectedPlayerName: string | null
  disabled: boolean
  onStatRecord: (eventType: EventType, needsShotChart: boolean) => void
}

export function StatButtons({
  selectedPlayerName,
  disabled,
  onStatRecord,
}: StatButtonsProps) {
  return (
    <div className="border-t bg-background">
      {/* Selected player indicator */}
      <div className="px-3 py-2 border-b bg-muted/50">
        {selectedPlayerName ? (
          <p className="text-sm font-medium text-center">
            Recording for:{' '}
            <span className="font-bold">{selectedPlayerName}</span>
          </p>
        ) : (
          <p className="text-sm text-muted-foreground text-center">
            Select a player to record stats
          </p>
        )}
      </div>

      <div className="p-2 space-y-2 max-w-2xl mx-auto">
        {/* Scoring buttons */}
        <div className="grid grid-cols-3 gap-1.5">
          {STAT_BUTTONS.filter((b) => b.category === 'scoring').map((btn) => (
            <button
              key={btn.eventType}
              type="button"
              disabled={disabled}
              onClick={() =>
                onStatRecord(
                  btn.eventType,
                  SHOT_EVENTS.includes(btn.eventType)
                )
              }
              className={cn(
                'min-h-[48px] rounded-lg font-bold text-base transition-all touch-manipulation',
                'active:scale-[0.95]',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                'bg-green-600 hover:bg-green-700 text-white',
                'dark:bg-green-700 dark:hover:bg-green-600'
              )}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Miss buttons */}
        <div className="grid grid-cols-3 gap-1.5">
          {STAT_BUTTONS.filter((b) => b.category === 'miss').map((btn) => (
            <button
              key={btn.eventType}
              type="button"
              disabled={disabled}
              onClick={() =>
                onStatRecord(
                  btn.eventType,
                  SHOT_EVENTS.includes(btn.eventType)
                )
              }
              className={cn(
                'min-h-[48px] rounded-lg font-bold text-sm transition-all touch-manipulation',
                'active:scale-[0.95]',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                'bg-red-600 hover:bg-red-700 text-white',
                'dark:bg-red-700 dark:hover:bg-red-600'
              )}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Other stat buttons */}
        <div className="grid grid-cols-4 gap-1.5">
          {STAT_BUTTONS.filter((b) => b.category === 'other').map((btn) => (
            <button
              key={btn.eventType}
              type="button"
              disabled={disabled}
              onClick={() => onStatRecord(btn.eventType, false)}
              className={cn(
                'min-h-[44px] rounded-lg font-semibold text-sm transition-all touch-manipulation',
                'active:scale-[0.95]',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                'bg-secondary hover:bg-secondary/80 text-secondary-foreground',
                btn.eventType === 'TO' &&
                  'bg-orange-100 hover:bg-orange-200 text-orange-800 dark:bg-orange-900/30 dark:hover:bg-orange-900/50 dark:text-orange-300',
                btn.eventType === 'FOUL_PERSONAL' &&
                  'bg-yellow-100 hover:bg-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50 dark:text-yellow-300',
                btn.eventType === 'FOUL_TECH' &&
                  'bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-300'
              )}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export { SHOT_EVENTS }
export type { EventType }
