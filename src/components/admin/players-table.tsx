'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import {
  EditPlayerButton,
  DeletePlayerButton,
} from '@/components/admin/player-form'
import {
  AssignToTeamButton,
  RosterBadges,
} from '@/components/admin/roster-assign-form'
import { Search } from 'lucide-react'

type Team = {
  id: string
  name: string
  color: string
}

type Season = {
  id: string
  name: string
}

type RosterAssignment = {
  id: string
  team_id: string
  player_id: string
  season_id: string
  is_active: boolean
  teams: {
    id: string
    name: string
    color: string
    league_id: string
    abbreviation: string
    created_at: string
  }
  seasons: {
    id: string
    name: string
    league_id: string
    start_date: string | null
    end_date: string | null
    is_active: boolean
    created_at: string
  }
}

type PlayerWithRosters = {
  id: string
  first_name: string
  last_name: string
  jersey_number: string | null
  position: string | null
  user_id: string | null
  created_at: string
  team_rosters: RosterAssignment[]
}

const POSITION_COLORS: Record<string, string> = {
  PG: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  SG: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  SF: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  PF: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  C: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
}

function PositionBadge({ position }: { position: string | null }) {
  if (!position) return null
  const colorClass = POSITION_COLORS[position] ?? ''
  return (
    <Badge variant="secondary" className={colorClass}>
      {position}
    </Badge>
  )
}

export function PlayersTableClient({
  players,
  teams,
  seasons,
}: {
  players: PlayerWithRosters[]
  teams: Team[]
  seasons: Season[]
}) {
  const [search, setSearch] = useState('')

  const filtered = players.filter((player) => {
    if (!search) return true
    const q = search.toLowerCase()
    const fullName = `${player.first_name} ${player.last_name}`.toLowerCase()
    const jersey = player.jersey_number?.toLowerCase() ?? ''
    const position = player.position?.toLowerCase() ?? ''
    const teamNames = player.team_rosters
      .map((r) => r.teams?.name?.toLowerCase() ?? '')
      .join(' ')
    return (
      fullName.includes(q) ||
      jersey.includes(q) ||
      position.includes(q) ||
      teamNames.includes(q)
    )
  })

  return (
    <div className="mt-6 space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search players..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No players match your search.
        </p>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Jersey #</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Team(s)</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((player) => (
                  <TableRow key={player.id}>
                    <TableCell className="font-medium">
                      {player.first_name} {player.last_name}
                    </TableCell>
                    <TableCell>
                      {player.jersey_number ? (
                        <span className="font-mono">
                          #{player.jersey_number}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <PositionBadge position={player.position} />
                      {!player.position && (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <RosterBadges
                        assignments={player.team_rosters as RosterAssignment[]}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <AssignToTeamButton
                          playerId={player.id}
                          playerName={`${player.first_name} ${player.last_name}`}
                          teams={teams}
                          seasons={seasons}
                        />
                        <EditPlayerButton
                          player={{
                            id: player.id,
                            first_name: player.first_name,
                            last_name: player.last_name,
                            jersey_number: player.jersey_number,
                            position: player.position,
                          }}
                        />
                        <DeletePlayerButton
                          player={{
                            id: player.id,
                            first_name: player.first_name,
                            last_name: player.last_name,
                            jersey_number: player.jersey_number,
                            position: player.position,
                          }}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="grid gap-3 md:hidden">
            {filtered.map((player) => (
              <Card key={player.id} className="py-0 overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate font-semibold">
                          {player.first_name} {player.last_name}
                        </h3>
                        {player.jersey_number && (
                          <span className="shrink-0 font-mono text-sm text-muted-foreground">
                            #{player.jersey_number}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <PositionBadge position={player.position} />
                      </div>
                      <div className="mt-2">
                        <RosterBadges
                          assignments={
                            player.team_rosters as RosterAssignment[]
                          }
                        />
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <AssignToTeamButton
                        playerId={player.id}
                        playerName={`${player.first_name} ${player.last_name}`}
                        teams={teams}
                        seasons={seasons}
                      />
                      <EditPlayerButton
                        player={{
                          id: player.id,
                          first_name: player.first_name,
                          last_name: player.last_name,
                          jersey_number: player.jersey_number,
                          position: player.position,
                        }}
                      />
                      <DeletePlayerButton
                        player={{
                          id: player.id,
                          first_name: player.first_name,
                          last_name: player.last_name,
                          jersey_number: player.jersey_number,
                          position: player.position,
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Count */}
          <p className="text-xs text-muted-foreground">
            Showing {filtered.length} of {players.length} player
            {players.length !== 1 ? 's' : ''}
          </p>
        </>
      )}
    </div>
  )
}
