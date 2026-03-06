-- ============================================================================
-- Basketball App: Row-Level Security (RLS) Policies
-- ============================================================================
-- Design:
--   - All tables are publicly readable (no login required to view stats).
--   - Write operations (INSERT/UPDATE/DELETE) require admin or scorer role.
--   - Profiles: users can update their own (except role), admins can update any.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Enable RLS on all tables
-- ---------------------------------------------------------------------------
ALTER TABLE leagues       ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons       ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams         ENABLE ROW LEVEL SECURITY;
ALTER TABLE players       ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_rosters  ENABLE ROW LEVEL SECURITY;
ALTER TABLE games         ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_events   ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Helper: reusable check for admin/scorer role
-- ---------------------------------------------------------------------------
-- We reference this expression inline in policies since Supabase doesn't
-- support user-defined functions in the free tier migration context easily.
-- The expression is:
--   EXISTS (
--     SELECT 1 FROM profiles
--     WHERE profiles.id = auth.uid()
--       AND profiles.role IN ('admin', 'scorer')
--   )

-- ===========================
-- LEAGUES
-- ===========================
CREATE POLICY "leagues_select_public"
  ON leagues FOR SELECT
  USING (true);

CREATE POLICY "leagues_insert_admin_scorer"
  ON leagues FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'scorer')
    )
  );

CREATE POLICY "leagues_update_admin_scorer"
  ON leagues FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'scorer')
    )
  );

CREATE POLICY "leagues_delete_admin_scorer"
  ON leagues FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'scorer')
    )
  );

-- ===========================
-- SEASONS
-- ===========================
CREATE POLICY "seasons_select_public"
  ON seasons FOR SELECT
  USING (true);

CREATE POLICY "seasons_insert_admin_scorer"
  ON seasons FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'scorer')
    )
  );

CREATE POLICY "seasons_update_admin_scorer"
  ON seasons FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'scorer')
    )
  );

CREATE POLICY "seasons_delete_admin_scorer"
  ON seasons FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'scorer')
    )
  );

-- ===========================
-- TEAMS
-- ===========================
CREATE POLICY "teams_select_public"
  ON teams FOR SELECT
  USING (true);

CREATE POLICY "teams_insert_admin_scorer"
  ON teams FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'scorer')
    )
  );

CREATE POLICY "teams_update_admin_scorer"
  ON teams FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'scorer')
    )
  );

CREATE POLICY "teams_delete_admin_scorer"
  ON teams FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'scorer')
    )
  );

-- ===========================
-- PLAYERS
-- ===========================
CREATE POLICY "players_select_public"
  ON players FOR SELECT
  USING (true);

CREATE POLICY "players_insert_admin_scorer"
  ON players FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'scorer')
    )
  );

CREATE POLICY "players_update_admin_scorer"
  ON players FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'scorer')
    )
  );

CREATE POLICY "players_delete_admin_scorer"
  ON players FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'scorer')
    )
  );

-- ===========================
-- TEAM_ROSTERS
-- ===========================
CREATE POLICY "team_rosters_select_public"
  ON team_rosters FOR SELECT
  USING (true);

CREATE POLICY "team_rosters_insert_admin_scorer"
  ON team_rosters FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'scorer')
    )
  );

CREATE POLICY "team_rosters_update_admin_scorer"
  ON team_rosters FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'scorer')
    )
  );

CREATE POLICY "team_rosters_delete_admin_scorer"
  ON team_rosters FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'scorer')
    )
  );

-- ===========================
-- GAMES
-- ===========================
CREATE POLICY "games_select_public"
  ON games FOR SELECT
  USING (true);

CREATE POLICY "games_insert_admin_scorer"
  ON games FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'scorer')
    )
  );

CREATE POLICY "games_update_admin_scorer"
  ON games FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'scorer')
    )
  );

CREATE POLICY "games_delete_admin_scorer"
  ON games FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'scorer')
    )
  );

-- ===========================
-- GAME_EVENTS
-- ===========================
CREATE POLICY "game_events_select_public"
  ON game_events FOR SELECT
  USING (true);

CREATE POLICY "game_events_insert_admin_scorer"
  ON game_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'scorer')
    )
  );

CREATE POLICY "game_events_update_admin_scorer"
  ON game_events FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'scorer')
    )
  );

CREATE POLICY "game_events_delete_admin_scorer"
  ON game_events FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'scorer')
    )
  );

-- ===========================
-- PROFILES
-- ===========================

-- Anyone can read profiles (public site)
CREATE POLICY "profiles_select_public"
  ON profiles FOR SELECT
  USING (true);

-- Users can insert their own profile (triggered on signup)
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their OWN profile, but NOT change their role.
-- We enforce "no role change" at the application layer + by granting
-- admin-only UPDATE on the role column via a separate policy.
-- This policy allows self-update for non-role fields.
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Prevent role escalation: role must remain unchanged for self-updates
    -- unless user is already an admin (handled by next policy).
    AND (
      role = (SELECT p.role FROM profiles p WHERE p.id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM profiles p2
        WHERE p2.id = auth.uid()
          AND p2.role = 'admin'
      )
    )
  );

-- Admins can update ANY profile (including changing roles)
CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Only admins can delete profiles
CREATE POLICY "profiles_delete_admin"
  ON profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );
