/*
 * apps/mascap-app/build-db.mjs: makes the MASCAP demo's database file.
 *
 * Why: request 262 (Anthony, 2026-11-27): the app demo runs with no backend.
 * The real Rhema database (every migration, so every rule and function) is
 * built here in PGlite, a small PostgreSQL, with made up data only, and saved
 * as one file. The app loads that file in the visitor's own browser.
 *
 * Usage: node apps/mascap-app/build-db.mjs <path to the Rhema repo> <out file>
 *
 * Never: load real data. Only the seed files beside this script.
 */
import { PGlite } from '@electric-sql/pglite'
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto'
import { uuid_ossp } from '@electric-sql/pglite/contrib/uuid_ossp'
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const [rhema, out] = process.argv.slice(2)
if (!rhema || !out) throw new Error('Usage: build-db.mjs <rhema repo> <out file>')
const here = dirname(fileURLToPath(import.meta.url))

// ===== 1. The real database: the Supabase stand-in, then every migration =====
const db = await PGlite.create({ extensions: { pgcrypto, uuid_ossp } })
await db.exec(readFileSync(join(rhema, 'supabase/tests/local_shim.sql'), 'utf8'))
const migrations = readdirSync(join(rhema, 'supabase/migrations')).filter((f) => f.endsWith('.sql')).sort()
for (const f of migrations) await db.exec(readFileSync(join(rhema, 'supabase/migrations', f), 'utf8'))

// ===== 2. The made up data =====
for (const f of readdirSync(join(here, 'seed')).filter((f) => f.endsWith('.sql')).sort()) {
  try {
    await db.exec(readFileSync(join(here, 'seed', f), 'utf8'))
  } catch (error) {
    console.error(`Seed ${f} failed: ${error.message}`)
    process.exit(1)
  }
}

// ===== 3. When it was made, so the browser can move every date to today =====
await db.exec(`create table if not exists public.demo_built (at timestamptz not null);
  delete from public.demo_built; insert into public.demo_built values (now());
  revoke all on public.demo_built from anon, authenticated;`)

const counts = await db.query(`select (select count(*) from public.patients) patients,
  (select count(*) from public.staff) staff, (select count(*) from public.queue_entries) queue`)
console.log('Made up data:', counts.rows[0], `(${migrations.length} migrations)`)

// ===== 4. Everything written to the tables, so the log adds nothing =====
// (VACUUM FULL was tried: it made the file bigger, 8.4 MB against 6 MB.)
await db.query('checkpoint')

// ===== 5. Save it as one compressed file =====
const file = await db.dumpDataDir('gzip')
writeFileSync(out, Buffer.from(await file.arrayBuffer()))
console.log('Saved', out, Math.round(file.size / 1024), 'KB')
