export type StampLocation = {
  lat: number
  lng: number
  label?: string   // e.g. "Paris, France"
}

export type PhotoTransform = {
  x: number
  y: number
  scale: number
  rotation: number
}

export type Stamp = {
  id: string
  title: string
  imageUrl: string
  thumbnailUrl: string
  createdAt: string
  sourceType: 'image' | 'video-frame' | 'camera' | 'import'
  sourceLabel?: string
  collectionId: string
  tags?: string[]
  dominantColor?: string
  favorite?: boolean
  location?: StampLocation
  photoTransform?: PhotoTransform   // pan/zoom/rotate saved at cut time
  ownerId?: string   // set when stamp belongs to another user (shared collection)
}

export type Collection = {
  id: string
  name: string
  coverStampIds: string[]
  stampCount: number
  createdAt: string
}
