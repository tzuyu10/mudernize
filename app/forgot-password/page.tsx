import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'
import {requestPasswordReset} from './actions'
import {getBatchConfigs} from '@/lib/batch-data'
import styles from './forgot-password.module.css'

export default async function Page({searchParams}:{searchParams:{message?:string}}) {
 const {data:batches}=await getBatchConfigs()

 return <main className={styles.page}>
  <div className={styles.scenery} aria-hidden="true"><span/><span/></div>
  <header className={styles.header}>
   <Link href="/login" className={styles.brand} aria-label="MUDernize sign in"><img src="/logos/mudernize-logo.png" alt=""/><strong>MUD<span>ernize</span></strong></Link>
   <ThemeToggle/>
  </header>
  <div className={styles.content}>
   <section className={styles.card} aria-labelledby="recovery-title">
    <div className={styles.heading}><span className={styles.icon} aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 4v6h6M20 20v-6h-6"/><path d="M5.5 15a7 7 0 0 0 11.8 2.3L20 14M4 10l2.7-3.3A7 7 0 0 1 18.5 9"/></svg></span><div><p className={styles.eyebrow}>ACCOUNT RECOVERY</p><h1 id="recovery-title">Forgot your password?</h1></div></div>
    <p className={styles.intro}>Send a secure reset request to your Clinical Head. For privacy, the response is the same whether or not an account matches.</p>
    {searchParams.message&&<p className={styles.success} role="status">{searchParams.message}</p>}
    <form action={requestPasswordReset} className={styles.form}>
     <label>Student ID or Admin ID<input name="identifier" required maxLength={40} autoComplete="username" placeholder="e.g. 2025-301107"/></label>
     <label>Category<select name="category" required defaultValue=""><option value="" disabled>Select Category</option>{batches.map(batch=><option key={batch.name}>{batch.name}</option>)}<option>Admin</option></select></label>
     <button className={styles.submit}>Send Reset Request <span aria-hidden="true">→</span></button>
    </form>
    <div className={styles.help}><span aria-hidden="true">i</span><p>Your Clinical Head reviews the request and provides a temporary password directly to you.</p></div>
    <Link href="/login" className={styles.back}>← Back to Sign In</Link>
   </section>
  </div>
  <footer className={styles.footer}>© {new Date().getFullYear()} MUDernize · Make-Up Duty Management</footer>
 </main>
}

