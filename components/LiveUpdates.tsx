'use client'
import {useEffect,useRef,useTransition} from 'react'
import {useRouter} from 'next/navigation'
import {createClient} from '@/lib/supabase/client'

// One notification subscription per dashboard, containing no student data.
export default function LiveUpdates(){
 const router=useRouter()
 const [pending,startTransition]=useTransition()
 const pendingRef=useRef(false)
 pendingRef.current=pending
 useEffect(()=>{
  const supabase=createClient()
  let stopped=false,dirty=false,subscribed=false
  let timer:ReturnType<typeof setTimeout>|undefined
  let lastRefresh=Date.now()
  function flush(){
   timer=undefined
   if(stopped||!dirty||document.visibilityState!=='visible'||!navigator.onLine)return
   if(pendingRef.current){timer=setTimeout(flush,750);return}
   dirty=false
   lastRefresh=Date.now()
   startTransition(()=>router.refresh())
  }
  function schedule(){
   if(stopped)return
   dirty=true
   if(!timer)timer=setTimeout(flush,750)
  }
  const channel=supabase.channel('dashboard-updates')
   .on('postgres_changes',{event:'UPDATE',schema:'public',table:'app_revision'},schedule)
   .subscribe(status=>{
    subscribed=status==='SUBSCRIBED'
    // Catch changes that occurred before subscription or during a reconnect.
    if(subscribed)schedule()
   })
  const recover=()=>{if(document.visibilityState==='visible'&&navigator.onLine)schedule()}
  document.addEventListener('visibilitychange',recover)
  window.addEventListener('focus',recover)
  window.addEventListener('online',recover)
  // Recover from an unavailable realtime service, or missed notifications.
  // Hidden/offline tabs do not request new page data.
  const fallback=setInterval(()=>{
   if(Date.now()-lastRefresh>=(subscribed?120000:30000))schedule()
  },15000)
  return ()=>{
   stopped=true
   if(timer)clearTimeout(timer)
   clearInterval(fallback)
   document.removeEventListener('visibilitychange',recover)
   window.removeEventListener('focus',recover)
   window.removeEventListener('online',recover)
   void supabase.removeChannel(channel)
  }
 },[router])
 return null
}
