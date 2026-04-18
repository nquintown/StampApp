-- Allow collection members to read stamps in their shared collections
-- Run this in the Supabase SQL editor

-- Drop the existing SELECT policy on stamps (adjust name if different)
DROP POLICY IF EXISTS "Users can view own stamps" ON stamps;
DROP POLICY IF EXISTS "Users can read own stamps" ON stamps;

-- New SELECT policy: own stamps + stamps in collections where user is a member
CREATE POLICY "Users can view own and shared collection stamps"
ON stamps FOR SELECT
USING (
  auth.uid() = user_id
  OR (
    collection_id IS NOT NULL
    AND collection_id IN (
      SELECT collection_id FROM collection_members WHERE user_id = auth.uid()
    )
  )
);
