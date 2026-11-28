/*
 * lib/demo/backend.ts: the whole "server" of a hospital demo, running in the
 * visitor's own browser.
 *
 * Why: request 262 (Anthony, 2026-11-27): "we don't need a back end for
 * this thing. This is demo." The demo build hands this file's demoFetch to
 * every Supabase connection (lib/auth/clients.ts). Nothing goes over the
 * network: the real Rhema database, with made up MASCAP data, runs here in
 * PGlite (a small PostgreSQL), and what the visitor saves stays on their own
 * device (IndexedDB), so one visitor never sees another's changes.
 *
 * The parts:
 *   1. Load the database once (the file /demo/db.tar.gz, made by
 *      apps/mascap-app/build-db.mjs), then keep it on this device.
 *   2. Move every made up date forward, so "today" is always today.
 *   3. Sign in: a demo session per made up person (no password, no email).
 *   4. demoFetch: answers /rest/v1 (lib/demo/rest.ts), /auth/v1 and
 *      /storage/v1 the way Supabase would.
 *
 * Never: send a visitor's data anywhere, or load anything but the made up
 * database file.
 */
import { errorAnswer, handleRest, type Answer, type Db } from './rest'

// ===== 0. Every screen opens at the top =====
// A phone's browser puts a reloaded page back where it was scrolled. The
// demo always opens at the top (Anthony, 2026-11-28).
if (typeof window !== 'undefined') {
  try {
    history.scrollRestoration = 'manual'
  } catch {
    // Old browser: nothing to change.
  }
}

// ===== 1. The database, loaded once and kept on this device =====
const STORE = 'idb://mascap-demo-1'
const LOADED_KEY = 'mascap-demo-loaded-1'
let ready: Promise<Db> | null = null

async function load(): Promise<Db> {
  // PGlite lives in /demo/pglite/ beside the app, not in the app's bundle.
  const pglite = '/demo/pglite/index.js'
  const crypto = '/demo/pglite/contrib/pgcrypto.js'
  const uuid = '/demo/pglite/contrib/uuid_ossp.js'
  const { PGlite } = await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ pglite)
  const { pgcrypto } = await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ crypto)
  const { uuid_ossp } = await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ uuid)
  const extensions = { pgcrypto, uuid_ossp }
  let fresh = false
  try {
    fresh = localStorage.getItem(LOADED_KEY) !== 'yes'
  } catch {
    fresh = true
  }
  let db: Db
  if (fresh) {
    const file = await (await fetch('/demo/db.tar.gz')).blob()
    db = await PGlite.create(STORE, { loadDataDir: file, extensions })
    try {
      localStorage.setItem(LOADED_KEY, 'yes')
    } catch {
      // Private window: it loads again next time, which is fine.
    }
  } else {
    db = await PGlite.create(STORE, { extensions })
  }
  await freshen(db)
  return db
}

export function demoDb(): Promise<Db> {
  if (!ready) ready = load()
  return ready
}

// Start over: the made up data as it was (the "Reset the demo" button).
export async function resetDemo() {
  try {
    localStorage.removeItem(LOADED_KEY)
  } catch {
    // Nothing to remove.
  }
  await new Promise<void>((done) => {
    const request = indexedDB.deleteDatabase('/pglite/mascap-demo-1')
    request.onsuccess = request.onerror = request.onblocked = () => done()
  })
}

// ===== 1b. Get everything ready while the first screen shows =====
// Downloads the database engine and the made up data once, reporting how
// far it is (0 to 100), then opens the database. The files stay in the
// browser's cache, so the app itself does not download them again.
const FILES = ['pglite/pglite.wasm', 'pglite/pglite.data', 'db.tar.gz']
let preparing: Promise<void> | null = null
let progressNow = 0
const listeners = new Set<(percent: number) => void>()

export function prepareDemo(onProgress: (percent: number) => void): Promise<void> {
  listeners.add(onProgress)
  onProgress(progressNow)
  if (!preparing) {
    preparing = (async () => {
      const tell = (percent: number) => {
        progressNow = percent
        for (const listener of listeners) listener(percent)
      }
      let alreadyHere = false
      try {
        alreadyHere = localStorage.getItem(LOADED_KEY) === 'yes'
      } catch {
        // Unknown: download.
      }
      if (!alreadyHere) {
        let sizes: Record<string, number> = {}
        try {
          sizes = await (await fetch('/demo/sizes.json')).json()
        } catch {
          // Without sizes the bar jumps at the end, which is fine.
        }
        const total = FILES.reduce((sum, file) => sum + (sizes[file] ?? 0), 0) || 1
        let done = 0
        for (const file of FILES) {
          const response = await fetch('/demo/' + file, { cache: 'force-cache' })
          const reader = response.body?.getReader()
          if (!reader) continue
          for (;;) {
            const part = await reader.read()
            if (part.done) break
            done += part.value.length
            // Downloading is 85 of the 100; opening the database is the rest.
            tell(Math.min(85, Math.round((done / total) * 85)))
          }
        }
      }
      tell(90)
      await demoDb()
      tell(100)
    })()
  }
  return preparing
}

