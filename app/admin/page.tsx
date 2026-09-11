import {requireUser} from '@/lib/auth'
import {getBatchConfigs} from '@/lib/batch-data'
import Link from 'next/link'
import {displayLabel} from '@/lib/labels'

export default async function Page(){
 const {supabase,profile}=await requireUser('clinical_head')
 const [{data:registrations,error},{data:students},{data:schedules},{data:batchConfigs}]=await Promise.all([
  supabase.from('registrations').select('status,duty_type,duty_count,submitted_at,users!registrations_student_id_fkey(batch)'),
  supabase.from('users').select('user_id,batch,is_active').eq('role','student'),
  supabase.from('mud_schedules').select('status,date,max_capacity,current_count'),
  getBatchConfigs(true),
 ])
 const rows=registrations||[],studentRows=students||[],scheduleRows=schedules||[]
 const count=(status:string)=>rows.filter(row=>row.status===status).length
 const total=rows.length,completed=count('completed')
 const activeStudents=studentRows.filter(student=>student.is_active!==false).length
 const today=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Manila'})
 const openSchedules=scheduleRows.filter(schedule=>schedule.status==='open'&&schedule.date>=today)
 const availableSeats=openSchedules.reduce((sum,schedule)=>sum+Math.max(0,schedule.max_capacity-schedule.current_count),0)
 const statuses=['pending','verified','ongoing','completed']
 return <div className="space-y-7">
  <section><p className="eyebrow">CLINICAL HEAD DASHBOARD</p><h1 className="dashboardGreeting !mb-2">Welcome back, {profile.first_name}.</h1><p className="muted text-sm">Monitor student progress, review demand, and keep duty capacity available.</p></section>
  {error&&<p className="notice" role="alert">Unable to load all analytics. Check the database setup.</p>}
  <section className="analytics-kpis" aria-label="Clinical Head analytics">{[['Active Students',activeStudents,'Enrolled accounts'],['Pending Review',count('pending'),'Needs a decision'],['Completed Requests',completed,`${total} total requests`],['Available Seats',availableSeats,`${openSchedules.length} open schedules`]].map(([label,value,detail])=><article className="dashboardCard analytics-kpi" key={label}><p>{label}</p><strong>{value}</strong><small>{detail}</small></article>)}</section>
  <section className="themePanel analytics-hero p-7 md:p-8"><div><p className="text-xs opacity-75 tracking-widest">REGISTRATION HEALTH</p><h2>{completed} requests completed</h2><p>{count('pending')} requests need review and {count('ongoing')} duties are currently in progress.</p></div><div className="analytics-hero-stats"><div><strong>{completed}</strong><small>Completed</small></div><div><strong>{total}</strong><small>Total Requests</small></div></div><Link href="/admin/verification" className="adminHeroAction">Review Registrations →</Link></section>
  <section className="analytics-split"><article className="dashboardCard p-6"><div className="section-heading"><div><h2>Request Status</h2><p className="muted text-xs">Counts across the full workflow</p></div><span className="badge">{total} Total</span></div><div className="analytics-status-list">{statuses.map(status=>{const value=count(status),barWidth=total?Math.round(value/total*100):0;return <div key={status}><span><strong>{displayLabel(status)}</strong><small>{value} Request{value===1?'':'s'}</small></span><div><i style={{width:`${barWidth}%`}}/></div></div>})}</div></article><article className="dashboardCard p-6"><div className="section-heading"><div><h2>Duty Categories</h2><p className="muted text-xs">Registered duty totals</p></div></div><div className="category-analytics">{['excused','waived','unexcused'].map(type=>{const value=rows.filter(row=>row.duty_type===type).reduce((sum,row)=>sum+row.duty_count,0);return <div key={type}><span>{displayLabel(type)}</span><strong>{value}</strong><small>Duties</small></div>})}</div></article></section>
  <section><div className="section-heading mb-4"><div><h2>Students by Batch</h2><p className="muted text-xs">Account and review workload</p></div><Link href="/admin/batches" className="adminTextLink">Manage Batches →</Link></div><div className="batch-analytics-grid">{batchConfigs.map(batch=>{const batchStudents=studentRows.filter(student=>student.batch===batch.name).length;const pending=rows.filter((row:any)=>row.status==='pending'&&row.users?.batch===batch.name).length;return <Link data-searchable href={'/admin/verification?batch='+encodeURIComponent(batch.name)} key={batch.name} className="dashboardCard batch-analytics-card"><span className="batch-color" style={{background:batch.theme_color}}/><div><strong>{batch.name}</strong><small>{batch.year_level} year · {batch.student_year_prefix} IDs</small></div><p><b>{batchStudents}</b><small>Students</small></p><p><b>{pending}</b><small>Pending</small></p><span className={`status-chip ${batch.is_active?'is-active':'is-archived'}`}>{batch.is_active?'Active':'Archived'}</span></Link>})}</div></section>
 </div>
}
