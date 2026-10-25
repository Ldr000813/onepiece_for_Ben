import { useCallback, useEffect, useRef, useState } from 'react'

const read = (k: string, d: number) => {
  try {
    const v = Number(localStorage.getItem('cols:' + k))
    return v > 0 ? v : d
  } catch {
    return d
  }
}

/** ピンチ（スマホ）／Ctrl+ホイール（PC）でグリッド列数を変える */
export function useGridZoom(key: string, def: number, min = 2, max = 6) {
  const [cols, setColsState] = useState(() => read(key, def))
  const ref = useRef<HTMLDivElement>(null)
  const start = useRef<number | null>(null)

  const setCols = useCallback(
    (fn: (c: number) => number) =>
      setColsState((c) => {
        const n = Math.max(min, Math.min(max, fn(c)))
        try { localStorage.setItem('cols:' + key, String(n)) } catch { /* noop */ }
        return n
      }),
    [key, min, max],
  )

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const dist = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)
    const ts = (e: TouchEvent) => { if (e.touches.length === 2) start.current = dist(e.touches) }
    const tm = (e: TouchEvent) => {
      if (e.touches.length !== 2 || start.current == null) return
      e.preventDefault()
      const r = dist(e.touches) / start.current
      if (r > 1.3) { setCols((c) => c - 1); start.current = dist(e.touches) }
      else if (r < 0.77) { setCols((c) => c + 1); start.current = dist(e.touches) }
    }
    const te = () => { start.current = null }
    const wh = (e: WheelEvent) => {
      if (!e.ctrlKey) return
      e.preventDefault()
      setCols((c) => c + (e.deltaY > 0 ? 1 : -1))
    }
    el.addEventListener('touchstart', ts, { passive: true })
    el.addEventListener('touchmove', tm, { passive: false })
    el.addEventListener('touchend', te)
    el.addEventListener('wheel', wh, { passive: false })
    return () => {
      el.removeEventListener('touchstart', ts)
      el.removeEventListener('touchmove', tm)
      el.removeEventListener('touchend', te)
      el.removeEventListener('wheel', wh)
    }
  }, [setCols])

  return {
    cols,
    ref,
    zoomIn: () => setCols((c) => c - 1),
    zoomOut: () => setCols((c) => c + 1),
  }
}
