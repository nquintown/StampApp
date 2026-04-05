import { createClient } from '@/lib/supabase/client'

export interface Profile {
  id:        string
  username:  string | null
  fullName:  string | null
  createdAt: string
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, created_at')
      .eq('id', userId)
      .single()

    if (error || !data) return null

    return {
      id:        data.id,
      username:  data.username  ?? null,
      fullName:  data.full_name ?? null,
      createdAt: data.created_at,
    }
  } catch {
    return null
  }
}

export async function upsertProfile(
  userId: string,
  updates: { username?: string; fullName?: string },
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('profiles').upsert({
    id:        userId,
    username:  updates.username  ?? null,
    full_name: updates.fullName  ?? null,
  })
  if (error) throw error
}

export async function signOut(): Promise<void> {
  const supabase = createClient()
  await supabase.auth.signOut()
}
