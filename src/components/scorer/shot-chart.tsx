'use client'

import { useState, useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ShotChartProps {
  onLocationSelect: (courtX: number, courtY: number) => void
  onCancel: () => void
  eventType: string // '2PT_MADE', '3PT_MADE', etc.
  playerName: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function eventLabel(eventType: string): string {
  const map: Record<string, string> = {
    '2PT_MADE': '2-pointer (made)',
    '3PT_MADE': '3-pointer (made)',
    '2PT_MISS': '2-pointer (miss)',
    '3PT_MISS': '3-pointer (miss)',
  }
  return map[eventType] ?? eventType
}

function isMissEvent(eventType: string): boolean {
  return eventType.includes('MISS')
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ShotChart({
  onLocationSelect,
  onCancel,
  eventType,
  playerName,
}: ShotChartProps) {
  const [tapMarker, setTapMarker] = useState<{
    x: number
    y: number
    pctX: number
    pctY: number
  } | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const handleTap = useCallback(
    (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
      if (!svgRef.current) return

      // Prevent double-firing on touch devices
      if (e.type === 'touchend') {
        e.preventDefault()
      }

      const svg = svgRef.current
      const rect = svg.getBoundingClientRect()

      let clientX: number
      let clientY: number

      if ('touches' in e) {
        // Touch event — use changedTouches for touchend
        const touch = e.changedTouches[0]
        clientX = touch.clientX
        clientY = touch.clientY
      } else {
        clientX = e.clientX
        clientY = e.clientY
      }

      // Calculate position relative to SVG element
      const relX = clientX - rect.left
      const relY = clientY - rect.top

      // Convert to SVG viewBox coordinates
      // ViewBox is 500 x 470. The SVG is displayed with aspect ratio preserved.
      const scaleX = 500 / rect.width
      const scaleY = 470 / rect.height
      const svgX = relX * scaleX
      const svgY = relY * scaleY

      // Convert to percentage (0-100) of court dimensions
      const pctX = Math.round((svgX / 500) * 1000) / 10
      const pctY = Math.round((svgY / 470) * 1000) / 10

      // Clamp to 0-100
      const clampedX = Math.max(0, Math.min(100, pctX))
      const clampedY = Math.max(0, Math.min(100, pctY))

      // Show marker at SVG coordinates
      setTapMarker({ x: svgX, y: svgY, pctX: clampedX, pctY: clampedY })

      // Brief delay so user sees the marker, then fire callback
      setTimeout(() => {
        onLocationSelect(clampedX, clampedY)
      }, 300)
    },
    [onLocationSelect]
  )

  const isMiss = isMissEvent(eventType)
  const markerColor = isMiss ? '#ef4444' : '#22c55e' // red for miss, green for made

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Modal content */}
      <div className="relative z-10 w-full max-w-lg flex flex-col items-center">
        {/* Header */}
        <div className="w-full bg-background rounded-t-xl px-4 py-3 flex items-center justify-between border border-b-0 border-border">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">
              Tap shot location
            </span>
            <span className="text-xs text-muted-foreground">
              {playerName} &mdash; {eventLabel(eventType)}
            </span>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md hover:bg-muted transition-colors touch-manipulation min-h-[36px]"
          >
            Cancel
          </button>
        </div>

        {/* Court SVG */}
        <div className="w-full bg-amber-50 dark:bg-amber-950/20 border border-border rounded-b-xl overflow-hidden">
          <svg
            ref={svgRef}
            viewBox="0 0 500 470"
            className="w-full h-auto max-h-[70vh] cursor-crosshair touch-manipulation select-none"
            onClick={handleTap}
            onTouchEnd={handleTap}
            role="img"
            aria-label="Basketball half court. Tap to mark shot location."
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

            {/* Free throw circle (top half — solid) */}
            <path
              d="M 170 190 A 80 80 0 0 0 330 190"
              fill="none"
              className="stroke-muted-foreground/50"
              strokeWidth="2"
            />
            {/* Free throw circle (bottom half — dashed) */}
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
            {/* Left straight section (baseline to where arc starts) */}
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

            {/* Tap marker */}
            {tapMarker && (
              <g>
                {/* Outer ring for visibility */}
                <circle
                  cx={tapMarker.x}
                  cy={tapMarker.y}
                  r="14"
                  fill={markerColor}
                  fillOpacity="0.25"
                  stroke={markerColor}
                  strokeWidth="2"
                />
                {/* Inner dot */}
                <circle
                  cx={tapMarker.x}
                  cy={tapMarker.y}
                  r="6"
                  fill={markerColor}
                />
              </g>
            )}
          </svg>
        </div>
      </div>
    </div>
  )
}
