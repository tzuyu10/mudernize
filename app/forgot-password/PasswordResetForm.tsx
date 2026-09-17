'use client'

import {useState} from 'react'
import {useFormStatus} from 'react-dom'
import type {BatchConfig} from '@/lib/batch-config'
import {resetStudentPassword} from './actions'
import styles from './forgot-password.module.css'

function Eye({closed}:{closed:boolean}){
 return <svg viewBox="0 0 24 24" aria-hidden="true">{closed?<><path d="m3 3 18 18M10 5a13 13 0 0 1 12 7 17 17 0 0 1-4 5M6 6a17 17 0 0 0-4 6s3 7 10 7c1 0 2 0 3-1"/><path d="M9 9a4 4 0 0 0 6 6"/></>:<><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>}</svg>
}

function Submit(){
 const {pending}=useFormStatus()
 return <button className={styles.submit} disabled={pending}>{pending?'Changing password…':'Change password'}{pending?<span className={styles.spinner}/>:<span aria-hidden="true">→</span>}</button>
}

export default function PasswordResetForm({batches}:{batches:BatchConfig[]}){
 const [showPassword,setShowPassword]=useState(false)
 return <form action={resetStudentPassword} className={styles.form} autoComplete="on">
  <label>Student ID<input name="student_number" required pattern="[0-9]{4}-[0-9]{6}" maxLength={11} autoComplete="username" placeholder="e.g. 2025-301107"/></label>
  <label>Batch<select name="batch" required defaultValue=""><option value="" disabled>Select your batch</option>{batches.map(batch=><option key={batch.name} value={batch.name}>{batch.name}</option>)}</select></label>
  <label>New password<div className={styles.password}><input name="password" type={showPassword?'text':'password'} required minLength={12} maxLength={128} autoComplete="new-password" placeholder="At least 12 characters"/><button type="button" onClick={()=>setShowPassword(value=>!value)} aria-label={showPassword?'Hide passwords':'Show passwords'} aria-pressed={showPassword}><Eye closed={showPassword}/></button></div></label>
  <label>Confirm new password<div className={styles.password}><input name="confirm_password" type={showPassword?'text':'password'} required minLength={12} maxLength={128} autoComplete="new-password" placeholder="Enter it again"/></div></label>
  <Submit/>
 </form>
}
