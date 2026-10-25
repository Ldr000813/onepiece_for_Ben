import { del } from '@vercel/blob'

/** Vercel Blob 上の画像を削除（自分のストアの URL だけ） */
export async function deleteBlobs(urls) {
  const targets = [...new Set(urls.filter((u) => typeof u === 'string' && u.includes('.blob.vercel-storage.com')))]
  if (!targets.length) return
  if (globalThis.__TEST_DELETED) { globalThis.__TEST_DELETED.push(...targets); return }
  try {
    await del(targets)
  } catch (e) {
    console.error('blob delete failed', e)
  }
}

export const imagesOf = (item) => [...(item?.images ?? []).flatMap((i) => [i.url, i.thumbUrl]), item?.bgImageUrl].filter(Boolean)
