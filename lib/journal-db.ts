import { createClient } from '@/lib/supabase/client'

export interface JournalEntry {
  id: string
  userId: string
  entryDate: string          // 'YYYY-MM-DD'
  stampId: string | null
  note: string | null
  stampThumbnailUrl: string | null
  stampDominantColor: string | null
  createdAt: string
}

function toEntry(r: Record<string, unknown>): JournalEntry {
  return {
    id:                 r.id as string,
    userId:             r.user_id as string,
    entryDate:          r.entry_date as string,
    stampId:            (r.stamp_id as string | null) ?? null,
    note:               (r.note as string | null) ?? null,
    stampThumbnailUrl:  (r.stamp_thumbnail_url as string | null) ?? null,
    stampDominantColor: (r.stamp_dominant_color as string | null) ?? null,
    createdAt:          r.created_at as string,
  }
}

export async function getJournalEntriesForYear(
  userId: string,
  year: number,
): Promise<JournalEntry[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId)
    .gte('entry_date', `${year}-01-01`)
    .lte('entry_date', `${year}-12-31`)
    .order('entry_date', { ascending: true })

  if (error) throw error
  return (data ?? []).map(toEntry)
}

export async function upsertJournalEntry(
  entry: Omit<JournalEntry, 'id' | 'createdAt'>,
): Promise<JournalEntry> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('journal_entries')
    .upsert(
      {
        user_id:             entry.userId,
        entry_date:          entry.entryDate,
        stamp_id:            entry.stampId,
        note:                entry.note,
        stamp_thumbnail_url: entry.stampThumbnailUrl,
        stamp_dominant_color: entry.stampDominantColor,
      },
      { onConflict: 'user_id,entry_date' },
    )
    .select()
    .single()

  if (error) throw error
  return toEntry(data as Record<string, unknown>)
}

export async function deleteJournalEntry(
  userId: string,
  entryDate: string,
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('journal_entries')
    .delete()
    .eq('user_id', userId)
    .eq('entry_date', entryDate)

  if (error) throw error
}
