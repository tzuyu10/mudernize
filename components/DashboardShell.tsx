'use client'
import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {useState,type CSSProperties} from 'react'
import SignOutButton from './SignOutButton'
import ThemeToggle from './ThemeToggle'
import styles from './DashboardShell.module.css'
import type {BatchConfig} from '@/lib/batch-config'

type IconName='home'|'form'|'calendar'|'user'|'students'|'check'|'bell'|'menu'|'search'|'help'|'layers'
const paths:Record<IconName,React.ReactNode>={
 home:<><path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10M9 20v-6h6v6"/></>,form:<><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/></>,calendar:<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/></>,user:<><circle cx="12" cy="8" r="3"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/></>,students:<><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2m1-14a3 3 0 0 1 0 6m2 2a5 5 0 0 1 3 5"/></>,check:<><path d="m9 11 2 2 4-5"/><path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Z"/></>,bell:<><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,menu:<path d="M4 7h16M4 12h16M4 17h16"/>,search:<><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/></>,help:<><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1 .5-1.5 1-1.5 2m0 3h.01"/></>,layers:<><path d="m12 3-9 5 9 5 9-5-9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/></>}
function Icon({name,size=20}:{name:IconName;size?:number}){return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>}
const studentLinks:[string,string,IconName][]=[['/student','Dashboard','home'],['/student/registration','Duty registration','form'],['/student/schedule','My schedule','calendar'],['/student/notifications','Notifications','bell'],['/student/profile','My profile','user']]
const adminLinks:[string,string,IconName][]=[['/admin','Dashboard','home'],['/admin/students','My students','students'],['/admin/batches','Batches','layers'],['/admin/schedule','Duty schedules','calendar'],['/admin/verification','Verification','check'],['/admin/announcements','Announcements','bell']]
function readableText(hex:string){const value=hex.replace('#','');if(!/^[0-9a-f]{6}$/i.test(value))return '#fff';const [r,g,b]=[0,2,4].map(index=>parseInt(value.slice(index,index+2),16));return (r*299+g*587+b*114)/1000>150?'#18233a':'#fff'}

export default function DashboardShell({children,admin,profile,batchConfig}:{children:React.ReactNode;admin:boolean;profile:any;batchConfig?:BatchConfig}){
 const [collapsed,setCollapsed]=useState(false),[mobileOpen,setMobileOpen]=useState(false)
 const pathname=usePathname(),batch:string=admin?'Admin':profile.batch,links=admin?adminLinks:studentLinks
 const batchLogo=admin?'/logos/slcn-logo.png':batchConfig?.logo_path||'/logos/mudernize-logo.png'
 const initials=`${profile.first_name?.[0]||''}${profile.last_name?.[0]||''}`,rootPath=admin?'/admin':'/student'
 const pageTitle=/\/student\/registration\/[^/]+$/.test(pathname)?'Duty Registration':pathname===rootPath?'Dashboard':pathname.split('/').filter(Boolean).slice(-1)[0]?.replace(/-/g,' ')
 const searchPage=(term:string)=>document.querySelectorAll('[data-searchable]').forEach(node=>{(node as HTMLElement).style.display=(node.textContent||'').toLowerCase().includes(term.toLowerCase())?'':'none'})
 const batchStyle=!admin&&batchConfig?{'--theme':batchConfig.theme_color,'--soft':`${batchConfig.theme_color}20`,'--on':readableText(batchConfig.theme_color)} as CSSProperties:undefined
 return <div className={`${styles.shell} ${styles[batch.toLowerCase()]||''}`} data-collapsed={collapsed} style={batchStyle}>
  {mobileOpen&&<button className={styles.scrim} aria-label="Close menu" onClick={()=>setMobileOpen(false)}/>}
  <aside className={`${styles.sidebar} ${mobileOpen?styles.mobileOpen:''}`}>
   <button className={styles.logoRow} onClick={()=>mobileOpen?setMobileOpen(false):setCollapsed(!collapsed)} aria-label={mobileOpen?'Close sidebar':collapsed?'Expand sidebar':'Collapse sidebar'} aria-expanded={!collapsed}><span className={styles.logoMark}><img src="/logos/mudernize-logo.png" alt=""/></span><strong>MUD<span>ernize</span></strong><span className={styles.collapseHint} aria-hidden="true">‹</span></button>
   <div className={styles.batchPill}><span className={styles.batchLogo}><img src={batchLogo} alt=""/></span><span>{batch}</span></div>
   <nav className={styles.nav} aria-label="Dashboard navigation">{links.map(([href,label,icon])=>{const active=pathname===href;return <Link key={href} href={href} onClick={()=>setMobileOpen(false)} className={active?styles.active:''} aria-current={active?'page':undefined} title={collapsed?label:undefined}><span className={styles.navIcon}><Icon name={icon}/></span><span className={styles.navLabel}>{label}</span></Link>})}</nav>
   <div className={styles.sideBottom}><button className={styles.support} onClick={()=>alert('For account or system support, contact your Clinical Head.')}><Icon name="help"/><span>Help & support</span></button>{admin?<div className={styles.sideProfile}><span className={styles.avatar}>{initials}</span><span><strong>{profile.first_name} {profile.last_name}</strong><small>Clinical Head</small></span></div>:<Link href="/student/profile" className={`${styles.sideProfile} ${styles.profileLink}`} onClick={()=>setMobileOpen(false)} title="Open My Profile"><span className={styles.avatar}>{initials}</span><span><strong>{profile.first_name} {profile.last_name}</strong><small>{profile.student_number}</small></span></Link>}<SignOutButton/></div>
  </aside>
  <section className={styles.workspace}>
   <header className={styles.topbar}><button className={styles.mobileMenu} onClick={()=>setMobileOpen(true)} aria-label="Open menu"><Icon name="menu"/></button><div><small>{admin?'Clinical Head':'Student'} workspace</small><strong>{pageTitle||'Dashboard'}</strong></div><form className={styles.search} role="search" onSubmit={event=>{event.preventDefault();searchPage(String(new FormData(event.currentTarget).get('page_search')||''))}}><input name="page_search" type="search" placeholder="Search this page" aria-label="Search this page" onChange={event=>searchPage(event.target.value)}/><button type="submit" aria-label="Search this page" title="Search"><Icon name="search" size={17}/></button></form><ThemeToggle/><Link href={admin?'/admin/announcements':'/student/notifications'} className={styles.notification} aria-label={admin?'Open announcements':'Open notifications'}><Icon name="bell"/><span/></Link><span className={styles.topAvatar}>{initials}</span><SignOutButton iconOnly/></header>
   <main className={styles.main}>{children}</main><footer className={styles.footer}><span>© {new Date().getFullYear()} MUDernize</span><span>Make-up duty management system</span><span>{batch} portal</span></footer>
  </section>
 </div>
}
