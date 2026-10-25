import { getPassword } from './config'
import type { ImageRef } from './types'
import { blobToDataUrl, resizeImage, uid } from './util'

/** Vercel Blob へアップロード（本体 2400px ＋ サムネイル 480px） */
export async function uploadToBlob(file: File): Promise<ImageRef> {
  const { upload } = await import('@vercel/blob/client')
  const [big, small] = await Promise.all([resizeImage(file, 2400, 0.88), resizeImage(file, 480, 0.8)])
  const id = uid()
  const opts = { access: 'public' as const, handleUploadUrl: '/api/upload', clientPayload: getPassword(), contentType: 'image/jpeg' }
  try {
    const [a, b] = await Promise.all([
      upload(`images/${id}.jpg`, big.blob, opts),
      upload(`thumbs/${id}.jpg`, small.blob, opts),
    ])
    return { id, url: a.url, thumbUrl: b.url, width: big.width, height: big.height }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    throw new Error('画像のアップロードに失敗しました: ' + msg)
  }
}

/** デモモード：縮小して data URL としてブラウザ内に保存 */
export async function uploadLocal(file: File): Promise<ImageRef> {
  const [big, small] = await Promise.all([resizeImage(file, 1400, 0.82), resizeImage(file, 400, 0.75)])
  return { id: uid(), url: await blobToDataUrl(big.blob), thumbUrl: await blobToDataUrl(small.blob), width: big.width, height: big.height }
}
