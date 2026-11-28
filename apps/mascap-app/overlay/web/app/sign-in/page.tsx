/*
 * app/sign-in/page.tsx (DEMO BUILD ONLY): pick a role and go straight in.
 *
 * Why: request 198 and 262 (Anthony, 2026-11-16 and 2026-11-27): "no
 * password... they will just select front desk from the login page". This
 * file replaces the real sign in page only in the hospital demo build
 * (stellaxafe-demos, apps/mascap-app/build.sh). The real Rhema app never
 * sees it.
 *
 * Each button signs in as one made up person in the demo database
 * (apps/mascap-app/seed/40-demo-staff.sql). Every PIN is 1234.
 *
 * Never: ask for an email or a password, or offer a real person.
 */
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AppLoading from '@/components/shell/AppLoading'
import Logo from '@/components/brand/Logo'
import SignInPhotos from '@/components/auth/SignInPhotos'
import styles from '@/components/auth/Auth.module.css'
import { useRightPage } from '@/lib/auth/routes'
import { useAuth } from '@/lib/auth/session'
import { BRAND } from '@/lib/brand/brand'
import { demoSession, prepareDemo, resetDemo } from '@/lib/demo/backend'

// ===== 1. The made up people, one per role =====
const PEOPLE = [
  { id: '00000000-0000-0000-0000-0000000d0001', email: 'frontdesk@demo.mascap', name: 'Joy Okoro', role: 'front_desk', label: 'Front Desk', what: 'Register, queue, payments' },
  { id: '00000000-0000-0000-0000-0000000d0002', email: 'doctor@demo.mascap', name: 'Dr. Tobi Ekpe', role: 'doctor', label: 'Doctor', what: 'Consultation, lab, prescriptions' },
  { id: '00000000-0000-0000-0000-0000000d0003', email: 'nurse@demo.mascap', name: 'Nurse Bisi Oghene', role: 'nurse', label: 'Nurse', what: 'Vital signs, medicine chart' },
  { id: '00000000-0000-0000-0000-0000000d0004', email: 'matron@demo.mascap', name: 'Matron Grace Idowu', role: 'matron', label: 'Matron', what: 'Antenatal care, the ward' },
  { id: '00000000-0000-0000-0000-0000000d0005', email: 'lab@demo.mascap', name: 'Sam Ukpe', role: 'laboratory', label: 'Laboratory', what: 'Tests and results' },
  { id: '00000000-0000-0000-0000-0000000d0006', email: 'pharmacy@demo.mascap', name: 'Ruth Akpan', role: 'pharmacy', label: 'Pharmacy', what: 'Dispense, stock' },
  { id: '00000000-0000-0000-0000-0000000d0007', email: 'admin@demo.mascap', name: 'Admin Desk', role: 'admin', label: 'Admin', what: 'Staff, prices, history' },
]

// ===== 2. Sign in as one of them: the same storage the real app uses =====
function enter(person: (typeof PEOPLE)[number]) {
  const session = demoSession(person.id, person.email)
  const account = {
    id: person.id,
    name: person.name,
    email: person.email,
    role: person.role,
    lastActive: Date.now(),
    locked: false,
    hasPin: true,
  }
  try {
    const list = JSON.parse(localStorage.getItem('rhema-device-accounts') ?? '[]') as { id: string }[]
    const others = list.filter((one) => one.id !== person.id)
    localStorage.setItem('rhema-device-accounts', JSON.stringify([account, ...others]))
    localStorage.setItem('rhema-active-account', person.id)
    localStorage.setItem(`rhema-auth-${person.id}`, JSON.stringify(session))
  } catch {
    // Storage blocked: the demo cannot remember anybody in this window.
  }
  // Open them now, in this page: no reload, so the database that is
  // already open here is used (lib/auth/session.tsx, demo-enter).
  window.dispatchEvent(new CustomEvent('demo-enter', { detail: person.id }))
}

