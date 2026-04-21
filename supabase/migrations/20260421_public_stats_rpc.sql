-- Public stats RPC — bypasses RLS, returns only aggregate counts (not raw data)
-- Run this in the Supabase SQL editor

CREATE OR REPLACE FUNCTION public.get_user_public_stats(p_user_id uuid)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'stamp_count',      (SELECT COUNT(*) FROM stamps      WHERE user_id = p_user_id),
    'collection_count', (SELECT COUNT(*) FROM collections WHERE user_id = p_user_id)
  );
$$;

-- Allow any authenticated user to call this function
GRANT EXECUTE ON FUNCTION public.get_user_public_stats(uuid) TO authenticated;
