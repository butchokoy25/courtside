'use client'

import { useState } from 'react'
import { Pencil, Trash2, Plus, ChevronDown, ChevronRight } from 'lucide-react'
import { deleteLeague, deleteSeason } from '@/lib/actions/leagues'
import { LeagueForm } from '@/components/admin/league-form'
import { SeasonForm } from '@/components/admin/season-form'
import { DeleteConfirm } from '@/components/admin/delete-confirm'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import type { Database } from '@/lib/supabase/database.types'

type League = Database['public']['Tables']['leagues']['Row']
type Season = Database['public']['Tables']['seasons']['Row']

interface LeagueCardProps {
  league: League
  seasons: Season[]
}

export function LeagueCard({ league, seasons }: LeagueCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="rounded-md p-0.5 hover:bg-muted"
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </button>
          <div>
            <CardTitle>{league.name}</CardTitle>
            <CardDescription className="mt-1">
              <span className="font-mono text-xs">{league.slug}</span>
              {league.description && (
                <span className="ml-2">-- {league.description}</span>
              )}
            </CardDescription>
          </div>
        </div>
        <CardAction>
          <div className="flex items-center gap-1">
            <LeagueForm
              league={league}
              trigger={
                <Button variant="ghost" size="icon-sm" aria-label="Edit league">
                  <Pencil className="size-3.5" />
                </Button>
              }
            />
            <DeleteConfirm
              title="Delete League"
              description={`Are you sure you want to delete "${league.name}"? This will also delete all seasons, teams, and data associated with this league. This action cannot be undone.`}
              onConfirm={() => deleteLeague(league.id)}
              trigger={
                <Button variant="ghost" size="icon-sm" aria-label="Delete league">
                  <Trash2 className="size-3.5 text-destructive" />
                </Button>
              }
            />
          </div>
        </CardAction>
      </CardHeader>

      {expanded && (
        <CardContent>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              Seasons ({seasons.length})
            </h3>
            <SeasonForm
              leagueId={league.id}
              trigger={
                <Button variant="outline" size="sm">
                  <Plus className="size-3.5" />
                  Add Season
                </Button>
              }
            />
          </div>

          {seasons.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No seasons yet. Add one to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {seasons.map((season) => (
                  <TableRow key={season.id}>
                    <TableCell className="font-medium">{season.name}</TableCell>
                    <TableCell>{season.start_date ?? '--'}</TableCell>
                    <TableCell>{season.end_date ?? '--'}</TableCell>
                    <TableCell>
                      {season.is_active ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <SeasonForm
                          leagueId={league.id}
                          season={season}
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              aria-label="Edit season"
                            >
                              <Pencil className="size-3" />
                            </Button>
                          }
                        />
                        <DeleteConfirm
                          title="Delete Season"
                          description={`Are you sure you want to delete "${season.name}"? All games and data in this season will be lost. This action cannot be undone.`}
                          onConfirm={() => deleteSeason(season.id)}
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              aria-label="Delete season"
                            >
                              <Trash2 className="size-3 text-destructive" />
                            </Button>
                          }
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      )}
    </Card>
  )
}
