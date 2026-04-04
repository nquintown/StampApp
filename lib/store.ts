import { create } from 'zustand'
import type { Stamp, Collection } from './types'
import { mockStamps, mockCollections } from './mockData'

interface StampStore {
  collections: Collection[]
  stamps: Stamp[]
  selectedStampId: string | null
  isDark: boolean
  setSelectedStamp: (id: string | null) => void
  addStamp: (stamp: Stamp) => void
  deleteStamp: (id: string) => void
  moveToCollection: (stampId: string, collectionId: string) => void
  toggleFavorite: (stampId: string) => void
  toggleDark: () => void
  addCollection: (name: string) => void
}

export const useStore = create<StampStore>((set) => ({
  collections: mockCollections,
  stamps: mockStamps,
  selectedStampId: null,
  isDark: false,
  setSelectedStamp: (id) => set({ selectedStampId: id }),

  toggleDark: () => set((state) => ({ isDark: !state.isDark })),

  addCollection: (name) =>
    set((state) => {
      const newCollection: Collection = {
        id: `col-${Date.now()}`,
        name,
        coverStampIds: [],
        stampCount: 0,
        createdAt: new Date().toISOString(),
      }
      return { collections: [newCollection, ...state.collections] }
    }),

  addStamp: (stamp) =>
    set((state) => {
      const updatedCollections = state.collections.map((c) => {
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
      })
      return { stamps: [stamp, ...state.stamps], collections: updatedCollections }
    }),

  deleteStamp: (id) =>
    set((state) => ({
      stamps: state.stamps.filter((s) => s.id !== id),
      collections: state.collections.map((c) => ({
        ...c,
        stampCount: c.coverStampIds.includes(id) ? c.stampCount - 1 : c.stampCount,
        coverStampIds: c.coverStampIds.filter((sid) => sid !== id),
      })),
    })),

  moveToCollection: (stampId, newCollectionId) =>
    set((state) => {
      const stamp = state.stamps.find((s) => s.id === stampId)
      if (!stamp || stamp.collectionId === newCollectionId) return state
      const oldId = stamp.collectionId
      return {
        stamps: state.stamps.map((s) =>
          s.id === stampId ? { ...s, collectionId: newCollectionId } : s
        ),
        collections: state.collections.map((c) => {
          // Remove from old collection
          if (c.id === oldId) {
            return {
              ...c,
              stampCount: Math.max(0, c.stampCount - 1),
              coverStampIds: c.coverStampIds.filter((id) => id !== stampId),
            }
          }
          // Add to new collection
          if (c.id === newCollectionId) {
            return {
              ...c,
              stampCount: c.stampCount + 1,
              coverStampIds:
                c.coverStampIds.length < 4
                  ? [...c.coverStampIds, stampId]
                  : c.coverStampIds,
            }
          }
          return c
        }),
      }
    }),

  toggleFavorite: (stampId) =>
    set((state) => ({
      stamps: state.stamps.map((s) =>
        s.id === stampId ? { ...s, favorite: !s.favorite } : s
      ),
    })),
}))
