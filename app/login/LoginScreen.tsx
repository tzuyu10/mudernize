'use client'

import { useEffect, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { login } from './actions'
import styles from './login.module.css'
import ThemeToggle from '@/components/ThemeToggle'
import type {BatchConfig} from '@/lib/batch-config'

type IconName = 'arrow' | 'user' | 'lock' | 'eye' | 'eyeOff' | 'chevron' | 'shield' | 'close' | 'check' | 'help'
function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    arrow: <><path d="M5 12h14m-5-5 5 5-5 5" /></>,
    user: <><circle cx="12" cy="8" r="3" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" /></>,
    eye: <><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
    eyeOff: <><path d="m3 3 18 18M10 5a13 13 0 0 1 12 7 17 17 0 0 1-4 5M6 6a17 17 0 0 0-4 6s3 7 10 7c1 0 2 0 3-1" /><path d="M9 9a4 4 0 0 0 6 6" /></>,
    chevron: <path d="m7 10 5 5 5-5" />,
    shield: <><path d="m12 3 8 4v5c0 5-8 9-8 9s-8-4-8-9V7l8-4Z" /><path d="m8 12 3 3 5-6" /></>,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    check: <path d="m5 12 4 4L19 6" />,
    help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1 .5-1.5 1-1.5 2m0 3h.01" /></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

const information = {
  about: { title: 'A little more about MUDernize', text: 'MUDernize brings make-up duty registration, clinical schedules, announcements, and progress into one place for Sanghaya, Astraea, Solaris, and Clinical Heads.' },
  how: { title: 'Your next duty, in three steps', text: '1. Sign in with your assigned ID, category, and password.\n2. Choose an available duty schedule and upload your required documents.\n3. Submit for Clinical Head review, then follow your approved schedule in My schedule.' },
  help: { title: 'Let’s get you signed in', text: 'Use the Student ID or Admin ID assigned to you. Select your batch, or Admin if you are a Clinical Head.\n\nFor a forgotten password, use the request link below the password field. A Clinical Head can then issue a temporary password.' },
  privacy: { title: 'Your information stays in your portal', text: 'Your profile and registration records are available to you and authorized Clinical Heads. Supporting documents are stored privately.\n\nOnly upload documents required for your duty request. For access, correction, or retention questions, contact your Clinical Head.' },
}
type Info = keyof typeof information

function SubmitButton() {
  const { pending } = useFormStatus()
  return <button type="submit" className={styles.submit} disabled={pending}>{pending ? 'Signing you in…' : 'Sign in'}{pending ? <span className={styles.spinner} /> : <Icon name="arrow" />}</button>
}

export default function LoginScreen({ error, message,batches }: { error?: string; message?: string;batches:BatchConfig[] }) {
  const categories=[...batches.map(batch=>({name:batch.name,detail:`${batch.year_level} year · Student portal`,logo:batch.logo_path,color:batch.theme_color})),{name:'Admin',detail:'Clinical Head portal',logo:'/logos/slcn-logo.png',color:undefined}]
  const [category, setCategory] = useState('')
  const [open, setOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [categoryError, setCategoryError] = useState(false)
  const [info, setInfo] = useState<Info>('help')
  const [notice, setNotice] = useState<{ error?: string; message?: string }>({ error, message })
  const dropdown = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const options = useRef<(HTMLButtonElement | null)[]>([])
  const dialog = useRef<HTMLDialogElement>(null)
  const selected = categories.find(c => c.name === category)

  // Keep the banner in step with the props the server sends.
  useEffect(() => { setNotice({ error, message }) }, [error, message])

  // A reload should never re-show the banner: hide it if this page load is a
  // refresh, and strip the params so the next reload starts clean either way.
  useEffect(() => {
    const [nav] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
    const url = new URL(window.location.href)
    if (!url.searchParams.has('error') && !url.searchParams.has('message')) return
    if (nav?.type === 'reload') setNotice({})
    url.searchParams.delete('error')
    url.searchParams.delete('message')
    window.history.replaceState(null, '', url.pathname + url.search + url.hash)
  }, [])

  useEffect(() => {
    if (!open) return
    options.current[Math.max(0, categories.findIndex(c => c.name === category))]?.focus()
    const dismiss = (event: PointerEvent) => {
      if (!dropdown.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', dismiss)
    return () => document.removeEventListener('pointerdown', dismiss)
  }, [open, category])

  function showInfo(value: Info) { setInfo(value); dialog.current?.showModal() }
  function choose(name: string) { setCategory(name); setCategoryError(false); setOpen(false); trigger.current?.focus() }

  return <div className={styles.page}>
    <div className={styles.scenery} aria-hidden="true"><div className={styles.halo} /><div className={styles.orbit} /><div className={styles.orbitInner} /><div className={styles.horizon} /></div>
    <a className={styles.skip} href="#sign-in">Skip to sign in</a>
    <header className={styles.header}>
      <a href="/login" className={styles.wordmark} aria-label="MUDernize home"><span className={styles.brandIcon}><img src="/logos/mudernize-logo.png" alt=""/></span><span>MUD<span className={styles.brandLight}>ernize</span></span></a>
      <div className={styles.intro}><span className={styles.introLine} />YOUR CLINICAL JOURNEY, SIMPLIFIED<span className={styles.introLine} /></div>
      <nav className={styles.menu} aria-label="Main navigation">
        <button type="button" onClick={() => showInfo('about')}>About</button>
        <button type="button" onClick={() => showInfo('how')}>How it works</button>
        <button type="button" className={styles.helpButton} onClick={() => showInfo('help')}><Icon name="help" size={16} />Help center</button>
        <span className={styles.themeControl}><ThemeToggle /></span>
      </nav>
    </header>
    <main className={styles.main} id="sign-in" tabIndex={-1}>
      <section className={styles.card} aria-labelledby="login-title">
        <div className={styles.cardHead}>
          <div className={styles.cardEmblem}><Icon name="shield" size={24} /><span /></div>
          <div className={styles.cardHeadText}>
            <h1 id="login-title">Welcome back.</h1>
            <p className={styles.subtitle}>A new day. A step closer.<br />Sign in to manage your make-up duties.</p>
          </div>
        </div>
        {notice.error && <p role="alert" className={styles.error}>{notice.error}</p>}
        {notice.message && <p role="status" className={styles.message}>{notice.message}</p>}
        <form action={login} className={styles.form} onSubmit={event => {
          if (!category) { event.preventDefault(); setCategoryError(true); trigger.current?.focus() }
        }}>
          <div ref={dropdown} className={styles.categoryField}>
            <label id="category-label">Category</label>
            <input type="hidden" name="category" value={category} />
            <button ref={trigger} type="button" className={styles.categoryTrigger} aria-haspopup="listbox" aria-expanded={open} aria-controls="category-options" aria-labelledby="category-label category-value" aria-invalid={categoryError} aria-describedby={categoryError ? 'category-error' : undefined} onClick={() => setOpen(!open)} onKeyDown={e => {
              if (['ArrowDown', 'ArrowUp'].includes(e.key)) { e.preventDefault(); setOpen(true) }
            }}>
              {selected ? <img src={selected.logo} alt="" width={30} height={30} className={styles.categoryLogo} /> : <span className={styles.categoryPlaceholder}><Icon name="user" size={16} /></span>}
              <span
                id="category-value"
                className={selected ? styles.selectedName : styles.placeholder}
                style={selected?.color ? { color: selected.color } : undefined}
              >
                {selected?.name || 'Select your category'}
              </span>
              <Icon name="chevron" size={16} />
            </button>
            {open && <div id="category-options" role="listbox" aria-labelledby="category-label" className={styles.options} onBlur={e => {
              if (e.relatedTarget && !dropdown.current?.contains(e.relatedTarget as Node)) setOpen(false)
            }}>
              {categories.map((c, index) => <button type="button" key={c.name} ref={el => { options.current[index] = el }} role="option" aria-selected={category === c.name} tabIndex={-1} onClick={() => choose(c.name)} onKeyDown={e => {
                if (e.key === 'Escape') { e.preventDefault(); setOpen(false); trigger.current?.focus(); return }
                if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
                  e.preventDefault()
                  const last = categories.length - 1
                  const next = e.key === 'Home' ? 0 : e.key === 'End' ? last : (index + (e.key === 'ArrowDown' ? 1 : -1) + categories.length) % categories.length
                  options.current[next]?.focus()
                  return
                }
                if (e.key.length === 1 && e.key !== ' ') {
                  const match = categories.findIndex(option => option.name.toLowerCase().startsWith(e.key.toLowerCase()))
                  if (match >= 0) options.current[match]?.focus()
                }
              }}><img src={c.logo} alt="" width={32} height={32} className={styles.categoryLogo} /><span><strong style={c.color ? { color: c.color } : undefined}>{c.name}</strong><small>{c.detail}</small></span>{category === c.name && <Icon name="check" size={16} />}</button>)}
            </div>}
            {categoryError && <p id="category-error" role="alert" className={styles.fieldError}>Please select your batch or Admin.</p>}
          </div>
          <div>
            <label htmlFor="identifier">{category === 'Admin' ? 'Admin ID' : 'Student ID'}</label>
            <div className={styles.inputWrap}><Icon name="user" size={17} /><input id="identifier" name="identifier" autoComplete="username" placeholder={category === 'Admin' ? 'e.g. ADMIN-001' : category==='Sanghaya'?'e.g. 2025-301107':category==='Solaris'?'e.g. 2024-301109':'e.g. 2023-301108'} required maxLength={40} spellCheck={false} autoCapitalize="none" /></div>
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <div className={styles.inputWrap}><Icon name="lock" size={17} /><input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" required /><button type="button" className={styles.eyeButton} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}><Icon name={showPassword ? 'eyeOff' : 'eye'} size={17} /></button></div>
            <a className={styles.forgot} href="/forgot-password">Forgot password?</a>
          </div>
          <SubmitButton />
          <p className={styles.signupPrompt}>New student? <a href="/signup">Create an account</a></p>
        </form>
        <div className={styles.divider}><span />HERE FOR EVERY BATCH<span /></div>
        <div className={styles.batchRow}>
          {categories.filter(c=>c.name!=='Admin').map(c => (
            <button
              type="button"
              key={c.name}
              className={category === c.name ? styles.batchActive : ''}
              onClick={() => choose(c.name)}
              aria-label={'Select ' + c.name}
              aria-pressed={category === c.name}
            >
              <img src={c.logo} width={22} height={22} alt="" />
              <span
                style={c.color ? { color: c.color, '--batch-color': c.color } as React.CSSProperties : undefined}
              >
                {c.name}
              </span>
            </button>
          ))}
        </div>
      </section>
    </main>
    <footer className={styles.footer}><span>© {new Date().getFullYear()} MUDernize</span><span className={styles.footerCenter}>A streamlined make-up duty management system</span><div><button type="button" onClick={() => showInfo('privacy')}>Privacy</button><span className={styles.footerDot}>·</span><button type="button" onClick={() => showInfo('help')}>Contact support<Icon name="arrow" size={14} /></button></div></footer>
    <dialog ref={dialog} className={styles.dialog} onClick={e => { if (e.target === e.currentTarget) dialog.current?.close() }} aria-labelledby="info-title">
      <button type="button" autoFocus className={styles.dialogClose} aria-label="Close information" onClick={() => dialog.current?.close()}><Icon name="close" /></button>
      <span className={styles.dialogEyebrow}>MUDERNIZE</span><h2 id="info-title">{information[info].title}</h2><p>{information[info].text}</p><button type="button" className={styles.dialogDone} onClick={() => dialog.current?.close()}>Back to sign in<Icon name="arrow" size={16} /></button>
    </dialog>
  </div>
}
