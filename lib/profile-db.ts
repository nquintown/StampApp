import { createClient } from '@/lib/supabase/client'

export interface Profile {
  id:            string
  username:      string | null
  fullName:      string | null
  avatarUrl:     string | null
  email:         string | null
  streak:        number
  lastStampDate: string | null
  createdAt:     string
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, email, streak, last_stamp_date, created_at')
      .eq('id', userId)
      .single()

    if (error || !data) return null

    return {
      id:            data.id,
      username:      data.username        ?? null,
      fullName:      data.full_name       ?? null,
      avatarUrl:     data.avatar_url      ?? null,
      email:         data.email           ?? null,
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

// ── Local date string (YYYY-MM-DD) — avoids UTC timezone shift ──
function localDateStr(d = new Date()): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}

function localYesterdayStr(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return localDateStr(d)
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

    const today    = localDateStr()
    const lastDate = profile?.last_stamp_date as string | null

    // Already stamped today → no change
    if (lastDate === today) return profile?.streak ?? 1

    // Consecutive if last stamp was yesterday
    const newStreak = lastDate === localYesterdayStr()
      ? (profile?.streak ?? 0) + 1
      : 1

    await supabase.from('profiles').upsert({
      id:              userId,
      streak:          newStreak,
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

// ── Check if a username is available ─────────────────────
export async function checkUsernameAvailable(username: string): Promise<boolean> {
  try {
    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.toLowerCase().trim())
      .maybeSingle()
    return data === null
  } catch {
    return true // assume available if error
  }
}

export async function signOut(): Promise<void> {
  const supabase = createClient()
  await supabase.auth.signOut()
}
