import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getPassword, setPassword } from './config'
import { createDemoBackend } from './demoBackend'
import { createServerBackend } from './serverBackend'
import type { Album, Backend, Item, Settings } from './types'

/** デモになっている理由 */
export type DemoReason = 'local' | 'not_configured' | 'error' | null

type Ctx = {
  backend: Backend | null
  loaded: boolean
  albums: Album[]
  items: Item[]
  settings: Settings
  canEdit: boolean
  authRequired: boolean
  blobReady: boolean
  demoReason: DemoReason
  login: (pw: string) => Promise<boolean>
  logout: () => void
  toast: (msg: string) => void
}

const StoreCtx = createContext<Ctx>(null as unknown as Ctx)
export const useStore = () => useContext(StoreCtx)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [backend, setBackend] = useState<Backend | null>(null)
  const [data, setData] = useState<{ albums: Album[]; items: Item[]; settings: Settings } | null>(null)
  const [authRequired, setAuthRequired] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [blobReady, setBlobReady] = useState(false)
  const [demoReason, setDemoReason] = useState<DemoReason>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  useEffect(() => {
    let unsub = () => {}
    ;(async () => {
      let reason: DemoReason = 'local'
      try {
        const r = await fetch('/api/data', { cache: 'no-store' })
        const isJson = (r.headers.get('content-type') ?? '').includes('application/json')
        if (isJson) {
          const j = await r.json()
          if (r.ok) {
            const b = createServerBackend({ albums: j.albums, items: j.items, settings: j.settings })
            setAuthRequired(!!j.authRequired)
            setBlobReady(!!j.blob)
            if (j.authRequired && getPassword()) {
              const a = await fetch('/api/auth', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password: getPassword() }) })
              setAuthed(!!(await a.json()).ok)
            }
            setBackend(b)
            unsub = b.subscribe(setData)
            return
          }
          reason = j.error === 'not_configured' ? 'not_configured' : 'error'
          if (reason === 'error') console.error(j)
        }
      } catch {
        reason = 'local'
      }
      const b = createDemoBackend()
      setDemoReason(reason)
      setBackend(b)
      unsub = b.subscribe(setData)
    })()
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!toastMsg) return
    const t = setTimeout(() => setToastMsg(null), 2600)
    return () => clearTimeout(t)
  }, [toastMsg])

  const canEdit = backend?.mode === 'demo' || (backend?.mode === 'server' && (!authRequired || authed))

  const value = useMemo<Ctx>(
    () => ({
      backend,
      loaded: !!data,
      albums: [...(data?.albums ?? [])].sort((a, b) => a.order - b.order || a.createdAt - b.createdAt),
      items: [...(data?.items ?? [])].sort((a, b) => a.order - b.order || a.createdAt - b.createdAt),
      settings: data?.settings ?? {},
      canEdit,
      authRequired,
      blobReady,
      demoReason,
      login: async (pw) => {
        const r = await fetch('/api/auth', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password: pw }) })
        const ok = !!(await r.json().catch(() => ({}))).ok
        if (ok) { setPassword(pw); setAuthed(true) }
        return ok
      },
      logout: () => { setPassword(''); setAuthed(false) },
      toast: setToastMsg,
    }),
    [backend, data, canEdit, authRequired, blobReady, demoReason],
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
