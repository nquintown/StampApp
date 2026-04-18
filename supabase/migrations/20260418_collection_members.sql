-- ── collection_members ────────────────────────────────────
-- Tracks which users are invited members of a collection.
-- The collection owner (collections.user_id) can invite friends.
-- Members can see the collection and add their own stamps to it.

CREATE TABLE IF NOT EXISTS collection_members (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id  TEXT        NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  user_id        UUID        NOT NULL REFERENCES auth.users(id)  ON DELETE CASCADE,
  invited_by     UUID        NOT NULL REFERENCES auth.users(id)  ON DELETE CASCADE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (collection_id, user_id)
);

ALTER TABLE collection_members ENABLE ROW LEVEL SECURITY;

-- Members can see rows where they are invited or where they did the inviting
CREATE POLICY "collection_members_select" ON collection_members
  FOR SELECT USING (
    user_id    = auth.uid() OR
    invited_by = auth.uid()
  );

-- Only the inviter (collection owner) can insert
CREATE POLICY "collection_members_insert" ON collection_members
  FOR INSERT WITH CHECK (invited_by = auth.uid());

-- Owner or member can remove a membership
CREATE POLICY "collection_members_delete" ON collection_members
  FOR DELETE USING (
    user_id    = auth.uid() OR
    invited_by = auth.uid()
  );

-- ── Allow members to read shared collections ──────────────
-- Drop existing select policy if it only allows owner
DROP POLICY IF EXISTS "Users can view own collections" ON collections;

CREATE POLICY "collections_select" ON collections
  FOR SELECT USING (
    user_id = auth.uid()
    OR id IN (
      SELECT collection_id FROM collection_members WHERE user_id = auth.uid()
    )
  );
