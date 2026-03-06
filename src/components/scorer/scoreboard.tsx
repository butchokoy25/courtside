'use client'

import { cn } from '@/lib/utils'

interface ScoreboardProps {
  homeName: string
  homeAbbr: string
  homeColor: string
  homeScore: number
  awayName: string
  awayAbbr: string
  awayColor: string
  awayScore: number
  currentPeriod: number
  totalPeriods: number
  status: 'scheduled' | 'in_progress' | 'final'
}

export function Scoreboard({
  homeName,
  homeAbbr,
  homeColor,
  homeScore,
  awayName,
  awayAbbr,
  awayColor,
  awayScore,
  currentPeriod,
  totalPeriods,
  status,
}: ScoreboardProps) {
  const periodLabel =
    status === 'scheduled'
      ? 'PRE'
      : status === 'final'
        ? 'FINAL'
        : currentPeriod > totalPeriods
          ? 'OT'
          : `Q${currentPeriod}`

  return (
    <div className="sticky top-0 z-50 bg-background border-b shadow-sm">
      <div className="flex items-center justify-between px-3 py-2 max-w-2xl mx-auto">
        {/* Home team */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className="w-3 h-8 rounded-sm shrink-0"
            style={{ backgroundColor: homeColor }}
          />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate hidden sm:block">
              {homeName}
            </p>
            <p className="text-sm font-bold sm:hidden">{homeAbbr}</p>
            <p className="text-sm font-bold hidden sm:block">{homeAbbr}</p>
          </div>
          <span className="text-3xl font-bold tabular-nums ml-auto">
            {homeScore}
          </span>
        </div>

        {/* Period indicator */}
        <div className="flex flex-col items-center px-4 shrink-0">
          <span
            className={cn(
              'text-xs font-medium px-2 py-0.5 rounded-full',
              status === 'in_progress'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : status === 'final'
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
            )}
          >
            {periodLabel}
          </span>
          {status === 'in_progress' && (
            <span className="text-[10px] text-muted-foreground mt-0.5">
              LIVE
            </span>
          )}
        </div>

        {/* Away team */}
        <div className="flex items-center gap-2 flex-1 min-w-0 flex-row-reverse">
          <div
            className="w-3 h-8 rounded-sm shrink-0"
            style={{ backgroundColor: awayColor }}
          />
          <div className="text-right min-w-0">
            <p className="text-xs text-muted-foreground truncate hidden sm:block">
              {awayName}
            </p>
            <p className="text-sm font-bold sm:hidden">{awayAbbr}</p>
            <p className="text-sm font-bold hidden sm:block">{awayAbbr}</p>
          </div>
          <span className="text-3xl font-bold tabular-nums mr-auto">
            {awayScore}
          </span>
        </div>
      </div>
    </div>
  )
}