// ===== 3. Small icons (drawn here, so nothing extra loads) =====
function Icon({ d, size = 18 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}
const ICON = {
  person: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  down: 'M6 9l6 6 6-6',
  phone: 'M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM11 18h2',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  key: 'M15 7a4 4 0 1 1-3.9 5H3v3h3v3h3v-3h2.1A4 4 0 0 1 15 7z',
  again: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5',
  download: 'M12 3v12M7 10l5 5 5-5M5 21h14',
}

// One small fact with its icon, for the row at the bottom of the card.
function Fact({ icon, text }: { icon: string; text: string }) {
  return (
    <span style={{ display: 'grid', justifyItems: 'center', gap: 6, fontSize: 12, color: '#5b6782', textAlign: 'center', lineHeight: 1.3 }}>
      <span style={{ width: 36, height: 36, borderRadius: 12, display: 'grid', placeItems: 'center', background: '#eef3fb', color: '#1f5fd0' }}>
        <Icon d={icon} />
      </span>
      {text}
    </span>
  )
}

// ===== 4. The page =====
export default function DemoSignInPage() {
  const auth = useAuth()
  useRightPage(auth.status, '/sign-in/')
  const [busy, setBusy] = useState(false)
  const [chosen, setChosen] = useState(PEOPLE[0].id)
  const picked = PEOPLE.find((person) => person.id === chosen) ?? PEOPLE[0]
  const [resetting, setResetting] = useState(false)
  // How far the demo is with getting ready (0 to 100). It starts the moment
  // this screen shows, so most of it is done before a role is picked
  // (Anthony, 2026-11-28: "it took long to open").
  const [percent, setPercent] = useState(0)
  useEffect(() => {
    void prepareDemo(setPercent)
  }, [])
  const ready = percent >= 100

  if (auth.status === 'ready') return <AppLoading />

  return (
    <main className={styles.page}>
      <SignInPhotos />
      <style>{`@keyframes demoNudge{0%,100%{transform:translateY(-50%)}50%{transform:translateY(-38%)}}`}</style>
      <section className={`${styles.card} ${styles.overPhotos}`} style={{ textAlign: 'left' }}>
        {/* ----- 4a. Who: the logo, the name, a small Demo tag ----- */}
        <div style={{ display: 'grid', justifyItems: 'center', gap: 8, marginBottom: 18 }}>
          <Logo size={68} className={styles.logo} />
          <h2 style={{ margin: 0, textAlign: 'center' }}>{BRAND.name}</h2>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.12em', color: '#c8102e', border: '1px solid #f3c2ca', borderRadius: 99, padding: '3px 12px' }}>
            DEMO
          </span>
        </div>

        {/* ----- 4b. Getting ready: a clear bar while it loads (Anthony,
            2026-11-28: "make the progress bar more visible... tell the person
            to hold on... the reason it's taking long is because this is a
            demo") ----- */}
        {!ready ? (
          <div role="status" style={{ display: 'grid', gridTemplateColumns: '36px 1fr', gap: 12, alignItems: 'center', padding: '14px 14px', borderRadius: 16, background: '#f4f7fd', border: '1px solid #dce6f7', marginBottom: 18 }}>
            <span style={{ width: 36, height: 36, borderRadius: 12, display: 'grid', placeItems: 'center', background: '#1f5fd0', color: '#fff' }}>
              <Icon d={ICON.download} />
            </span>
            <span style={{ display: 'grid', gap: 6 }}>
              <span style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#0d1b3d', fontSize: 15 }}>
                <span>Please hold on</span>
                <span>{percent}%</span>
              </span>
              <span aria-hidden="true" style={{ height: 8, borderRadius: 99, background: '#dce6f7', overflow: 'hidden' }}>
                <span style={{ display: 'block', height: '100%', width: `${Math.max(4, percent)}%`, borderRadius: 99, background: 'linear-gradient(90deg, #1f5fd0, #c8102e)', transition: 'width .4s ease' }} />
              </span>
              <small style={{ color: '#5b6782', lineHeight: 1.45 }}>
                The demo loads onto your phone, first time only. A fast network helps.
              </small>
            </span>
          </div>
        ) : null}

        {/* ----- 4c. The role: one drop down, its arrow big and moving
            (Anthony, 2026-11-28: "make it more visible... animate it") ----- */}
        <label htmlFor="demo-role" style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14, color: '#0d1b3d', marginBottom: 8 }}>
          <Icon d={ICON.person} size={16} /> Choose a role
        </label>
        <div style={{ position: 'relative' }}>
          <select
            id="demo-role"
            className={styles.input}
            value={chosen}
            disabled={busy}
            onChange={(event) => setChosen(event.target.value)}
            style={{ appearance: 'none', WebkitAppearance: 'none', paddingRight: 64, fontWeight: 700, fontSize: 17, border: '2px solid #1f5fd0', cursor: 'pointer', margin: 0 }}
          >
            {PEOPLE.map((person) => (
              <option key={person.id} value={person.id}>
                {person.label}
              </option>
            ))}
          </select>
          <span aria-hidden="true" style={{ position: 'absolute', right: 8, top: '50%', width: 38, height: 38, borderRadius: 11, background: '#1f5fd0', color: '#fff', display: 'grid', placeItems: 'center', pointerEvents: 'none', transform: 'translateY(-50%)', animation: busy ? 'none' : 'demoNudge 1.4s ease-in-out infinite' }}>
            <Icon d={ICON.down} size={22} />
          </span>
        </div>
        <p style={{ margin: '8px 2px 16px', fontSize: 13, color: '#5b6782' }}>{picked.what}</p>

        <button
          className={`${styles.button} ${styles.primary}`}
          disabled={busy}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, margin: 0 }}
          onClick={async () => {
            setBusy(true)
            await prepareDemo(setPercent)
            enter(picked)
          }}
        >
          {busy ? (ready ? 'Opening…' : `Getting ready… ${percent}%`) : `Open as ${picked.label}`}
          {busy ? null : <Icon d={ICON.arrow} />}
        </button>

        {/* ----- 4d. Three small facts, with icons, instead of a paragraph ----- */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 20, paddingTop: 16, borderTop: '1px solid #e8edf5' }}>
          <Fact icon={ICON.shield} text="Made up patients" />
          <Fact icon={ICON.phone} text="Saved on this phone" />
          <Fact icon={ICON.key} text="PIN 1234" />
        </div>

        <button
          className={`${styles.button} ${styles.quiet}`}
          disabled={resetting}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12 }}
          onClick={async () => {
            setResetting(true)
            await resetDemo()
            window.location.reload()
          }}
        >
          <Icon d={ICON.again} size={16} />
          {resetting ? 'Starting again…' : 'Start the demo again'}
        </button>
      </section>
      <nav className={styles.legalLinks} aria-label="Privacy and terms">
        <Link href="/privacy/">Privacy Policy</Link>
        <Link href="/terms/">Terms of Use</Link>
      </nav>
      <p className={styles.credit}>Powered by StellaXafe Technologies Limited</p>
    </main>
  )
}
