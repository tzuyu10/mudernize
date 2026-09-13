import {requireUser} from '@/lib/auth'
import StudentScheduleCalendar from '@/components/StudentScheduleCalendar'
export default async function Page({searchParams}:{searchParams:{error?:string;message?:string}}) {
 const {supabase,user}=await requireUser('student')
 const {data,error}=await supabase.from('registrations').select('registration_id,status,duty_type,duty_count,submitted_at,mud_schedules(date,time_slot,clinical_area)').eq('student_id',user.id).in('status',['verified','ongoing','completed']).order('submitted_at',{ascending:false})
 const rows=(data||[]).map(r=>({...r,mud_schedules:Array.isArray(r.mud_schedules)?r.mud_schedules[0]:r.mud_schedules}))
 return <div className="page-stack"><div className="page-heading"><p className="eyebrow">YOUR CLINICAL JOURNEY</p><h1>My schedule</h1><p className="muted text-sm">Approved duties and your completion history.</p></div>{(error||searchParams.error)&&<p className="notice" role="alert">{searchParams.error||'Unable to load your schedule.'}</p>}{searchParams.message&&<p className="notice success-notice" role="status">{searchParams.message}</p>}{rows.length?<StudentScheduleCalendar items={rows}/>:<div className="dashboardCard empty-state">No approved duties yet. Submit a request from Duty registration.</div>}</div>
}
