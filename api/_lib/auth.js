// 編集用パスワード（Vercel の環境変数 ADMIN_PASSWORD）。未設定なら誰でも編集可
import { timingSafeEqual } from 'node:crypto'

export const authRequired = () => !!process.env.ADMIN_PASSWORD

export function checkPassword(pw) {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return true
  if (typeof pw !== 'string') return false
  const a = Buffer.from(pw)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export const fromRequest = (req) => checkPassword(req.headers.get('x-admin-password') ?? '')

export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } })
