import { createClient } from '@/lib/supabase/client'

// ── Types ─────────────────────────────────────────────────

export interface FriendUser {
  userId:     string
  username:   string | null
  fullName:   string | null
  avatarUrl:  string | null
  email:      string | null
  stampCount: number
}

export type FriendshipStatus = 'none' | 'sent' | 'received' | 'friend'

export interface FriendRequest {
  id:         string
  status:     'pending' | 'accepted'
  createdAt:  string
  friend:     FriendUser
  isSentByMe: boolean
}

export interface SearchResult {
  user:         FriendUser
  friendshipId: string | null
  status:       FriendshipStatus
}

// ── Helpers ───────────────────────────────────────────────

function rowToFriendUser(r: Record<string, unknown>, stampCount = 0): FriendUser {
  return {
    userId:     r.id as string,
    username:   (r.username as string) ?? null,
    fullName:   (r.full_name as string) ?? null,
    avatarUrl:  (r.avatar_url as string) ?? null,
    email:      (r.email as string) ?? null,
    stampCount,
  }
}

// ── Search ────────────────────────────────────────────────

export async function searchUsers(
  query: string,
  currentUserId: string,
): Promise<SearchResult[]> {
  try {
    const supabase = createClient()
    const q = query.trim()
    if (!q) return []

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, email')
      .or(`username.ilike.%${q}%,full_name.ilike.%${q}%,email.ilike.%${q}%`)
      .neq('id', currentUserId)
      .limit(15)

    if (error || !profiles) return []

    // Get existing friendships involving current user
    const { data: friendships } = await supabase
      .from('friendships')
      .select('id, requester_id, addressee_id, status')
      .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`)

    const friendshipMap = new Map<string, { id: string; status: string; isSentByMe: boolean }>()
    for (const f of friendships ?? []) {
      const otherId = f.requester_id === currentUserId ? f.addressee_id : f.requester_id
      const isSentByMe = f.requester_id === currentUserId
      friendshipMap.set(otherId, { id: f.id, status: f.status, isSentByMe })
    }

    return profiles.map((p) => {
      const f = friendshipMap.get(p.id)
      let status: FriendshipStatus = 'none'
      if (f) {
        if (f.status === 'accepted') status = 'friend'
        else if (f.isSentByMe)       status = 'sent'
        else                          status = 'received'
      }
      return {
        user:         rowToFriendUser(p),
        friendshipId: f?.id ?? null,
        status,
      }
    })
  } catch {
    return []
  }
}

// ── Requests ──────────────────────────────────────────────

export async function sendFriendRequest(
  requesterId: string,
  addresseeId: string,
): Promise<{ friendshipId: string } | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('friendships')
      .insert({ requester_id: requesterId, addressee_id: addresseeId, status: 'pending' })
      .select('id')
      .single()
    if (error) return null
    return { friendshipId: data.id }
  } catch {
    return null
  }
}

export async function acceptFriendRequest(friendshipId: string): Promise<boolean> {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId)
    return !error
  } catch {
    return false
  }
}

export async function deleteFriendship(friendshipId: string): Promise<boolean> {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId)
    return !error
  } catch {
    return false
  }
}

// ── List ──────────────────────────────────────────────────

export async function getFriendships(userId: string): Promise<FriendRequest[]> {
  try {
    const supabase = createClient()

    const { data: rows, error } = await supabase
      .from('friendships')
      .select('id, requester_id, addressee_id, status, created_at')
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (error || !rows) return []

    // Collect the other user IDs
    const otherIds = rows.map((r) =>
      r.requester_id === userId ? r.addressee_id : r.requester_id,
    )

    if (otherIds.length === 0) return []

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, email')
      .in('id', otherIds)

    const profileMap = new Map<string, Record<string, unknown>>()
    for (const p of profiles ?? []) profileMap.set(p.id, p)

    return rows.map((r) => {
      const isSentByMe = r.requester_id === userId
      const otherId    = isSentByMe ? r.addressee_id : r.requester_id
      const profile    = profileMap.get(otherId) ?? { id: otherId }
      return {
        id:         r.id,
        status:     r.status as 'pending' | 'accepted',
        createdAt:  r.created_at,
        isSentByMe,
        friend:     rowToFriendUser(profile),
      }
    })
  } catch {
    return []
  }
}

export async function getFriends(userId: string): Promise<FriendUser[]> {
  const all = await getFriendships(userId)
  return all.filter((f) => f.status === 'accepted').map((f) => f.friend)
}

// ── Pending received count (for badge) ────────────────────
export async function getPendingCount(userId: string): Promise<number> {
  try {
    const supabase = createClient()
    const { count, error } = await supabase
      .from('friendships')
      .select('id', { count: 'exact', head: true })
      .eq('addressee_id', userId)
      .eq('status', 'pending')
    if (error) return 0
    return count ?? 0
  } catch {
    return 0
  }
}
