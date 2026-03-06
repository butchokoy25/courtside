export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatDateTime(dateStr: string): string {
  return `${formatDate(dateStr)} • ${formatTime(dateStr)}`
}

export function formatRecord(wins: number, losses: number): string {
  return `${wins}-${losses}`
}

export function formatPct(value: number | null): string {
  if (value === null || isNaN(value)) return '.000'
  return value.toFixed(3).replace(/^0/, '')
}

export function formatStat(made: number, attempted: number): string {
  return `${made}-${attempted}`
}

export function getEventDescription(eventType: string): string {
  const map: Record<string, string> = {
    '2PT_MADE': '2PT Made',
    '2PT_MISS': '2PT Missed',
    '3PT_MADE': '3PT Made',
    '3PT_MISS': '3PT Missed',
    'FT_MADE': 'FT Made',
    'FT_MISS': 'FT Missed',
    'REB': 'Rebound',
    'AST': 'Assist',
    'STL': 'Steal',
    'BLK': 'Block',
    'TO': 'Turnover',
    'FOUL_PERSONAL': 'Personal Foul',
    'FOUL_TECH': 'Technical Foul',
  }
  return map[eventType] || eventType
}
