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

// ===== 3. The page =====
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
      <section className={`${styles.card} ${styles.overPhotos}`}>
        <Logo size={72} className={styles.logo} />
        <h2>{BRAND.name}</h2>
        <p className={styles.lead}>Demo. Pick a role to see the hospital app as that person.</p>
        {/* ===== The progress bar, big and plain (Anthony, 2026-11-28: "make
            the progress bar more visible... tell the person to hold on") ===== */}
        {!ready ? (
          <div
            role="status"
            style={{
              margin: '14px 0 6px',
              padding: '14px 16px',
              borderRadius: 16,
              background: '#eef4ff',
              border: '1px solid #c9dafc',
              textAlign: 'left',
            }}
          >
            <b style={{ display: 'flex', justifyContent: 'space-between', color: '#0d1b3d' }}>
              <span>Please hold on</span>
              <span>{percent}%</span>
            </b>
            <div
              aria-hidden="true"
              style={{ height: 12, borderRadius: 99, background: '#d6e2f8', overflow: 'hidden', margin: '10px 0' }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.max(4, percent)}%`,
                  borderRadius: 99,
                  background: 'linear-gradient(90deg, #1f5fd0, #c8102e)',
                  transition: 'width .4s ease',
                }}
              />
            </div>
            <small style={{ display: 'block', color: '#3c4a66', lineHeight: 1.5 }}>
              This demo runs completely on your phone, so the first time it loads the whole hospital
              system into your phone. A fast network helps. After this, it opens quickly.
            </small>
          </div>
        ) : null}
        {/* One drop down for the role, so the screen stays clear (Anthony,
            2026-11-28: "make the role a drop down"). */}
        <label className={styles.label} htmlFor="demo-role">
          Choose a role (tap to see them all)
        </label>
        {/* The arrow is big, blue and moves gently, so it is clear the box
            opens (Anthony, 2026-11-28: "make it more visible... animate it"). */}
        <div style={{ position: 'relative' }}>
          <style>{`@keyframes demoNudge{0%,100%{transform:translateY(-50%)}50%{transform:translateY(-30%)}}`}</style>
          <select
            id="demo-role"
            className={styles.input}
            value={chosen}
            disabled={busy}
            onChange={(event) => setChosen(event.target.value)}
            style={{
              appearance: 'none',
              WebkitAppearance: 'none',
              paddingRight: 64,
              fontWeight: 700,
              border: '2px solid #1f5fd0',
              cursor: 'pointer',
            }}
          >
            {PEOPLE.map((person) => (
              <option key={person.id} value={person.id}>
                {person.label}
              </option>
            ))}
          </select>
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              right: 10,
              top: '50%',
              width: 40,
              height: 40,
              borderRadius: 12,
              background: '#1f5fd0',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              pointerEvents: 'none',
              animation: busy ? 'none' : 'demoNudge 1.4s ease-in-out infinite',
              transform: 'translateY(-50%)',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </span>
        </div>
        <p className={styles.note}>
          {picked.name}: {picked.what.toLowerCase()}.
        </p>
        <button
          className={`${styles.button} ${styles.primary}`}
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            await prepareDemo(setPercent)
            enter(picked)
          }}
        >
          {busy ? (ready ? 'Opening…' : `Getting ready… ${percent}%`) : `Open as ${picked.label}`}
        </button>
        <p className={styles.note}>
          Made up patients only. What you save stays on this device. The PIN for every role is 1234.
        </p>
        <button
          className={`${styles.button} ${styles.quiet}`}
          disabled={resetting}
          onClick={async () => {
            setResetting(true)
            await resetDemo()
            window.location.reload()
          }}
        >
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
