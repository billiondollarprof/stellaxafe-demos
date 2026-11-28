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

import { useState } from 'react'
import Link from 'next/link'
import AppLoading from '@/components/shell/AppLoading'
import Logo from '@/components/brand/Logo'
import SignInPhotos from '@/components/auth/SignInPhotos'
import styles from '@/components/auth/Auth.module.css'
import { useRightPage } from '@/lib/auth/routes'
import { useAuth } from '@/lib/auth/session'
import { BRAND } from '@/lib/brand/brand'
import { demoSession, resetDemo } from '@/lib/demo/backend'

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
  window.location.href = '/'
}

// ===== 3. The page =====
export default function DemoSignInPage() {
  const auth = useAuth()
  useRightPage(auth.status, '/sign-in/')
  const [busy, setBusy] = useState<string | null>(null)
  const [resetting, setResetting] = useState(false)

  if (auth.status === 'ready') return <AppLoading />

  return (
    <main className={styles.page}>
      <SignInPhotos />
      <section className={`${styles.card} ${styles.overPhotos}`}>
        <Logo size={72} className={styles.logo} />
        <h2>{BRAND.name}</h2>
        <p className={styles.lead}>Demo. Pick a role to see the hospital app as that person.</p>
        <div className={styles.people}>
          {PEOPLE.map((person) => (
            <button
              key={person.id}
              className={styles.person}
              disabled={busy !== null}
              onClick={() => {
                setBusy(person.id)
                enter(person)
              }}
            >
              <span>
                <b>{busy === person.id ? 'Opening…' : person.label}</b>
                <small>{person.what}</small>
              </span>
            </button>
          ))}
        </div>
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
