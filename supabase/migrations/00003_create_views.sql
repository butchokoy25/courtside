-- ============================================================================
-- Basketball App: Computed Stats Views
-- ============================================================================
-- All stats are derived from game_events (the single source of truth).
-- These views provide convenient access to box scores, season averages,
-- standings, and stat leaders.
--
-- IMPORTANT: All percentage calculations use NULLIF to avoid division by zero.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- VIEW: player_game_stats
-- ---------------------------------------------------------------------------
-- Per-player, per-game box score line. This is the foundation for all
-- other stat views.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW player_game_stats AS
SELECT
  ge.player_id,
  ge.game_id,
  ge.team_id,

  -- Player info (denormalized for convenience)
  p.first_name,
  p.last_name,
  p.jersey_number,

  -- Points
  (
    COALESCE(SUM(CASE WHEN ge.event_type = '2PT_MADE' THEN 2 END), 0) +
    COALESCE(SUM(CASE WHEN ge.event_type = '3PT_MADE' THEN 3 END), 0) +
    COALESCE(SUM(CASE WHEN ge.event_type = 'FT_MADE'  THEN 1 END), 0)
  ) AS pts,

  -- Field Goals
  COALESCE(SUM(CASE WHEN ge.event_type IN ('2PT_MADE', '3PT_MADE') THEN 1 END), 0) AS fgm,
  COALESCE(SUM(CASE WHEN ge.event_type IN ('2PT_MADE', '2PT_MISS', '3PT_MADE', '3PT_MISS') THEN 1 END), 0) AS fga,
  ROUND(
    COALESCE(SUM(CASE WHEN ge.event_type IN ('2PT_MADE', '3PT_MADE') THEN 1 END), 0)::NUMERIC
    / NULLIF(COALESCE(SUM(CASE WHEN ge.event_type IN ('2PT_MADE', '2PT_MISS', '3PT_MADE', '3PT_MISS') THEN 1 END), 0), 0),
    3
  ) AS fg_pct,

  -- Three Pointers
  COALESCE(SUM(CASE WHEN ge.event_type = '3PT_MADE' THEN 1 END), 0) AS three_pm,
  COALESCE(SUM(CASE WHEN ge.event_type IN ('3PT_MADE', '3PT_MISS') THEN 1 END), 0) AS three_pa,
  ROUND(
    COALESCE(SUM(CASE WHEN ge.event_type = '3PT_MADE' THEN 1 END), 0)::NUMERIC
    / NULLIF(COALESCE(SUM(CASE WHEN ge.event_type IN ('3PT_MADE', '3PT_MISS') THEN 1 END), 0), 0),
    3
  ) AS three_pct,

  -- Free Throws
  COALESCE(SUM(CASE WHEN ge.event_type = 'FT_MADE' THEN 1 END), 0) AS ftm,
  COALESCE(SUM(CASE WHEN ge.event_type IN ('FT_MADE', 'FT_MISS') THEN 1 END), 0) AS fta,
  ROUND(
    COALESCE(SUM(CASE WHEN ge.event_type = 'FT_MADE' THEN 1 END), 0)::NUMERIC
    / NULLIF(COALESCE(SUM(CASE WHEN ge.event_type IN ('FT_MADE', 'FT_MISS') THEN 1 END), 0), 0),
    3
  ) AS ft_pct,

  -- Counting Stats
  COALESCE(SUM(CASE WHEN ge.event_type = 'REB'  THEN 1 END), 0) AS reb,
  COALESCE(SUM(CASE WHEN ge.event_type = 'AST'  THEN 1 END), 0) AS ast,
  COALESCE(SUM(CASE WHEN ge.event_type = 'STL'  THEN 1 END), 0) AS stl,
  COALESCE(SUM(CASE WHEN ge.event_type = 'BLK'  THEN 1 END), 0) AS blk,
  COALESCE(SUM(CASE WHEN ge.event_type = 'TO'   THEN 1 END), 0) AS turnovers,
  COALESCE(SUM(CASE WHEN ge.event_type IN ('FOUL_PERSONAL', 'FOUL_TECH') THEN 1 END), 0) AS pf

FROM game_events ge
JOIN players p ON p.id = ge.player_id
WHERE ge.player_id IS NOT NULL
GROUP BY ge.player_id, ge.game_id, ge.team_id,
         p.first_name, p.last_name, p.jersey_number;


