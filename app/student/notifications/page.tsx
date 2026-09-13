import {requireUser} from '@/lib/auth'
import {displayLabel} from '@/lib/labels'

export default async function Page(){
 const {supabase,user}=await requireUser('student')
 const {data,error}=await supabase.from('registrations').select('registration_id,status,remarks,recommendation,verified_at,submitted_at,mud_schedules(date,time_slot)').eq('student_id',user.id).neq('status','pending').order('verified_at',{ascending:false}).limit(50)
 const rows=(data||[]).map(row=>({...row,mud_schedules:Array.isArray(row.mud_schedules)?row.mud_schedules[0]:row.mud_schedules}))
 return <div className="space-y-5 page-stack"><div className="page-heading"><p className="eyebrow">REGISTRATION UPDATES</p><h1>Notifications</h1><p className="muted text-sm">Approvals, denials, duty starts, and completed duty updates from your Clinical Head.</p></div>{error&&<p className="notice" role="alert">Unable to load notifications.</p>}<div className="space-y-3">{rows.map(row=><article className={`dashboardCard notification-card ${row.status==='denied'?'notification-denied':''}`} key={row.registration_id} data-searchable><span className="notification-status">{row.status==='denied'?'!':'✓'}</span><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold capitalize">Registration {displayLabel(row.status)}</h2><span className="badge">{displayLabel(row.status)}</span></div><p className="muted text-sm mt-2">{row.mud_schedules?.date} · {row.mud_schedules?.time_slot} · {row.recommendation?displayLabel(row.recommendation):'Awaiting Recommendation'}</p>{row.remarks&&<p className="text-sm mt-2">Clinical Head note: {row.remarks}</p>}<time className="muted text-xs block mt-3">Updated {new Date(row.verified_at||row.submitted_at).toLocaleString('en-PH',{timeZone:'Asia/Manila'})}</time></div></article>)}</div>{!rows.length&&!error&&<div className="dashboardCard p-8 text-center muted">No registration updates yet.</div>}</div>
}


