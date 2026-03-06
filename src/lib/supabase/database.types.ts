export type Database = {
  public: {
    Tables: {
      leagues: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          created_at?: string
        }
        Relationships: []
      }
      seasons: {
        Row: {
          id: string
          league_id: string
          name: string
          start_date: string | null
          end_date: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          league_id: string
          name: string
          start_date?: string | null
          end_date?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          league_id?: string
          name?: string
          start_date?: string | null
          end_date?: string | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'seasons_league_id_fkey'
            columns: ['league_id']
            isOneToOne: false
            referencedRelation: 'leagues'
            referencedColumns: ['id']
          },
        ]
      }
      teams: {
        Row: {
          id: string
          league_id: string
          name: string
          abbreviation: string
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          league_id: string
          name: string
          abbreviation: string
          color: string
          created_at?: string
        }
        Update: {
          id?: string
          league_id?: string
          name?: string
          abbreviation?: string
          color?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'teams_league_id_fkey'
            columns: ['league_id']
            isOneToOne: false
            referencedRelation: 'leagues'
            referencedColumns: ['id']
          },
        ]
      }
      players: {
        Row: {
          id: string
          first_name: string
          last_name: string
          jersey_number: string | null
          position: string | null
          user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          jersey_number?: string | null
          position?: string | null
          user_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          jersey_number?: string | null
          position?: string | null
          user_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      team_rosters: {
        Row: {
          id: string
          team_id: string
          player_id: string
          season_id: string
          is_active: boolean
        }
        Insert: {
          id?: string
          team_id: string
          player_id: string
          season_id: string
          is_active?: boolean
        }
        Update: {
          id?: string
          team_id?: string
          player_id?: string
          season_id?: string
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'team_rosters_team_id_fkey'
            columns: ['team_id']
            isOneToOne: false
            referencedRelation: 'teams'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'team_rosters_player_id_fkey'
            columns: ['player_id']
            isOneToOne: false
            referencedRelation: 'players'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'team_rosters_season_id_fkey'
            columns: ['season_id']
            isOneToOne: false
            referencedRelation: 'seasons'
            referencedColumns: ['id']
          },
        ]
      }
      games: {
        Row: {
          id: string
          season_id: string
          home_team_id: string
          away_team_id: string
          scheduled_at: string
          venue: string | null
          status: 'scheduled' | 'in_progress' | 'final'
          home_score: number
          away_score: number
          current_period: number
          periods: number
          entry_mode: 'live' | 'post_game'
          created_at: string
        }
        Insert: {
          id?: string
          season_id: string
          home_team_id: string
          away_team_id: string
          scheduled_at: string
          venue?: string | null
          status?: 'scheduled' | 'in_progress' | 'final'
          home_score?: number
          away_score?: number
          current_period?: number
          periods?: number
          entry_mode?: 'live' | 'post_game'
          created_at?: string
        }
        Update: {
          id?: string
          season_id?: string
          home_team_id?: string
          away_team_id?: string
          scheduled_at?: string
          venue?: string | null
          status?: 'scheduled' | 'in_progress' | 'final'
          home_score?: number
          away_score?: number
          current_period?: number
          periods?: number
          entry_mode?: 'live' | 'post_game'
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'games_season_id_fkey'
            columns: ['season_id']
            isOneToOne: false
            referencedRelation: 'seasons'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'games_home_team_id_fkey'
            columns: ['home_team_id']
            isOneToOne: false
            referencedRelation: 'teams'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'games_away_team_id_fkey'
            columns: ['away_team_id']
            isOneToOne: false
            referencedRelation: 'teams'
            referencedColumns: ['id']
          },
        ]
      }
      game_events: {
        Row: {
          id: string
          game_id: string
          player_id: string
          team_id: string
          event_type: '2PT_MADE' | '2PT_MISS' | '3PT_MADE' | '3PT_MISS' | 'FT_MADE' | 'FT_MISS' | 'REB' | 'AST' | 'STL' | 'BLK' | 'TO' | 'FOUL_PERSONAL' | 'FOUL_TECH'
          period: number
          court_x: number | null
          court_y: number | null
          created_at: string
        }
        Insert: {
          id?: string
          game_id: string
          player_id: string
          team_id: string
          event_type: '2PT_MADE' | '2PT_MISS' | '3PT_MADE' | '3PT_MISS' | 'FT_MADE' | 'FT_MISS' | 'REB' | 'AST' | 'STL' | 'BLK' | 'TO' | 'FOUL_PERSONAL' | 'FOUL_TECH'
          period: number
          court_x?: number | null
          court_y?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          player_id?: string
          team_id?: string
          event_type?: '2PT_MADE' | '2PT_MISS' | '3PT_MADE' | '3PT_MISS' | 'FT_MADE' | 'FT_MISS' | 'REB' | 'AST' | 'STL' | 'BLK' | 'TO' | 'FOUL_PERSONAL' | 'FOUL_TECH'
          period?: number
          court_x?: number | null
          court_y?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'game_events_game_id_fkey'
            columns: ['game_id']
            isOneToOne: false
            referencedRelation: 'games'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'game_events_player_id_fkey'
            columns: ['player_id']
            isOneToOne: false
            referencedRelation: 'players'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'game_events_team_id_fkey'
            columns: ['team_id']
            isOneToOne: false
            referencedRelation: 'teams'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          id: string
          display_name: string | null
          role: 'admin' | 'scorer' | 'player'
          player_id: string | null
          created_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          role?: 'admin' | 'scorer' | 'player'
          player_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          role?: 'admin' | 'scorer' | 'player'
          player_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      team_standings: {
        Row: {
          team_id: string
          season_id: string
          team_name: string
          team_abbreviation: string
          team_color: string
          wins: number
          losses: number
          win_pct: number | null
        }
        Relationships: []
      }
      player_game_stats: {
        Row: {
          player_id: string
          game_id: string
          team_id: string
          first_name: string
          last_name: string
          jersey_number: string | null
          pts: number
          fgm: number
          fga: number
          fg_pct: number | null
          three_pm: number
          three_pa: number
          three_pct: number | null
          ftm: number
          fta: number
          ft_pct: number | null
          reb: number
          ast: number
          stl: number
          blk: number
          turnovers: number
          pf: number
        }
        Relationships: []
      }
      player_season_stats: {
        Row: {
          player_id: string
          season_id: string
          team_id: string
          first_name: string
          last_name: string
          jersey_number: string | null
          games_played: number
          total_pts: number
          total_fgm: number
          total_fga: number
          fg_pct: number | null
          total_three_pm: number
          total_three_pa: number
          three_pct: number | null
          total_ftm: number
          total_fta: number
          ft_pct: number | null
          total_reb: number
          total_ast: number
          total_stl: number
          total_blk: number
          total_turnovers: number
          total_pf: number
          ppg: number
          rpg: number
          apg: number
          spg: number
          bpg: number
          topg: number
          fgm_pg: number
          fga_pg: number
          ftm_pg: number
          fta_pg: number
          fpg: number
        }
        Relationships: []
      }
      stat_leaders: {
        Row: {
          player_id: string
          season_id: string
          team_id: string
          first_name: string
          last_name: string
          jersey_number: string | null
          games_played: number
          ppg: number
          rpg: number
          apg: number
          spg: number
          bpg: number
          fg_pct: number | null
          three_pct: number | null
          ft_pct: number | null
          ppg_rank: number
          rpg_rank: number
          apg_rank: number
          spg_rank: number
          bpg_rank: number
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
