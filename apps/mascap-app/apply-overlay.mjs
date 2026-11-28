/*
 * apps/mascap-app/apply-overlay.mjs: turns a clean copy of the Rhema app
 * into the MASCAP demo app, before it is built.
 *
 * Why: request 262 (Anthony, 2026-11-27). The hospital's own app stays
 * untouched; the demo is made from a copy. Each change below finds an exact
 * piece of text and replaces it, and stops if the text is not there, so a
 * change in the Rhema app can never be patched wrongly in silence.
 *
 * Usage: node apply-overlay.mjs <copy of the Rhema repo>
 *
 * Never: run this on the Rhema repository itself, only on a copy.
 */
import { cpSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const copy = process.argv[2]
if (!copy || copy.replace(/\/$/, '').endsWith('/Rhema')) throw new Error('Give a copy of the Rhema repo, not the repo itself')
const here = dirname(fileURLToPath(import.meta.url))

// ===== 1. The demo's own files (sign in page, the in-browser backend) =====
cpSync(join(here, 'overlay'), copy, { recursive: true })

// ===== 2. Exact replacements =====
function change(file, from, to) {
  const path = join(copy, file)
  const text = readFileSync(path, 'utf8')
  if (!text.includes(from)) throw new Error(`${file}: the text to change is not there:\n${from}`)
  writeFileSync(path, text.replace(from, to))
}

// Every Supabase connection talks to the database in the browser.
change(
  'web/lib/auth/clients.ts',
  "import { noteSave } from '../live/changes'",
  "import { noteSave } from '../live/changes'\nimport { QuietSocket, demoFetch } from '../demo/backend'",
)
change('web/lib/auth/clients.ts', 'const answer = await fetch(input, init)', 'const answer = await demoFetch(input, init)')
change(
  'web/lib/auth/clients.ts',
  '    global: { fetch: watchedFetch },\n  })',
  '    global: { fetch: watchedFetch },\n    realtime: { transport: QuietSocket as never },\n  })',
)
change(
  'web/lib/auth/clients.ts',
  "        flowType: 'implicit',\n      },\n    })",
  "        flowType: 'implicit',\n      },\n      global: { fetch: demoFetch },\n      realtime: { transport: QuietSocket as never },\n    })",
)

// A demo screen locks after 12 hours, not 15 minutes (the PIN is 1234 anyway).
change('web/lib/auth/config.ts', 'export const LOCK_AFTER_MS = 15 * 60 * 1000', 'export const LOCK_AFTER_MS = 12 * 60 * 60 * 1000')

// MASCAP's real public name, logo and head office.
change(
  'web/lib/brand/brand.ts',
  "    name: 'MASCAP Medical Centre',\n    short: 'MASCAP',\n    initials: 'MA',\n    address: '',",
  "    name: 'MASCAP Hospitals',\n    short: 'MASCAP',\n    initials: null,\n    address: '34 Adeola Road, Sapele, Delta State',",
)
console.log('Demo layer applied to', copy)
