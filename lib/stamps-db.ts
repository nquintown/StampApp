import { createClient } from '@/lib/supabase/client'
import type { Stamp, Collection } from '@/lib/types'

export type RawCollection = Pick<Collection, 'id' | 'name' | 'createdAt'>

// ── Helpers ──────────────────────────────────────────────────────────────────

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
  const binary = atob(data)
  const arr = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i)
  return new Blob([arr], { type: mime })
}

function isDataUrl(url: string) {
  return url.startsWith('data:')
}

// ── Storage ───────────────────────────────────────────────────────────────────

export async function uploadImage(
  userId: string,
  stampId: string,
  dataUrl: string,
  suffix: 'full' | 'thumb',
): Promise<string> {
  const supabase = createClient()
  const blob = dataUrlToBlob(dataUrl)
  const path = `${userId}/${stampId}-${suffix}.jpg`

  const { error } = await supabase.storage
    .from('stamp-images')
    .upload(path, blob, { contentType: 'image/jpeg', upsert: true })

  if (error) throw error

  const { data } = supabase.storage.from('stamp-images').getPublicUrl(path)
  return data.publicUrl
}

async function removeImages(userId: string, stampId: string) {
  const supabase = createClient()
  await supabase.storage.from('stamp-images').remove([
    `${userId}/${stampId}-full.jpg`,
    `${userId}/${stampId}-thumb.jpg`,
  ])
}

// ── Database ──────────────────────────────────────────────────────────────────

export async function fetchStamps(): Promise<Stamp[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('stamps')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map(r => ({
    id:             r.id,
    title:          r.title,
    imageUrl:       r.image_url,
    thumbnailUrl:   r.thumbnail_url ?? r.image_url,
    createdAt:      r.created_at,
    sourceType:     r.source_type,
    sourceLabel:    r.source_label ?? undefined,
    collectionId:   r.collection_id,
    tags:           r.tags ?? [],
    dominantColor:  r.dominant_color ?? undefined,
    favorite:       r.favorite ?? false,
    location:       r.location ?? undefined,
    photoTransform: r.photo_transform ?? undefined,
  }))
}

export async function insertStamp(stamp: Stamp, userId: string): Promise<Stamp> {
  const supabase = createClient()

  // Upload images if they are still base64 data URLs
  let imageUrl       = stamp.imageUrl
  let thumbnailUrl   = stamp.thumbnailUrl

  if (isDataUrl(imageUrl)) {
    imageUrl = await uploadImage(userId, stamp.id, imageUrl, 'full')
  }
  if (isDataUrl(thumbnailUrl)) {
    thumbnailUrl = await uploadImage(userId, stamp.id, thumbnailUrl, 'thumb')
  }

  const { error } = await supabase.from('stamps').insert({
    id:             stamp.id,
    user_id:        userId,
    title:          stamp.title,
    image_url:      imageUrl,
    thumbnail_url:  thumbnailUrl,
    created_at:     stamp.createdAt,
    source_type:    stamp.sourceType,
    source_label:   stamp.sourceLabel ?? null,
    collection_id:  stamp.collectionId,
    tags:           stamp.tags ?? [],
    dominant_color: stamp.dominantColor ?? null,
    favorite:       stamp.favorite ?? false,
    location:       stamp.location ?? null,
    photo_transform: stamp.photoTransform ?? null,
  })

  if (error) throw error

  return { ...stamp, imageUrl, thumbnailUrl }
}

export async function deleteStamp(stampId: string, userId: string): Promise<void> {
  const supabase = createClient()
  await removeImages(userId, stampId)
  const { error } = await supabase.from('stamps').delete().eq('id', stampId)
  if (error) throw error
}

export async function updateStamp(
  stampId: string,
  updates: { favorite?: boolean; collection_id?: string; title?: string },
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('stamps').update(updates).eq('id', stampId)
  if (error) throw error
}

// ── Collections ───────────────────────────────────────────────────────────────

