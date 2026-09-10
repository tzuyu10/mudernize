import {requireUser} from '@/lib/auth'
import StudentScheduleCalendar from '@/components/StudentScheduleCalendar'
export default async function Page() {
 const {supabase,user}=await requireUser('student')
 const {data,error}=await supabase.from('registrations').select('registration_id,status,duty_type,duty_count,submitted_at,mud_schedules(date,time_slot,clinical_area)').eq('student_id',user.id).in('status',['verified','ongoing','completed']).order('submitted_at',{ascending:false})
 const rows=(data||[]).map(r=>({...r,mud_schedules:Array.isArray(r.mud_schedules)?r.mud_schedules[0]:r.mud_schedules}))
 return <div><p className="eyebrow">YOUR CLINICAL JOURNEY</p><h1>My schedule</h1><p className="muted mb-6">Approved duties and your completion history.</p>{error&&<p className="notice">Unable to load your schedule.</p>}{rows.length?<StudentScheduleCalendar items={rows}/>:<p className="muted">No approved duties yet. Submit a request from Duty registration.</p>}</div>
}
