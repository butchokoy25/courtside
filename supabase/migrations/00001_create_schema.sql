-- ============================================================================
-- Basketball App: Core Schema Migration
-- ============================================================================
-- Event-sourced architecture: game_events table is the single source of truth.
-- All stats are computed from events via SQL views (see 00003_create_views.sql).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Leagues (top-level container -- expect ~2 records for weekend rec leagues)
-- ---------------------------------------------------------------------------
CREATE TABLE leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Seasons (historical separation within a league)
-- ---------------------------------------------------------------------------
CREATE TABLE seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_seasons_league_id ON seasons(league_id);

-- ---------------------------------------------------------------------------
-- Teams
-- ---------------------------------------------------------------------------
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  abbreviation TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_teams_league_id ON teams(league_id);

-- ---------------------------------------------------------------------------
-- Players (independent of teams for cross-league/season flexibility)
-- ---------------------------------------------------------------------------
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  jersey_number TEXT,
  position TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_players_user_id ON players(user_id);

-- ---------------------------------------------------------------------------
-- Roster junction (player <-> team per season)
-- ---------------------------------------------------------------------------
CREATE TABLE team_rosters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(team_id, player_id, season_id)
);

CREATE INDEX idx_team_rosters_team_id ON team_rosters(team_id);
CREATE INDEX idx_team_rosters_player_id ON team_rosters(player_id);
CREATE INDEX idx_team_rosters_season_id ON team_rosters(season_id);

-- ---------------------------------------------------------------------------
-- Games
-- ---------------------------------------------------------------------------
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  home_team_id UUID NOT NULL REFERENCES teams(id),
  away_team_id UUID NOT NULL REFERENCES teams(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  venue TEXT,
  status TEXT DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'in_progress', 'final')),
  home_score INT DEFAULT 0,
  away_score INT DEFAULT 0,
  current_period INT DEFAULT 1,
  periods INT DEFAULT 4,
  entry_mode TEXT DEFAULT 'live'
    CHECK (entry_mode IN ('live', 'post_game')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_games_season_id ON games(season_id);
CREATE INDEX idx_games_home_team_id ON games(home_team_id);
CREATE INDEX idx_games_away_team_id ON games(away_team_id);
CREATE INDEX idx_games_status ON games(status);

-- ---------------------------------------------------------------------------
-- Game Events (atomic stat unit -- THE source of truth)
-- ---------------------------------------------------------------------------
-- Every meaningful play is stored as an event row.
-- Scores and stats are always derived from these events, never stored directly
-- (the home_score/away_score on games is a denormalized cache for convenience).
-- ---------------------------------------------------------------------------
CREATE TABLE game_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id),
  team_id UUID NOT NULL REFERENCES teams(id),
  event_type TEXT NOT NULL CHECK (event_type IN (
    '2PT_MADE', '2PT_MISS', '3PT_MADE', '3PT_MISS',
    'FT_MADE', 'FT_MISS',
    'REB', 'AST', 'STL', 'BLK',
    'TO',
    'FOUL_PERSONAL', 'FOUL_TECH'
  )),
  period INT NOT NULL,
  court_x REAL,        -- normalized x-coordinate on court diagram (for shot charts)
  court_y REAL,        -- normalized y-coordinate on court diagram (for shot charts)
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_game_events_game_id ON game_events(game_id);
CREATE INDEX idx_game_events_player_id ON game_events(player_id);
CREATE INDEX idx_game_events_team_id ON game_events(team_id);
CREATE INDEX idx_game_events_event_type ON game_events(event_type);

-- ---------------------------------------------------------------------------
-- User Profiles (extends Supabase auth.users)
-- ---------------------------------------------------------------------------
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  role TEXT DEFAULT 'player'
    CHECK (role IN ('admin', 'scorer', 'player')),
  player_id UUID REFERENCES players(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_profiles_player_id ON profiles(player_id);
