import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { hasFirebase, ownerEmail } from './config'
import { createDemoBackend } from './demoBackend'
import type { Album, Backend, Item, Settings } from './types'

type AuthApi = {
  user: { email: string | null; name: string | null } | null
  login: () => Promise<unknown>
  logout: () => Promise<unknown>
}

type Ctx = {
  backend: Backend | null
  loaded: boolean
  albums: Album[]
  items: Item[]
  settings: Settings
  canEdit: boolean
  auth: AuthApi
  toast: (msg: string) => void
}

const StoreCtx = createContext<Ctx>(null as unknown as Ctx)
export const useStore = () => useContext(StoreCtx)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [backend, setBackend] = useState<Backend | null>(null)
  const [data, setData] = useState<{ albums: Album[]; items: Item[]; settings: Settings } | null>(null)
  const [user, setUser] = useState<AuthApi['user']>(null)
  const [authFns, setAuthFns] = useState<Pick<AuthApi, 'login' | 'logout'>>({ login: async () => {}, logout: async () => {} })
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  useEffect(() => {
    let unsub = () => {}
    let unsubUser = () => {}
    ;(async () => {
      if (hasFirebase) {
        const fb = await import('./firebaseBackend')
        const b = fb.createFirebaseBackend()
        setBackend(b)
        setAuthFns({ login: fb.login, logout: fb.logout })
        unsubUser = fb.watchUser((u) => setUser(u ? { email: u.email, name: u.displayName } : null))
        unsub = b.subscribe(setData)
      } else {
        const b = createDemoBackend()
        setBackend(b)
        unsub = b.subscribe(setData)
      }
    })()
    return () => { unsub(); unsubUser() }
  }, [])

  useEffect(() => {
    if (!toastMsg) return
    const t = setTimeout(() => setToastMsg(null), 2600)
    return () => clearTimeout(t)
  }, [toastMsg])

  const canEdit =
    backend?.mode === 'demo' ||
    (!!user && (!ownerEmail || (user.email ?? '').toLowerCase() === ownerEmail))

  const value = useMemo<Ctx>(
    () => ({
      backend,
      loaded: !!data,
      albums: [...(data?.albums ?? [])].sort((a, b) => a.order - b.order || a.createdAt - b.createdAt),
      items: [...(data?.items ?? [])].sort((a, b) => a.order - b.order || a.createdAt - b.createdAt),
      settings: data?.settings ?? {},
      canEdit,
      auth: { user, ...authFns },
      toast: setToastMsg,
    }),
    [backend, data, canEdit, user, authFns],
  )

  return (
    <StoreCtx.Provider value={value}>
      {children}
      {toastMsg && <div className="toast" role="status">{toastMsg}</div>}
    </StoreCtx.Provider>
  )
}

/** 編集系の呼び出しをラップしてエラーをトースト表示 */
export function useAction() {
  const { toast } = useStore()
  return async <T,>(fn: () => Promise<T>, okMsg?: string): Promise<T | undefined> => {
    try {
      const r = await fn()
      if (okMsg) toast(okMsg)
      return r
    } catch (e) {
      console.error(e)
      toast(e instanceof Error ? e.message : '操作に失敗しました')
      return undefined
    }
  }
}

export const coverOf = (i: Item) => i.images[i.coverIndex] ?? i.images[0]
