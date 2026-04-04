import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import type { Stamp, Collection } from './types'
import { mockCollections } from './mockData'
import * as db from './stamps-db'

interface StampStore {
  // Auth
  user:     User | null
  setUser:  (user: User | null) => void

  // Data
  collections:  Collection[]
  stamps:       Stamp[]
  loading:      boolean

  // Actions
  loadStamps:       () => Promise<void>
  addStamp:         (stamp: Stamp) => Promise<void>
  deleteStamp:      (id: string) => Promise<void>
  moveToCollection: (stampId: string, collectionId: string) => Promise<void>
  toggleFavorite:   (stampId: string) => Promise<void>
  addCollection:    (name: string) => void
  toggleDark:       () => void

  // UI
  selectedStampId: string | null
  setSelectedStamp: (id: string | null) => void
  isDark: boolean
}

export const useStore = create<StampStore>((set, get) => ({
  // ── Auth ──────────────────────────────────────────────
  user:    null,
  setUser: (user) => set({ user }),

  // ── Data ──────────────────────────────────────────────
  collections: mockCollections,
  stamps:      [],
  loading:     false,

  // ── UI ────────────────────────────────────────────────
  selectedStampId:  null,
  isDark:           false,
  setSelectedStamp: (id) => set({ selectedStampId: id }),
  toggleDark:       () => set((s) => ({ isDark: !s.isDark })),

  // ── Load stamps from Supabase ─────────────────────────
  loadStamps: async () => {
    set({ loading: true })
    try {
      const stamps = await db.fetchStamps()
      set({ stamps, loading: false })
    } catch (err) {
      console.error('loadStamps error:', err)
      set({ loading: false })
    }
  },

  // ── Add stamp → upload + insert ───────────────────────
  addStamp: async (stamp) => {
    const { user } = get()
    if (!user) return

    // Optimistic: add locally immediately so UI feels instant
    set((s) => ({
      stamps: [stamp, ...s.stamps],
      collections: s.collections.map((c) => {
        if (c.id === stamp.collectionId || c.id === 'all') {
          return {
            ...c,
            stampCount: c.stampCount + 1,
            coverStampIds:
              c.coverStampIds.length < 4
                ? [...c.coverStampIds, stamp.id]
                : c.coverStampIds,
          }
        }
        return c
      }),
    }))

    try {
      // Upload images + persist to DB; get back the real public URLs
      const saved = await db.insertStamp(stamp, user.id)
      // Replace the optimistic entry with the real one (public image URLs)
      set((s) => ({
        stamps: s.stamps.map((st) => (st.id === stamp.id ? saved : st)),
      }))
    } catch (err) {
      console.error('addStamp error:', err)
      // Rollback optimistic update on failure
      set((s) => ({
        stamps: s.stamps.filter((st) => st.id !== stamp.id),
      }))
    }
  },

  // ── Delete stamp ──────────────────────────────────────
  deleteStamp: async (id) => {
    const { user } = get()
    // Optimistic remove
    set((s) => ({
      stamps: s.stamps.filter((st) => st.id !== id),
      collections: s.collections.map((c) => ({
        ...c,
        stampCount: c.coverStampIds.includes(id)
          ? Math.max(0, c.stampCount - 1)
          : c.stampCount,
        coverStampIds: c.coverStampIds.filter((sid) => sid !== id),
      })),
    }))
    if (user) {
      try { await db.deleteStamp(id, user.id) }
      catch (err) { console.error('deleteStamp error:', err) }
    }
  },

  // ── Move to collection ────────────────────────────────
  moveToCollection: async (stampId, newCollectionId) => {
    const stamp = get().stamps.find((s) => s.id === stampId)
    if (!stamp || stamp.collectionId === newCollectionId) return

    const oldId = stamp.collectionId
    set((s) => ({
      stamps: s.stamps.map((st) =>
        st.id === stampId ? { ...st, collectionId: newCollectionId } : st,
      ),
      collections: s.collections.map((c) => {
        if (c.id === oldId)
          return { ...c, stampCount: Math.max(0, c.stampCount - 1), coverStampIds: c.coverStampIds.filter((id) => id !== stampId) }
        if (c.id === newCollectionId)
          return { ...c, stampCount: c.stampCount + 1, coverStampIds: c.coverStampIds.length < 4 ? [...c.coverStampIds, stampId] : c.coverStampIds }
        return c
      }),
    }))
    try { await db.updateStamp(stampId, { collection_id: newCollectionId }) }
    catch (err) { console.error('moveToCollection error:', err) }
  },

  // ── Toggle favorite ───────────────────────────────────
  toggleFavorite: async (stampId) => {
    const stamp = get().stamps.find((s) => s.id === stampId)
    if (!stamp) return
    const newVal = !stamp.favorite
    set((s) => ({
      stamps: s.stamps.map((st) =>
        st.id === stampId ? { ...st, favorite: newVal } : st,
      ),
    }))
    try { await db.updateStamp(stampId, { favorite: newVal }) }
    catch (err) { console.error('toggleFavorite error:', err) }
  },

  // ── Add collection (local only for now) ───────────────
  addCollection: (name) =>
    set((s) => ({
      collections: [
        {
          id: `col-${Date.now()}`,
          name,
          coverStampIds: [],
          stampCount: 0,
          createdAt: new Date().toISOString(),
        },
        ...s.collections,
      ],
    })),
}))
