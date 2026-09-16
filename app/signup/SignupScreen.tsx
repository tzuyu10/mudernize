'use client'

import Link from 'next/link'
import {useState} from 'react'
import {useFormStatus} from 'react-dom'
import ThemeToggle from '@/components/ThemeToggle'
import type {BatchConfig} from '@/lib/batch-config'
import {signupStudent} from './actions'
import styles from './signup.module.css'

function Eye({closed}:{closed:boolean}){
 return <svg viewBox="0 0 24 24" aria-hidden="true">{closed?<><path d="m3 3 18 18M10 5a13 13 0 0 1 12 7 17 17 0 0 1-4 5M6 6a17 17 0 0 0-4 6s3 7 10 7c1 0 2 0 3-1"/><path d="M9 9a4 4 0 0 0 6 6"/></>:<><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>}</svg>
}
function Submit(){
 const {pending}=useFormStatus()
 return <button className={styles.submit} disabled={pending}>{pending?'Creating account…':'Create student account'}{pending?<span className={styles.spinner}/>:<span aria-hidden="true">→</span>}</button>
}
export default function SignupScreen({batches,error}:{batches:BatchConfig[];error?:string}){
 const [batch,setBatch]=useState(batches[0]?.name||'')
 const [showPassword,setShowPassword]=useState(false)
 const selected=batches.find(item=>item.name===batch)||batches[0]
 const yearDigit=selected?.year_level?.[0]||'4'
 return <main className={styles.page}>
  <div className={styles.scenery} aria-hidden="true"><span/><span/></div>
  <header className={styles.header}><Link href="/login" className={styles.brand} aria-label="MUDernize sign in"><img src="/logos/mudernize-logo.png" alt=""/><strong>MUD<span>ernize</span></strong></Link><ThemeToggle/></header>
  <div className={styles.content}><section className={styles.card} aria-labelledby="signup-title">
   <div className={styles.heading}><span className={styles.emblem} aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3"/><path d="M5 20v-2a7 7 0 0 1 14 0v2M18 5v6M15 8h6"/></svg></span><div><p className={styles.eyebrow}>STUDENT REGISTRATION</p><h1 id="signup-title">Create your account.</h1></div></div>
   <p className={styles.intro}>Use your official student information. Your ID must match the batch you select.</p>
   {error&&<p className={styles.error} role="alert">{error}</p>}
   {!batches.length&&<p className={styles.error} role="alert">Student signup is unavailable because there are no active batches.</p>}
   <form action={signupStudent} className={styles.form} autoComplete="on">
    <div className={styles.grid}>
     <label>Student ID<input name="student_number" required pattern="[0-9]{4}-[0-9]{6}" maxLength={11} autoComplete="username" placeholder={`${selected?.student_year_prefix||'2025'}-301107`}/></label>
     <label>Batch<select name="batch" required value={batch} onChange={event=>setBatch(event.target.value)}>{batches.map(item=><option key={item.name} value={item.name}>{item.name}</option>)}</select></label>
     <label>First name<input name="first_name" required maxLength={80} autoComplete="given-name"/></label>
     <label>Middle initial <span>(Optional)</span><input name="middle_initial" maxLength={1} pattern="[A-Za-z]" autoCapitalize="characters" placeholder="M"/></label>
     <label>Last name<input name="last_name" required maxLength={80} autoComplete="family-name"/></label>
     <label>Year &amp; section<input key={yearDigit} name="year_section" required pattern={`${yearDigit}NU-[0-9]{2}`} maxLength={6} autoCapitalize="characters" placeholder={`${yearDigit}NU-05`} title={`Use the format ${yearDigit}NU-05`}/><small>{selected?.year_level||''} year · Format: {yearDigit}NU-05</small></label>
    </div>
    <div className={styles.grid}>
     <label>Password<div className={styles.password}><input name="password" type={showPassword?'text':'password'} required minLength={12} maxLength={128} autoComplete="new-password" placeholder="At least 12 characters"/><button type="button" onClick={()=>setShowPassword(value=>!value)} aria-label={showPassword?'Hide passwords':'Show passwords'} aria-pressed={showPassword}><Eye closed={showPassword}/></button></div></label>
     <label>Confirm password<div className={styles.password}><input name="confirm_password" type={showPassword?'text':'password'} required minLength={12} maxLength={128} autoComplete="new-password" placeholder="Enter it again"/></div></label>
    </div>
    <Submit/>
   </form>
   <p className={styles.signin}>Already have an account? <Link href="/login">Sign in</Link></p>
  </section></div>
  <footer className={styles.footer}>© {new Date().getFullYear()} MUDernize · Make-Up Duty Management</footer>
 </main>
}
