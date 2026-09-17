import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'
import {getBatchConfigs} from '@/lib/batch-data'
import PasswordResetForm from './PasswordResetForm'
import styles from './forgot-password.module.css'

export default async function Page({searchParams:searchParamsPromise}:{searchParams:Promise<{error?:string}>}){
 const [{data:batches},searchParams]=await Promise.all([getBatchConfigs(),searchParamsPromise])
 return <main className={styles.page}>
  <div className={styles.scenery} aria-hidden="true"><span/><span/></div>
  <header className={styles.header}><Link href="/login" className={styles.brand} aria-label="MUDernize sign in"><img src="/logos/mudernize-logo.png" alt=""/><strong>MUD<span>ernize</span></strong></Link><ThemeToggle/></header>
  <div className={styles.content}><section className={styles.card} aria-labelledby="recovery-title">
   <div className={styles.heading}><span className={styles.icon} aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 4v6h6M20 20v-6h-6"/><path d="M5.5 15a7 7 0 0 0 11.8 2.3L20 14M4 10l2.7-3.3A7 7 0 0 1 18.5 9"/></svg></span><div><p className={styles.eyebrow}>PASSWORD RESET</p><h1 id="recovery-title">Set a new password.</h1></div></div>
   <p className={styles.intro}>Enter your Student ID and batch, then create a new password for your account.</p>
   {searchParams.error&&<p className={styles.error} role="alert">{searchParams.error}</p>}
   {!batches.length&&<p className={styles.error} role="alert">Password reset is unavailable because there are no active batches.</p>}
   <PasswordResetForm batches={batches}/>
   <Link href="/login" className={styles.back}>← Back to Sign In</Link>
  </section></div>
  <footer className={styles.footer}>© {new Date().getFullYear()} MUDernize · Make-Up Duty Management</footer>
 </main>
}
