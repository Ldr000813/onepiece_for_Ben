import { handleUpload } from '@vercel/blob/client'
import { checkPassword, json } from './_lib/auth.js'

// ブラウザから Vercel Blob へ直接アップロードするためのトークン発行
export async function POST(req) {
  const body = await req.json()
  try {
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        if (!checkPassword(clientPayload ?? '')) throw new Error('パスワードが違います')
        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'],
          maximumSizeInBytes: 15 * 1024 * 1024,
          addRandomSuffix: true,
        }
      },
    })
    return json(result)
  } catch (e) {
    return json({ error: String(e?.message ?? e) }, 400)
  }
}
