export type ImageRef = {
  id: string
  url: string
  publicId?: string
  width?: number
  height?: number
}

export type Stat = { key: string; value: string }

export type Theme = { bgColor?: string; bgImageUrl?: string }

export type Album = {
  id: string
  name: string
  order: number
  createdAt: number
  theme?: Theme
}

export type Item = {
  id: string
  title: string
  albumIds: string[]
  tags: string[]
  stats: Stat[]
  body: string
  images: ImageRef[]
  coverIndex: number
  order: number
  bgImageUrl?: string
  createdAt: number
  updatedAt: number
}

export type Settings = Theme

export type Backend = {
  mode: 'firebase' | 'demo'
  subscribe(cb: (s: { albums: Album[]; items: Item[]; settings: Settings }) => void): () => void
  addAlbum(a: Omit<Album, 'id'>): Promise<string>
  updateAlbum(id: string, patch: Partial<Album>): Promise<void>
  deleteAlbum(id: string): Promise<void>
  addItem(i: Omit<Item, 'id'>): Promise<string>
  updateItems(patches: { id: string; patch: Partial<Item> }[]): Promise<void>
  deleteItems(ids: string[]): Promise<void>
  saveSettings(s: Settings): Promise<void>
  uploadImage(file: File): Promise<ImageRef>
}