-- ---------------------------------------------------------------------------
-- VIEW: player_season_stats
-- ---------------------------------------------------------------------------
-- Aggregates player_game_stats across all games in a season.
-- Includes both totals and per-game averages.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW player_season_stats AS
SELECT
  pgs.player_id,
  g.season_id,
  pgs.team_id,

  -- Player info
  pgs.first_name,
  pgs.last_name,
  pgs.jersey_number,

  -- Games played
  COUNT(DISTINCT pgs.game_id) AS games_played,

  -- Totals
  SUM(pgs.pts) AS total_pts,
  SUM(pgs.fgm) AS total_fgm,
  SUM(pgs.fga) AS total_fga,
  ROUND(
    SUM(pgs.fgm)::NUMERIC / NULLIF(SUM(pgs.fga), 0),
    3
  ) AS fg_pct,
  SUM(pgs.three_pm) AS total_three_pm,
  SUM(pgs.three_pa) AS total_three_pa,
  ROUND(
    SUM(pgs.three_pm)::NUMERIC / NULLIF(SUM(pgs.three_pa), 0),
    3
  ) AS three_pct,
  SUM(pgs.ftm) AS total_ftm,
  SUM(pgs.fta) AS total_fta,
  ROUND(
    SUM(pgs.ftm)::NUMERIC / NULLIF(SUM(pgs.fta), 0),
    3
  ) AS ft_pct,
  SUM(pgs.reb) AS total_reb,
  SUM(pgs.ast) AS total_ast,
  SUM(pgs.stl) AS total_stl,
  SUM(pgs.blk) AS total_blk,
  SUM(pgs.turnovers) AS total_turnovers,
  SUM(pgs.pf) AS total_pf,

  -- Per-game averages
  ROUND(SUM(pgs.pts)::NUMERIC       / NULLIF(COUNT(DISTINCT pgs.game_id), 0), 1) AS ppg,
  ROUND(SUM(pgs.reb)::NUMERIC       / NULLIF(COUNT(DISTINCT pgs.game_id), 0), 1) AS rpg,
  ROUND(SUM(pgs.ast)::NUMERIC       / NULLIF(COUNT(DISTINCT pgs.game_id), 0), 1) AS apg,
  ROUND(SUM(pgs.stl)::NUMERIC       / NULLIF(COUNT(DISTINCT pgs.game_id), 0), 1) AS spg,
  ROUND(SUM(pgs.blk)::NUMERIC       / NULLIF(COUNT(DISTINCT pgs.game_id), 0), 1) AS bpg,
  ROUND(SUM(pgs.turnovers)::NUMERIC / NULLIF(COUNT(DISTINCT pgs.game_id), 0), 1) AS topg,
  ROUND(SUM(pgs.fgm)::NUMERIC       / NULLIF(COUNT(DISTINCT pgs.game_id), 0), 1) AS fgm_pg,
  ROUND(SUM(pgs.fga)::NUMERIC       / NULLIF(COUNT(DISTINCT pgs.game_id), 0), 1) AS fga_pg,
  ROUND(SUM(pgs.ftm)::NUMERIC       / NULLIF(COUNT(DISTINCT pgs.game_id), 0), 1) AS ftm_pg,
  ROUND(SUM(pgs.fta)::NUMERIC       / NULLIF(COUNT(DISTINCT pgs.game_id), 0), 1) AS fta_pg,
  ROUND(SUM(pgs.pf)::NUMERIC        / NULLIF(COUNT(DISTINCT pgs.game_id), 0), 1) AS fpg

FROM player_game_stats pgs
JOIN games g ON g.id = pgs.game_id
WHERE g.status = 'final'
GROUP BY pgs.player_id, g.season_id, pgs.team_id,
         pgs.first_name, pgs.last_name, pgs.jersey_number;


-- ---------------------------------------------------------------------------
-- VIEW: team_standings
-- ---------------------------------------------------------------------------
-- Win-loss records per team per season, computed from finalized games.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW team_standings AS
WITH team_games AS (
  -- Expand each final game into two rows: one per participating team
  SELECT
    g.season_id,
    g.home_team_id AS team_id,
    CASE WHEN g.home_score > g.away_score THEN 1 ELSE 0 END AS win,
    CASE WHEN g.home_score < g.away_score THEN 1 ELSE 0 END AS loss
  FROM games g
  WHERE g.status = 'final'

  UNION ALL

  SELECT
    g.season_id,
    g.away_team_id AS team_id,
    CASE WHEN g.away_score > g.home_score THEN 1 ELSE 0 END AS win,
    CASE WHEN g.away_score < g.home_score THEN 1 ELSE 0 END AS loss
  FROM games g
  WHERE g.status = 'final'
)
SELECT
  tg.team_id,
  tg.season_id,
  t.name AS team_name,
  t.abbreviation AS team_abbreviation,
  t.color AS team_color,
  SUM(tg.win) AS wins,
  SUM(tg.loss) AS losses,
  ROUND(
    SUM(tg.win)::NUMERIC / NULLIF(SUM(tg.win) + SUM(tg.loss), 0),
    3
  ) AS win_pct
FROM team_games tg
JOIN teams t ON t.id = tg.team_id
GROUP BY tg.team_id, tg.season_id, t.name, t.abbreviation, t.color;


-- ---------------------------------------------------------------------------
-- VIEW: stat_leaders
-- ---------------------------------------------------------------------------
-- Ranks players by major statistical categories within each season.
-- Includes rank columns for ppg, rpg, apg, spg, bpg so the app can
-- easily query "top N in category X for season Y".
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW stat_leaders AS
SELECT
  player_id,
  season_id,
  team_id,
  first_name,
  last_name,
  jersey_number,
  games_played,

  -- Per-game averages
  ppg,
  rpg,
  apg,
  spg,
  bpg,

  -- Shooting percentages
  fg_pct,
  three_pct,
  ft_pct,

  -- Rankings within each season (descending, ties get same rank)
  RANK() OVER (PARTITION BY season_id ORDER BY ppg  DESC) AS ppg_rank,
  RANK() OVER (PARTITION BY season_id ORDER BY rpg  DESC) AS rpg_rank,
  RANK() OVER (PARTITION BY season_id ORDER BY apg  DESC) AS apg_rank,
  RANK() OVER (PARTITION BY season_id ORDER BY spg  DESC) AS spg_rank,
  RANK() OVER (PARTITION BY season_id ORDER BY bpg  DESC) AS bpg_rank

FROM player_season_stats
WHERE games_played >= 1;
