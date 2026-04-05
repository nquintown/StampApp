import { createClient } from '@/lib/supabase/client'

export interface Profile {
  id:            string
  username:      string | null
  fullName:      string | null
  avatarUrl:     string | null
  streak:        number
  lastStampDate: string | null
  createdAt:     string
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, streak, last_stamp_date, created_at')
      .eq('id', userId)
      .single()

    if (error || !data) return null

    return {
      id:            data.id,
      username:      data.username        ?? null,
      fullName:      data.full_name       ?? null,
      avatarUrl:     data.avatar_url      ?? null,
      streak:        data.streak          ?? 0,
      lastStampDate: data.last_stamp_date ?? null,
      createdAt:     data.created_at,
    }
  } catch {
    return null
  }
}

// ── Upload avatar to storage + save URL to profile ────────
export async function uploadAvatar(userId: string, file: File): Promise<string | null> {
  try {
    const supabase = createClient()
    const ext  = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const path = `${userId}/avatar.${ext}`

    // Upload (upsert = overwrite if exists)
    const { error: upError } = await supabase.storage
      .from('stamp-images')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (upError) throw upError

    // Get public URL
    const { data } = supabase.storage
      .from('stamp-images')
      .getPublicUrl(path)

    const url = data.publicUrl

    // Persist to profile row
    await supabase.from('profiles').upsert({ id: userId, avatar_url: url })

    return url
  } catch (err) {
    console.error('uploadAvatar error:', err)
    return null
  }
}

// ── Update streak when a stamp is created ─────────────────
export async function updateStreak(userId: string): Promise<number> {
  try {
    const supabase = createClient()

    const { data: profile } = await supabase
      .from('profiles')
      .select('streak, last_stamp_date')
      .eq('id', userId)
      .single()

    const today     = new Date().toISOString().split('T')[0]  // YYYY-MM-DD
    const lastDate  = profile?.last_stamp_date as string | null

    // Already stamped today → no change
    if (lastDate === today) return profile?.streak ?? 1

    // Check if yesterday was the last stamp (consecutive)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    const newStreak = lastDate === yesterdayStr ? (profile?.streak ?? 0) + 1 : 1

    await supabase.from('profiles').upsert({
      id:             userId,
      streak:         newStreak,
      last_stamp_date: today,
    })

    return newStreak
  } catch {
    return 0
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
