import type { CSSProperties } from 'react'

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

/** 画像を最大辺 maxSize に縮小して Blob を返す */
export async function resizeImage(file: File, maxSize: number, quality = 0.88): Promise<{ blob: Blob; width: number; height: number }> {
  const bmp = await createImageBitmap(file).catch(() => null)
  if (!bmp) return { blob: file, width: 0, height: 0 }
  const scale = Math.min(1, maxSize / Math.max(bmp.width, bmp.height))
  const w = Math.round(bmp.width * scale)
  const h = Math.round(bmp.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, w, h)
  const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b ?? file), 'image/jpeg', quality))
  return { blob, width: w, height: h }
}

export const blobToDataUrl = (b: Blob) =>
  new Promise<string>((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result as string)
    r.onerror = rej
    r.readAsDataURL(b)
  })

/** グリッド用のサムネイル URL（なければ本体） */
export const thumbOf = (img?: { url: string; thumbUrl?: string }) => img?.thumbUrl ?? img?.url

export const fileTitle = (name: string) => name.replace(/\.[^.]+$/, '')

/** 背景スタイル（色＋画像） */
export function bgStyle(color?: string, image?: string): CSSProperties {
  const s: CSSProperties & Record<string, string> = {}
  if (color) { s.backgroundColor = color; s['--bg'] = color }
  if (image) {
    s.backgroundImage = `url("${image}")`
    s.backgroundSize = 'cover'
    s.backgroundPosition = 'center'
    s.backgroundAttachment = 'fixed'
  }
  return s
}

/** 背景色が明るいかどうか（文字色の切替用） */
export function isLight(hex?: string) {
  if (!hex || !/^#?[0-9a-f]{6}$/i.test(hex)) return false
  const h = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
  return (r * 299 + g * 587 + b * 114) / 1000 > 150
}
