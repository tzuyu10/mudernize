'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import styles from './SignOutButton.module.css'

export default function SignOutButton({iconOnly=false}:{iconOnly?:boolean}) {
 const router=useRouter()
 const [pending,setPending]=useState(false)

 async function signOut() {
  if(pending)return
  setPending(true)
  const supabase=createClient()
  await supabase.auth.signOut()
  router.replace('/login')
  router.refresh()
 }

 return <button type="button" onClick={signOut} disabled={pending} className={`${styles.button} ${iconOnly?styles.icon:styles.sidebar}`} aria-label={pending?'Signing out':'Sign out'} title={iconOnly?(pending?'Signing out…':'Sign out'):undefined}>
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4M14 8l4 4-4 4m4-4H9"/></svg>
  {!iconOnly&&<span>{pending?'Signing out…':'Sign out'}</span>}
 </button>
}
