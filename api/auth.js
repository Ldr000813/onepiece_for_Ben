import { authRequired, checkPassword, json } from './_lib/auth.js'

export async function POST(req) {
  const { password } = await req.json().catch(() => ({}))
  return json({ ok: checkPassword(password), authRequired: authRequired() })
}
