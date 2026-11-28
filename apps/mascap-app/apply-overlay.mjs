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

// The install card: two equal buttons, Install and Not now (Anthony,
// 2026-11-28: "two buttons side by side... a border button"). The call
// alerts step never shows: alerts need a server, and the demo has none.
change(
  'web/components/onboarding/OnboardingGate.tsx',
  `            >
              <button className={styles.skip} onClick={skip} style={{ animationDelay: '1.1s' }}>
                Already installed {BRAND.short} on this {device}? Tap here to skip this.
              </button>
            </Explain>
            <button className={styles.primary} onClick={install} disabled={busy}>
              {busy ? 'Installing…' : 'Install'}
            </button>`,
  `            />
            <div className={styles.demoRow}>
              <button className={styles.demoOutline} onClick={skip}>
                Not now
              </button>
              <button className={styles.primary} onClick={install} disabled={busy}>
                {busy ? 'Installing…' : 'Install'}
              </button>
            </div>`,
)
change(
  'web/components/onboarding/OnboardingGate.tsx',
  '  // Installed (or a browser that cannot install): now the alerts.',
  "  // The demo: no alerts step (no server to send them).\n  if (process.env.NEXT_PUBLIC_DEMO === '1') return 'done'\n  // Installed (or a browser that cannot install): now the alerts.",
)
{
  const css = join(copy, 'web/components/onboarding/onboarding.module.css')
  writeFileSync(
    css,
    readFileSync(css, 'utf8') +
      `
/* Demo build: Not now and Install side by side, the same size. */
.demoRow {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  width: 100%;
}
.demoOutline {
  font: inherit;
  font-weight: 700;
  font-size: 16px;
  min-height: 50px;
  border: 2px solid #1f5fd0;
  border-radius: 14px;
  color: #1f5fd0;
  background: #fff;
  cursor: pointer;
}
`,
  )
}

// Demo sign in without reloading the page: the sign in page says who, and
// the session opens them at once, so the database that is already open in
// this page is used straight away (Anthony, 2026-11-28: "make the app load
// faster").
change(
  'web/lib/auth/session.tsx',
  '  }, [activate, finishSignIn, signOutHere])\n',
  `  }, [activate, finishSignIn, signOutHere])

  // ----- Demo build: the role picked on the first screen opens at once -----
  useEffect(() => {
    function demoEnter(event: Event) {
      const id = (event as CustomEvent<string>).detail
      setActiveId(id)
      void activate(id)
    }
    window.addEventListener('demo-enter', demoEnter)
    return () => window.removeEventListener('demo-enter', demoEnter)
  }, [activate])
`,
)

console.log('Demo layer applied to', copy)
