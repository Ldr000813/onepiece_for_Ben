import type { Album, Backend, Item, Settings } from './types'
import { uploadLocal } from './upload'
import { uid } from './util'

/** サーバー未接続時のデモ用バックエンド（IndexedDB に丸ごと保存） */
type State = { albums: Album[]; items: Item[]; settings: Settings }

const DB = 'album-wiki-demo'
const idb = () =>
  new Promise<IDBDatabase>((res, rej) => {
    const r = indexedDB.open(DB, 1)
    r.onupgradeneeded = () => r.result.createObjectStore('kv')
    r.onsuccess = () => res(r.result)
    r.onerror = () => rej(r.error)
  })

async function load(): Promise<State | null> {
  try {
    const db = await idb()
    return await new Promise((res) => {
      const q = db.transaction('kv').objectStore('kv').get('state')
      q.onsuccess = () => res((q.result as State) ?? null)
      q.onerror = () => res(null)
    })
  } catch {
    return null
  }
}

async function persist(s: State) {
  try {
    const db = await idb()
    db.transaction('kv', 'readwrite').objectStore('kv').put(s, 'state')
  } catch {
    /* 保存できない環境でもメモリ上で動作 */
  }
}

const seed = (): State => {
  const now = Date.now()
  const names = ['One Piece', 'Bikes', 'Vintage', 'Cars', 'Toy Story', 'Family']
  return {
    albums: names.map((name, i) => ({ id: uid(), name, order: i, createdAt: now + i })),
    items: [],
    settings: { bgColor: '#0b1026' },
  }
}

export function createDemoBackend(): Backend {
  let state: State = { albums: [], items: [], settings: {} }
  const listeners = new Set<(s: State) => void>()
  const emit = () => {
    state = { ...state }
    listeners.forEach((l) => l(state))
    persist(state)
  }
  const ready = load().then((s) => {
    state = s ?? seed()
    listeners.forEach((l) => l(state))
    if (!s) persist(state)
  })

  return {
    mode: 'demo',
    subscribe(cb) {
      listeners.add(cb)
      ready.then(() => cb(state))
      return () => listeners.delete(cb)
    },
    async addAlbum(a) {
      const id = uid()
      state.albums = [...state.albums, { ...a, id }]
      emit()
      return id
    },
    async updateAlbum(id, patch) {
      state.albums = state.albums.map((a) => (a.id === id ? { ...a, ...patch } : a))
      emit()
    },
    async deleteAlbums(ids, withItems) {
      const s = new Set(ids)
      state.albums = state.albums.filter((a) => !s.has(a.id))
      const next: Item[] = []
      for (const i of state.items) {
        if (!i.albumIds.some((a) => s.has(a))) { next.push(i); continue }
        const rest = i.albumIds.filter((a) => !s.has(a))
        if (withItems && rest.length === 0) continue
        next.push({ ...i, albumIds: rest })
      }
      state.items = next
      emit()
    },
    async addItem(i) {
      const id = uid()
      state.items = [...state.items, { ...i, id }]
      emit()
      return id
    },
    async updateItems(patches) {
      const m = new Map(patches.map((p) => [p.id, p.patch]))
      state.items = state.items.map((i) => (m.has(i.id) ? { ...i, ...m.get(i.id) } : i))
      emit()
    },
    async deleteItems(ids) {
      const s = new Set(ids)
      state.items = state.items.filter((i) => !s.has(i.id))
      emit()
    },
    async saveSettings(s) {
      state.settings = s
      emit()
    },
    uploadImage: uploadLocal,
  }
}
