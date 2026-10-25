import { initializeApp } from 'firebase/app'
import { GoogleAuthProvider, getAuth, onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth'
import {
  addDoc, arrayRemove, collection, deleteDoc, deleteField, doc, getDocs, initializeFirestore, onSnapshot,
  persistentLocalCache, persistentMultipleTabManager, query, setDoc, updateDoc, where, writeBatch,
} from 'firebase/firestore'
import { firebaseConfig } from './config'
import type { Album, Backend, Item, Settings } from './types'
import { uploadToCloudinary } from './upload'

const app = initializeApp(firebaseConfig)
// オフラインキャッシュ有効（電波が悪くても閲覧・編集でき、後で同期）
const db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) })
export const auth = getAuth(app)

export const login = () => signInWithPopup(auth, new GoogleAuthProvider())
export const logout = () => signOut(auth)
export const watchUser = (cb: (u: User | null) => void) => onAuthStateChanged(auth, cb)

/** undefined のフィールドは Firestore が拒否するので除去 */
const clean = <T extends object>(o: T) => JSON.parse(JSON.stringify(o)) as T

/** 更新用：値が undefined のトップレベル項目はフィールド削除にする */
const toUpdate = (o: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v === undefined ? deleteField() : typeof v === 'object' && v !== null ? clean(v) : v]))

export function createFirebaseBackend(): Backend {
  return {
    mode: 'firebase',
    subscribe(cb) {
      let albums: Album[] = []
      let items: Item[] = []
      let settings: Settings = {}
      const got = { a: false, i: false, s: false }
      const fire = () => got.a && got.i && got.s && cb({ albums, items, settings })
      const u1 = onSnapshot(collection(db, 'albums'), (snap) => {
        albums = snap.docs.map((d) => ({ ...(d.data() as Album), id: d.id }))
        got.a = true
        fire()
      })
      const u2 = onSnapshot(collection(db, 'items'), (snap) => {
        items = snap.docs.map((d) => ({ ...(d.data() as Item), id: d.id }))
        got.i = true
        fire()
      })
      const u3 = onSnapshot(doc(db, 'settings', 'global'), (d) => {
        settings = (d.data() as Settings) ?? {}
        got.s = true
        fire()
      })
      return () => { u1(); u2(); u3() }
    },
    async addAlbum(a) {
      return (await addDoc(collection(db, 'albums'), clean(a))).id
    },
    async updateAlbum(id, patch) {
      const { id: _drop, ...rest } = patch
      await updateDoc(doc(db, 'albums', id), toUpdate(rest))
    },
    async deleteAlbum(id) {
      const snap = await getDocs(query(collection(db, 'items'), where('albumIds', 'array-contains', id)))
      const b = writeBatch(db)
      snap.docs.forEach((d) => b.update(d.ref, { albumIds: arrayRemove(id) }))
      b.delete(doc(db, 'albums', id))
      await b.commit()
    },
    async addItem(i) {
      return (await addDoc(collection(db, 'items'), clean(i))).id
    },
    async updateItems(patches) {
      for (let k = 0; k < patches.length; k += 400) {
        const b = writeBatch(db)
        patches.slice(k, k + 400).forEach(({ id, patch }) => {
          const { id: _drop, ...rest } = patch
          b.update(doc(db, 'items', id), toUpdate(rest))
        })
        await b.commit()
      }
    },
    async deleteItems(ids) {
      if (ids.length === 1) return deleteDoc(doc(db, 'items', ids[0]))
      for (let k = 0; k < ids.length; k += 400) {
        const b = writeBatch(db)
        ids.slice(k, k + 400).forEach((id) => b.delete(doc(db, 'items', id)))
        await b.commit()
      }
    },
    async saveSettings(s) {
      await setDoc(doc(db, 'settings', 'global'), clean(s))
    },
    uploadImage: uploadToCloudinary,
  }
}
