import { cloudinary, hasCloudinary } from './config'
import type { ImageRef } from './types'
import { blobToDataUrl, resizeImage, uid } from './util'

/** Cloudinary へ署名なしアップロード（アップロード前に縮小して容量・クレジットを節約） */
export async function uploadToCloudinary(file: File): Promise<ImageRef> {
  if (!hasCloudinary) throw new Error('Cloudinary が未設定です（.env を確認してください）')
  const { blob } = await resizeImage(file, 2400, 0.9)
  const fd = new FormData()
  fd.append('file', blob, file.name)
  fd.append('upload_preset', cloudinary.uploadPreset!)
  fd.append('folder', 'album-wiki')
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudinary.cloudName}/image/upload`, { method: 'POST', body: fd })
  if (!res.ok) throw new Error('画像のアップロードに失敗しました: ' + (await res.text()))
  const j = await res.json()
  return { id: uid(), url: j.secure_url, publicId: j.public_id, width: j.width, height: j.height }
}

/** デモモード：縮小して data URL としてブラウザ内に保存 */
export async function uploadLocal(file: File): Promise<ImageRef> {
  const { blob, width, height } = await resizeImage(file, 1400, 0.82)
  return { id: uid(), url: await blobToDataUrl(blob), width, height }
}
