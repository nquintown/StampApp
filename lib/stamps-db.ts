import { createClient } from '@/lib/supabase/client'
import type { Stamp } from '@/lib/types'

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
