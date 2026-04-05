import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import type { Stamp, Collection } from './types'
import * as db from './stamps-db'
import { updateStreak } from './profile-db'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Recompute coverStampIds + stampCount from the actual stamps array */
function rebuildCollections(cols: Collection[], stamps: Stamp[]): Collection[] {
  return cols.map((col) => {
    if (col.id === 'all') {
      return {
        ...col,
        stampCount:    stamps.length,
        coverStampIds: stamps.slice(0, 4).map((s) => s.id),
      }
    }
    const cs = stamps.filter((s) => s.collectionId === col.id)
    return {
      ...col,
      stampCount:    cs.length,
      coverStampIds: cs.slice(0, 4).map((s) => s.id),
    }
  })
}

/** Build the full Collection[] from raw DB rows + stamps (adds virtual "All") */
function buildCollections(
  rawCols: db.RawCollection[],
  stamps: Stamp[],
): Collection[] {
  const userCols: Collection[] = rawCols.map((col) => {
    const cs = stamps.filter((s) => s.collectionId === col.id)
    return {
      ...col,
      stampCount:    cs.length,
      coverStampIds: cs.slice(0, 4).map((s) => s.id),
    }
  })

  const allCol: Collection = {
    id:            'all',
    name:          'All Stamps',
    stampCount:    stamps.length,
    coverStampIds: stamps.slice(0, 4).map((s) => s.id),
    createdAt:     new Date(0).toISOString(),
  }

  return [...userCols, allCol]
}

// ── Store interface ───────────────────────────────────────────────────────────

interface StampStore {
  // Auth
  user:    User | null
  setUser: (user: User | null) => void

  // Data
  collections: Collection[]
  stamps:      Stamp[]
  loading:     boolean

  // Actions
  loadStamps:       () => Promise<void>
  addStamp:         (stamp: Stamp) => Promise<void>
  deleteStamp:      (id: string) => Promise<void>
  moveToCollection: (stampId: string, collectionId: string) => Promise<void>
  toggleFavorite:   (stampId: string) => Promise<void>
  addCollection:    (name: string) => Promise<void>
  toggleDark:       () => void

  // UI
  selectedStampId:  string | null
  setSelectedStamp: (id: string | null) => void
  isDark:           boolean

  // Errors (visible in Toast)
  dbError:    string | null
  setDbError: (msg: string) => void
  clearError: () => void
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useStore = create<StampStore>((set, get) => ({
  // ── Auth ──────────────────────────────────────────────
  user:    null,
  setUser: (user) => set({ user }),

  // ── Data ──────────────────────────────────────────────
  collections: [],
  stamps:      [],
  loading:     false,

  // ── UI ────────────────────────────────────────────────
  selectedStampId:  null,
  isDark:           false,
  setSelectedStamp: (id) => set({ selectedStampId: id }),
  toggleDark:       () => set((s) => ({ isDark: !s.isDark })),

  // ── Errors ────────────────────────────────────────────
  dbError:    null,
  setDbError: (msg) => set({ dbError: msg }),
  clearError: () => set({ dbError: null }),

  // ── Load stamps + collections from Supabase ───────────
  loadStamps: async () => {
    set({ loading: true })
    try {
      const [rawCols, stamps] = await Promise.all([
        db.fetchCollections(),
        db.fetchStamps(),
      ])
      const collections = buildCollections(rawCols, stamps)
      set({ stamps, collections, loading: false })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('loadStamps error:', err)
      set({ loading: false, dbError: `Chargement échoué : ${msg}` })
    }
  },

  // ── Add stamp → optimistic + upload + insert ──────────
  addStamp: async (stamp) => {
    const { user } = get()
    if (!user) return

    // Optimistic: add locally, recompute collections
    set((s) => {
      const stamps = [stamp, ...s.stamps]
      return { stamps, collections: rebuildCollections(s.collections, stamps) }
    })

    try {
      const saved = await db.insertStamp(stamp, user.id)
      // Replace optimistic entry with real public URLs
      set((s) => ({
        stamps: s.stamps.map((st) => (st.id === stamp.id ? saved : st)),
      }))
      // Update streak (fire & forget)
      updateStreak(user.id).catch(console.error)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('addStamp error:', err)
      set((s) => {
        const stamps = s.stamps.filter((st) => st.id !== stamp.id)
        return { stamps, collections: rebuildCollections(s.collections, stamps), dbError: `Stamp non sauvegardé : ${msg}` }
      })
    }
  },

  // ── Delete stamp ──────────────────────────────────────
  deleteStamp: async (id) => {
    const { user } = get()
    set((s) => {
      const stamps = s.stamps.filter((st) => st.id !== id)
      return { stamps, collections: rebuildCollections(s.collections, stamps) }
    })
    if (user) {
      try { await db.deleteStamp(id, user.id) }
      catch (err) { console.error('deleteStamp error:', err) }
    }
  },

  // ── Move to collection ────────────────────────────────
  moveToCollection: async (stampId, newCollectionId) => {
    const stamp = get().stamps.find((s) => s.id === stampId)
    if (!stamp || stamp.collectionId === newCollectionId) return

    set((s) => {
      const stamps = s.stamps.map((st) =>
        st.id === stampId ? { ...st, collectionId: newCollectionId } : st,
      )
      return { stamps, collections: rebuildCollections(s.collections, stamps) }
    })
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

  // ── Add collection → optimistic + insert ─────────────
  addCollection: async (name) => {
    const { user } = get()
    if (!user) return

    const id        = `col-${Date.now()}`
    const createdAt = new Date().toISOString()
    const newCol: Collection = { id, name, coverStampIds: [], stampCount: 0, createdAt }

    // Optimistic: insert before the virtual "all" collection
    set((s) => ({
      collections: [
        ...s.collections.filter((c) => c.id !== 'all'),
        newCol,
        ...s.collections.filter((c) => c.id === 'all'),
      ],
    }))

    try {
      await db.insertCollection(id, name, user.id)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('addCollection error:', err)
      set((s) => ({
        collections: s.collections.filter((c) => c.id !== id),
        dbError: `Collection non sauvegardée : ${msg}`,
      }))
    }
  },
}))
