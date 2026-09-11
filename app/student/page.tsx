import {requireUser} from '@/lib/auth'
import Link from 'next/link'
import {getStudentAnnouncements} from '@/lib/cached-data'
import {displayLabel} from '@/lib/labels'

export default async function Page(){
 const {supabase,user,profile}=await requireUser('student')
 const [{data:announcements,error},{data:registrations}]=await Promise.all([
  getStudentAnnouncements(profile.batch),
  supabase.from('registrations').select('registration_id,status,duty_type,duty_count,remarks,verified_at,submitted_at').eq('student_id',user.id).order('submitted_at',{ascending:false})
 ])
 const counts={pending:registrations?.filter(row=>row.status==='pending').length||0,approved:registrations?.filter(row=>row.status==='verified').length||0,ongoing:registrations?.filter(row=>row.status==='ongoing').length||0,completed:registrations?.filter(row=>row.status==='completed').length||0,total:registrations?.length||0}
 const updates=(registrations||[]).filter(row=>row.status!=='pending').slice(0,3)
 return <div className="space-y-7">
  <section className="student-dashboard-heading"><div><p className="eyebrow">{profile.batch} · STUDENT DASHBOARD</p><h1 className="dashboardGreeting !mb-2">Hello, {profile.first_name}.</h1><p className="muted text-sm">Here is a clear view of your make-up duty progress.</p></div><Link href="/student/registration" className="primary text-sm whitespace-nowrap">＋ New Registration</Link></section>
  {!!updates.length&&<section className="dashboardCard p-5" aria-labelledby="recent-updates"><div className="section-heading"><div><p className="eyebrow !mb-2">NOTIFICATIONS</p><h2 id="recent-updates">Recent Registration Updates</h2></div><Link href="/student/notifications" className="dashboardTextLink">View All →</Link></div><div className="space-y-2 mt-4">{updates.map(update=><p className={update.status==='denied'?'notice !mb-0':'update-row'} key={update.registration_id}><strong>{displayLabel(update.status)}</strong>{update.remarks&&<span> · {update.remarks}</span>}</p>)}</div></section>}
  <section className="themePanel analytics-hero p-7 md:p-8"><div><p className="text-xs opacity-75 uppercase tracking-widest">YOUR PROGRESS</p><h2>{counts.completed} requests completed</h2><p>Track approvals, upcoming duties, and completed requirements from one place.</p></div><div className="analytics-hero-stats"><div><strong>{counts.completed}</strong><small>Completed</small></div><div><strong>{counts.total}</strong><small>Total Requests</small></div></div></section>
  <section className="analytics-kpis student-kpis">{Object.entries(counts).map(([label,value],index)=><article key={label} className="dashboardCard analytics-kpi" data-searchable><div><span className="countIcon">{['◷','◇','↻','✓','∑'][index]}</span><span className="badge">{displayLabel(label)}</span></div><strong>{value}</strong><small>{displayLabel(label)} registrations</small></article>)}</section>
  <section className="analytics-split"><article className="dashboardCard p-6"><div className="section-heading"><div><h2>Request Status</h2><p className="muted text-xs">Your current workflow counts</p></div></div><div className="analytics-status-list">{['pending','verified','ongoing','completed'].map(status=>{const value=(registrations||[]).filter(row=>row.status===status).length,barWidth=counts.total?Math.round(value/counts.total*100):0;return <div key={status}><span><strong>{displayLabel(status)}</strong><small>{value} Request{value===1?'':'s'}</small></span><div><i style={{width:`${barWidth}%`}}/></div></div>})}</div></article><article className="dashboardCard p-6"><div className="section-heading"><div><h2>Duty Categories</h2><p className="muted text-xs">Duties across all submitted requests</p></div></div><div className="category-analytics">{['excused','waived','unexcused'].map(type=>{const value=(registrations||[]).filter(row=>row.duty_type===type).reduce((sum,row)=>sum+row.duty_count,0);return <div key={type}><span>{displayLabel(type)}</span><strong>{value}</strong><small>Duties</small></div>})}</div></article></section>
  <section className="student-overview-grid">
   <div>
    <div className="student-section-heading">
     <h2>Latest Announcements</h2>
     <span className="muted text-xs">From your Clinical Head</span>
    </div>
    {error&&<p className="notice" role="alert">Unable to load announcements. Check the database setup.</p>}
    <div className="student-announcement-list">
     {announcements?.slice(0,4).map(announcement=><article key={announcement.announcement_id} className="dashboardCard p-5" data-searchable>
      <div className="student-announcement-meta"><span className="badge">{announcement.batch||'General'}</span><time className="muted text-xs">{new Date(announcement.posted_at).toLocaleDateString('en-PH',{timeZone:'Asia/Manila'})}</time></div>
      <h3>{announcement.title}</h3>
      <p className="student-announcement-body">{announcement.content}</p>
     </article>)}
    </div>
    {!announcements?.length&&!error&&<div className="dashboardCard p-8 text-center muted">No announcements yet.</div>}
   </div>
   <aside>
    <h2 className="student-aside-title">Quick Actions</h2>
    <nav className="dashboardCard quick-actions-card" aria-label="Student quick actions">
     <Link className="quick-action-link" href="/student/registration"><strong>Register a Duty →</strong><span>Choose a date and submit proof</span></Link>
     <Link className="quick-action-link" href="/student/schedule"><strong>View My Schedule →</strong><span>See approved and ongoing duties</span></Link>
     <Link className="quick-action-link" href="/student/profile"><strong>Open My Profile →</strong><span>Review tallies and contact details</span></Link>
    </nav>
   </aside>
  </section>
 </div>
}


