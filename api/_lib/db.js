// Neon(Postgres) に JSON ドキュメントとして保存するシンプルなデータ層
import { neon } from '@neondatabase/serverless'

const url = () => process.env.DATABASE_URL || process.env.POSTGRES_URL || ''

let sqlFn = null
/** テスト時は globalThis.__TEST_SQL を差し込めるようにしている */
export function sql() {
  if (globalThis.__TEST_SQL) return globalThis.__TEST_SQL
  if (!sqlFn) sqlFn = neon(url())
  return sqlFn
}

export const dbConfigured = () => !!globalThis.__TEST_SQL || !!url()
export const blobConfigured = () => !!globalThis.__TEST_SQL || !!process.env.BLOB_READ_WRITE_TOKEN

let schemaReady = null
export function ensureSchema() {
  if (!schemaReady) {
    const q = sql()
    schemaReady = (async () => {
      await q`create table if not exists albums (id text primary key, data jsonb not null)`
      await q`create table if not exists items (id text primary key, data jsonb not null)`
      await q`create table if not exists settings (id text primary key, data jsonb not null)`
    })().catch((e) => { schemaReady = null; throw e })
  }
  return schemaReady
}

export async function loadAll() {
  await ensureSchema()
  const q = sql()
  const [albums, items, settings] = await Promise.all([
    q`select id, data from albums`,
    q`select id, data from items`,
    q`select data from settings where id = 'global'`,
  ])
  return {
    albums: albums.map((r) => ({ ...r.data, id: r.id })),
    items: items.map((r) => ({ ...r.data, id: r.id })),
    settings: settings[0]?.data ?? {},
  }
}

const strip = (o) => { const { id, ...rest } = o; void id; return JSON.parse(JSON.stringify(rest)) }

export async function upsert(table, id, data) {
  const q = sql()
  const json = JSON.stringify(strip(data))
  if (table === 'albums') await q`insert into albums (id, data) values (${id}, ${json}::jsonb) on conflict (id) do update set data = excluded.data`
  else if (table === 'items') await q`insert into items (id, data) values (${id}, ${json}::jsonb) on conflict (id) do update set data = excluded.data`
  else if (table === 'settings') await q`insert into settings (id, data) values (${id}, ${json}::jsonb) on conflict (id) do update set data = excluded.data`
}

export async function remove(table, ids) {
  if (!ids.length) return
  const q = sql()
  if (table === 'albums') await q`delete from albums where id = any(${ids})`
  else if (table === 'items') await q`delete from items where id = any(${ids})`
}

export const newId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