export async function fetchCollections(): Promise<RawCollection[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('collections')
    .select('id, name, created_at')
    .order('created_at', { ascending: true })

  if (error) throw error

  return (data ?? []).map((r) => ({
    id:        r.id,
    name:      r.name,
    createdAt: r.created_at,
  }))
}

export async function insertCollection(
  id: string,
  name: string,
  userId: string,
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('collections').insert({
    id,
    user_id:    userId,
    name,
    created_at: new Date().toISOString(),
  })
  if (error) throw error
}

export async function deleteCollection(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('collections').delete().eq('id', id)
  if (error) throw error
}

export async function updateCollection(
  id: string,
  updates: { name?: string },
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('collections').update(updates).eq('id', id)
  if (error) throw error
}

// ── Public stats for a friend ─────────────────────────────

export async function fetchFriendPublicStats(friendUserId: string): Promise<{
  stampCount:      number
  collectionCount: number
}> {
  try {
    const supabase = createClient()
    const [stampsRes, colsRes] = await Promise.all([
      supabase.from('stamps').select('id', { count: 'exact', head: true }).eq('user_id', friendUserId),
      supabase.from('collections').select('id', { count: 'exact', head: true }).eq('user_id', friendUserId),
    ])
    return {
      stampCount:      stampsRes.count  ?? 0,
      collectionCount: colsRes.count    ?? 0,
    }
  } catch {
    return { stampCount: 0, collectionCount: 0 }
  }
}

/** Collections shared between two users (one is owner, other is member or vice-versa) */
export async function fetchCommonCollections(
  myId: string,
  friendId: string,
): Promise<RawCollection[]> {
  try {
    const supabase = createClient()
    // Collections owned by friend that I'm a member of
    const { data: asGuest } = await supabase
      .from('collection_members')
      .select('collection_id, collections(id, name, created_at)')
      .eq('user_id', myId)

    // Collections I own that friend is a member of
    const { data: asHost } = await supabase
      .from('collection_members')
      .select('collection_id, collections(id, name, created_at)')
      .eq('user_id', friendId)
      .eq('invited_by', myId)

    const all = [...(asGuest ?? []), ...(asHost ?? [])]
    const seen = new Set<string>()
    return all
      .map((row: Record<string, unknown>) => {
        const col = row.collections as Record<string, unknown> | null
        if (!col) return null
        return { id: col.id as string, name: col.name as string, createdAt: col.created_at as string }
      })
      .filter((c): c is RawCollection => c !== null && !seen.has(c.id) && (seen.add(c.id), true))
  } catch {
    return []
  }
}

// ── Collection members (shared collections) ───────────────

/** Add a member to a collection. `invitedBy` must be the collection owner's userId. */
export async function insertCollectionMember(
  collectionId: string,
  userId: string,
  invitedBy: string,
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('collection_members').insert({
    collection_id: collectionId,
    user_id:       userId,
    invited_by:    invitedBy,
  })
  // Ignore duplicate (user already member)
  if (error && !error.message.includes('unique')) throw error
}

/** Fetch collections the current user is a member of (not owner of). */
export async function fetchSharedCollections(): Promise<RawCollection[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('collection_members')
    .select('collection_id, collections(id, name, created_at)')
    .order('created_at', { ascending: true })

  if (error) throw error

  return (data ?? [])
    .map((row: Record<string, unknown>) => {
      const col = row.collections as Record<string, unknown> | null
      if (!col) return null
      return {
        id:        col.id as string,
        name:      col.name as string,
        createdAt: col.created_at as string,
      }
    })
    .filter((c): c is RawCollection => c !== null)
}

/** Get member user IDs for a collection. */
export async function fetchCollectionMembers(
  collectionId: string,
): Promise<string[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('collection_members')
    .select('user_id')
    .eq('collection_id', collectionId)

  if (error) return []
  return (data ?? []).map((r: { user_id: string }) => r.user_id)
}
