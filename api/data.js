import { authRequired, json } from './_lib/auth.js'
import { blobConfigured, dbConfigured, loadAll } from './_lib/db.js'

export async function GET() {
  if (!dbConfigured()) return json({ error: 'not_configured', db: false, blob: blobConfigured() }, 503)
  try {
    const data = await loadAll()
    return json({ ...data, authRequired: authRequired(), blob: blobConfigured() })
  } catch (e) {
    console.error(e)
    return json({ error: 'db_error', message: String(e?.message ?? e) }, 500)
  }
}
