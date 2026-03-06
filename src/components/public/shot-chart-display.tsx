import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ShotChartDisplayProps {
  shots: Array<{
    court_x: number | null
    court_y: number | null
    event_type: string // '2PT_MADE', '2PT_MISS', '3PT_MADE', '3PT_MISS'
  }>
  title?: string
  className?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isMade(eventType: string): boolean {
  return eventType.includes('MADE')
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ShotChartDisplay({
  shots,
  title,
  className,
}: ShotChartDisplayProps) {
  // Filter to only shots with coordinates
  const plotShots = shots.filter(
    (s) => s.court_x !== null && s.court_y !== null
  )

  const madeShots = plotShots.filter((s) => isMade(s.event_type))
  const missedShots = plotShots.filter((s) => !isMade(s.event_type))

  return (
    <div className={cn('w-full', className)}>
      {title && (
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h3>
      )}

      {/* Court SVG */}
      <div className="w-full rounded-lg border border-border bg-amber-50 dark:bg-amber-950/20 overflow-hidden">
        <svg
          viewBox="0 0 500 470"
          className="w-full h-auto"
          role="img"
          aria-label={`Shot chart showing ${madeShots.length} makes and ${missedShots.length} misses`}
        >
          {/* Court background */}
          <rect
            x="0"
            y="0"
            width="500"
            height="470"
            fill="none"
            className="stroke-muted-foreground/30"
            strokeWidth="2"
          />

          {/* ---- Court markings (basket at BOTTOM, half-court line at TOP) ---- */}

          {/* Half-court line (top edge) */}
          <line
            x1="0"
            y1="470"
            x2="500"
            y2="470"
            className="stroke-muted-foreground/40"
            strokeWidth="2"
          />

          {/* Half-court center circle (only bottom semicircle visible) */}
          <path
            d="M 190 470 A 60 60 0 0 1 310 470"
            fill="none"
            className="stroke-muted-foreground/40"
            strokeWidth="2"
          />

          {/* Paint / Lane (rectangle from baseline) */}
          <rect
            x="170"
            y="0"
            width="160"
            height="190"
            fill="none"
            className="stroke-muted-foreground/50"
            strokeWidth="2"
          />

          {/* Free throw circle (top half -- solid) */}
          <path
            d="M 170 190 A 80 80 0 0 0 330 190"
            fill="none"
            className="stroke-muted-foreground/50"
            strokeWidth="2"
          />
          {/* Free throw circle (bottom half -- dashed) */}
          <path
            d="M 170 190 A 80 80 0 0 1 330 190"
            fill="none"
            className="stroke-muted-foreground/30"
            strokeWidth="2"
            strokeDasharray="6,6"
          />

          {/* Backboard */}
          <line
            x1="220"
            y1="40"
            x2="280"
            y2="40"
            className="stroke-muted-foreground/60"
            strokeWidth="3"
          />

          {/* Basket / Rim */}
          <circle
            cx="250"
            cy="52"
            r="8"
            fill="none"
            className="stroke-muted-foreground/60"
            strokeWidth="2"
          />

          {/* Restricted area arc */}
          <path
            d="M 210 0 A 40 40 0 0 0 290 0"
            fill="none"
            className="stroke-muted-foreground/40"
            strokeWidth="2"
          />

          {/* Three-point line */}
          {/* Left straight section */}
          <line
            x1="30"
            y1="0"
            x2="30"
            y2="140"
            className="stroke-muted-foreground/50"
            strokeWidth="2"
          />
          {/* Arc */}
          <path
            d="M 30 140 A 238 238 0 0 0 470 140"
            fill="none"
            className="stroke-muted-foreground/50"
            strokeWidth="2"
          />
          {/* Right straight section */}
          <line
            x1="470"
            y1="0"
            x2="470"
            y2="140"
            className="stroke-muted-foreground/50"
            strokeWidth="2"
          />

          {/* Lane hash marks (left side) */}
          <line x1="170" y1="70" x2="160" y2="70" className="stroke-muted-foreground/30" strokeWidth="2" />
          <line x1="170" y1="110" x2="160" y2="110" className="stroke-muted-foreground/30" strokeWidth="2" />
          <line x1="170" y1="130" x2="160" y2="130" className="stroke-muted-foreground/30" strokeWidth="2" />
          <line x1="170" y1="150" x2="160" y2="150" className="stroke-muted-foreground/30" strokeWidth="2" />

          {/* Lane hash marks (right side) */}
          <line x1="330" y1="70" x2="340" y2="70" className="stroke-muted-foreground/30" strokeWidth="2" />
          <line x1="330" y1="110" x2="340" y2="110" className="stroke-muted-foreground/30" strokeWidth="2" />
          <line x1="330" y1="130" x2="340" y2="130" className="stroke-muted-foreground/30" strokeWidth="2" />
          <line x1="330" y1="150" x2="340" y2="150" className="stroke-muted-foreground/30" strokeWidth="2" />

          {/* Plot missed shots first (underneath) */}
          {missedShots.map((shot, i) => {
            const x = (shot.court_x! / 100) * 500
            const y = (shot.court_y! / 100) * 470
            return (
              <g key={`miss-${i}`}>
                {/* X mark for misses */}
                <line
                  x1={x - 5}
                  y1={y - 5}
                  x2={x + 5}
                  y2={y + 5}
                  stroke="#ef4444"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <line
                  x1={x + 5}
                  y1={y - 5}
                  x2={x - 5}
                  y2={y + 5}
                  stroke="#ef4444"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </g>
            )
          })}

          {/* Plot made shots on top */}
          {madeShots.map((shot, i) => {
            const x = (shot.court_x! / 100) * 500
            const y = (shot.court_y! / 100) * 470
            return (
              <circle
                key={`made-${i}`}
                cx={x}
                cy={y}
                r="6"
                fill="#22c55e"
                fillOpacity="0.85"
                stroke="#16a34a"
                strokeWidth="1.5"
              />
            )
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center justify-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 14 14">
            <circle cx="7" cy="7" r="5" fill="#22c55e" stroke="#16a34a" strokeWidth="1.5" />
          </svg>
          <span>Made ({madeShots.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 14 14">
            <line x1="3" y1="3" x2="11" y2="11" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="11" y1="3" x2="3" y2="11" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <span>Missed ({missedShots.length})</span>
        </div>
        {plotShots.length > 0 && (
          <div className="text-xs">
            {((madeShots.length / plotShots.length) * 100).toFixed(0)}% FG
          </div>
        )}
      </div>

      {/* Empty state */}
      {plotShots.length === 0 && (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          No shot location data available
        </p>
      )}
    </div>
  )
}