// ===== 2. Every made up date moves forward to today =====
// The file was made on one day; the visitor opens it on another. Every time
// column moves by the same amount, so "today", "waiting since" and the
// charts look right. Birthdays stay as they are.
async function freshen(db: Db) {
  const built = await db.query<{ hours: number }>(
    `select extract(epoch from (now() - at)) / 3600 as hours from public.demo_built`,
  )
  const hours = Number(built.rows[0]?.hours ?? 0)
  if (hours < 6) return
  const cols = await db.query<{ tbl: string; col: string; type: string }>(`
    select c.relname as tbl, a.attname as col, format_type(a.atttypid, null) as type
    from pg_attribute a join pg_class c on c.oid = a.attrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and a.attnum > 0 and not a.attisdropped
      and format_type(a.atttypid, null) in ('timestamp with time zone', 'date')
      and a.attname not in ('date_of_birth')`)
  const days = Math.floor(hours / 24)
  await db.transaction(async (tx) => {
    // The hospital's own rules (who did it, no editing old rows) are for
    // people. Moving the calendar is not a person's edit, so they rest here.
    await tx.query(`set local session_replication_role = replica`)
    const byTable = new Map<string, string[]>()
    for (const { tbl, col, type } of cols.rows) {
      const shift =
        type === 'date'
          ? `"${col}" = "${col}" + ${days}`
          : `"${col}" = "${col}" + interval '${hours.toFixed(4)} hours'`
      byTable.set(tbl, [...(byTable.get(tbl) ?? []), shift])
    }
    for (const [tbl, shifts] of byTable) {
      // A savepoint per table: a table whose own checks refuse the move
      // keeps its dates, and the others still move.
      await tx.query('savepoint one_table')
      try {
        await tx.query(`update public."${tbl}" set ${shifts.join(', ')}`)
        await tx.query('release savepoint one_table')
      } catch {
        await tx.query('rollback to savepoint one_table')
      }
    }
    await tx.query(`update public.demo_built set at = now()`)
  })
}

// ===== 3. Sign in: one demo session per made up person =====
// The token is not signed: nothing checks it but this file, and this file
// only reads who it is for. "amr" says an email code was just used, so the
// real PIN rules accept it (migration pin_reset_by_email_code).
const b64 = (value: object) =>
  btoa(JSON.stringify(value)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')

export function demoSession(id: string, email: string) {
  const now = Math.floor(Date.now() / 1000)
  const exp = now + 30 * 24 * 3600
  const claims = {
    sub: id,
    email,
    role: 'authenticated',
    aud: 'authenticated',
    iat: now,
    exp,
    amr: [{ method: 'otp', timestamp: now }],
    session_id: id,
  }
  const user = { id, email, aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {} }
  return {
    access_token: `${b64({ alg: 'none', typ: 'JWT' })}.${b64(claims)}.demo`,
    refresh_token: `demo:${id}:${email}`,
    token_type: 'bearer',
    expires_in: exp - now,
    expires_at: exp,
    user,
  }
}

// Who is asking: the claims inside the bearer token, or nobody.
function claimsOf(headers: Headers): string | null {
  const auth = headers.get('authorization') ?? ''
  const token = auth.replace(/^Bearer\s+/i, '')
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    const json = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
    const claims = JSON.parse(json) as { sub?: string }
    return claims.sub ? json : null
  } catch {
    return null
  }
}

function json(status: number, body: unknown): Answer {
  return { status, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }
}

function auth(path: string, search: URLSearchParams, headers: Headers, body: string | null): Answer {
  if (path === 'token') {
    // Refresh: the refresh token names the person ("demo:<id>:<email>").
    const sent = body ? (JSON.parse(body) as { refresh_token?: string }) : {}
    const [, id, email] = (sent.refresh_token ?? '').split(':')
    if (search.get('grant_type') === 'refresh_token' && id) return json(200, demoSession(id, email ?? ''))
    return json(400, { error: 'invalid_grant', error_description: 'Sign in again' })
  }
  if (path === 'user') {
    const claims = claimsOf(headers)
    if (!claims) return json(401, { msg: 'Not signed in' })
    const c = JSON.parse(claims) as { sub: string; email?: string }
    return json(200, { id: c.sub, email: c.email ?? '', aud: 'authenticated', role: 'authenticated' })
  }
  if (path === 'logout') return { status: 204, body: null }
  return json(400, { msg: 'Sign in by email is not part of the demo. Pick a role on the first screen.' })
}

// ===== 4. demoFetch: what every Supabase connection calls =====
export const demoFetch: typeof fetch = async (input, init) => {
  const request = input instanceof Request ? input : new Request(String(input), init)
  const url = new URL(request.url)
  const method = (init?.method ?? request.method ?? 'GET').toUpperCase()
  const headers = new Headers(init?.headers ?? request.headers)
  const body =
    init?.body !== undefined && init?.body !== null
      ? String(init.body)
      : method === 'GET' || method === 'HEAD'
        ? null
        : await request.text()
  let answer: Answer
  try {
    if (url.pathname.includes('/rest/v1/')) {
      const path = url.pathname.split('/rest/v1/')[1]
      answer = await handleRest(await demoDb(), claimsOf(headers), {
        method,
        path,
        search: url.searchParams,
        headers,
        body,
      })
    } else if (url.pathname.includes('/auth/v1/')) {
      answer = auth(url.pathname.split('/auth/v1/')[1], url.searchParams, headers, body)
    } else {
      answer = json(400, { message: 'Files are not part of the demo.' })
    }
  } catch (error) {
    answer = errorAnswer(error)
  }
  return new Response(answer.body, { status: answer.status, headers: answer.headers })
}

// ===== 5. A live connection that never connects =====
// The real app listens for changes over a WebSocket. The demo has no server,
// so the connection simply waits, quietly. Screens still refresh on their own.
export class QuietSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3
  readyState = 0
  binaryType = 'arraybuffer'
  onopen: (() => void) | null = null
  onclose: (() => void) | null = null
  onerror: (() => void) | null = null
  onmessage: (() => void) | null = null
  constructor(public url: string) {}
  send() {}
  close() {
    this.readyState = 3
  }
}
