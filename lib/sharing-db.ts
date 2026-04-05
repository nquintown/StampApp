import { createClient } from '@/lib/supabase/client'

// ── Types ─────────────────────────────────────────────────

export interface SharedStampRecord {
  id:                   string
  senderId:             string
  recipientId:          string
  stampId:              string
  stampTitle:           string | null
  stampThumbnailUrl:    string | null
  stampImageUrl:        string | null
  stampDominantColor:   string | null
  stampCreatedAt:       string | null   // original stamp creation date
  stampLocation:        string | null   // original stamp location label
  message:              string | null
  seen:                 boolean
  createdAt:            string
  senderUsername:       string | null
  senderFullName:       string | null
  senderAvatarUrl:      string | null
}

// ── Send ──────────────────────────────────────────────────

export async function shareStamp(
  senderId:    string,
  recipientId: string,
  stamp: {
    id:             string
    title:          string
    thumbnailUrl:   string
    imageUrl:       string
    dominantColor?: string
    createdAt?:     string
    location?:      string | null
  },
  message?: string,
): Promise<boolean> {
  try {
    const supabase = createClient()
    const { error } = await supabase.from('shared_stamps').insert({
      sender_id:            senderId,
      recipient_id:         recipientId,
      stamp_id:             stamp.id,
      stamp_title:          stamp.title,
      stamp_thumbnail_url:  stamp.thumbnailUrl,
      stamp_image_url:      stamp.imageUrl,
      stamp_dominant_color: stamp.dominantColor ?? null,
      stamp_created_at:     stamp.createdAt     ?? null,
      stamp_location:       stamp.location       ?? null,
      message:              message ?? null,
      seen:                 false,
    })
    return !error
  } catch {
    return false
  }
}

// ── Receive ───────────────────────────────────────────────

export async function getReceivedShares(userId: string): Promise<SharedStampRecord[]> {
  try {
    const supabase = createClient()

    const { data: rows, error } = await supabase
      .from('shared_stamps')
      .select('*')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })

    if (error || !rows || rows.length === 0) return []

    // Fetch sender profiles in one query
    const senderIds = [...new Set(rows.map((r) => r.sender_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .in('id', senderIds)

    const senderMap = new Map<string, { username: string | null; full_name: string | null; avatar_url: string | null }>()
    for (const p of profiles ?? []) {
      senderMap.set(p.id, { username: p.username, full_name: p.full_name, avatar_url: p.avatar_url })
    }

    return rows.map((r) => {
      const sender = senderMap.get(r.sender_id)
      return {
        id:                   r.id,
        senderId:             r.sender_id,
        recipientId:          r.recipient_id,
        stampId:              r.stamp_id,
        stampTitle:           r.stamp_title          ?? null,
        stampThumbnailUrl:    r.stamp_thumbnail_url  ?? null,
        stampImageUrl:        r.stamp_image_url      ?? null,
        stampDominantColor:   r.stamp_dominant_color ?? null,
        stampCreatedAt:       r.stamp_created_at     ?? null,
        stampLocation:        r.stamp_location       ?? null,
        message:              r.message              ?? null,
        seen:                 r.seen                 ?? false,
        createdAt:            r.created_at,
        senderUsername:       sender?.username       ?? null,
        senderFullName:       sender?.full_name      ?? null,
        senderAvatarUrl:      sender?.avatar_url     ?? null,
      }
    })
  } catch {
    return []
  }
}

export async function markShareSeen(shareId: string): Promise<void> {
  try {
    const supabase = createClient()
    await supabase.from('shared_stamps').update({ seen: true }).eq('id', shareId)
  } catch { /* silent */ }
}

export async function markAllSharesSeen(userId: string): Promise<void> {
  try {
    const supabase = createClient()
    await supabase
      .from('shared_stamps')
      .update({ seen: true })
      .eq('recipient_id', userId)
      .eq('seen', false)
  } catch { /* silent */ }
}

export async function getUnseenCount(userId: string): Promise<number> {
  try {
    const supabase = createClient()
    const { count, error } = await supabase
      .from('shared_stamps')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('seen', false)
    if (error) return 0
    return count ?? 0
  } catch {
    return 0
  }
}

export async function getShareById(shareId: string, userId: string): Promise<SharedStampRecord | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('shared_stamps')
      .select('*')
      .eq('id', shareId)
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .single()
    if (error || !data) return null

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .eq('id', data.sender_id)
      .single()

    return {
      id:                   data.id,
      senderId:             data.sender_id,
      recipientId:          data.recipient_id,
      stampId:              data.stamp_id,
      stampTitle:           data.stamp_title          ?? null,
      stampThumbnailUrl:    data.stamp_thumbnail_url  ?? null,
      stampImageUrl:        data.stamp_image_url      ?? null,
      stampDominantColor:   data.stamp_dominant_color ?? null,
      stampCreatedAt:       data.stamp_created_at     ?? null,
      stampLocation:        data.stamp_location       ?? null,
      message:              data.message              ?? null,
      seen:                 data.seen                 ?? false,
      createdAt:            data.created_at,
      senderUsername:       profile?.username         ?? null,
      senderFullName:       profile?.full_name        ?? null,
      senderAvatarUrl:      profile?.avatar_url       ?? null,
    }
  } catch {
    return null
  }
}
