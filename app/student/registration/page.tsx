import {requireUser} from '@/lib/auth'
import DutyCalendar from '@/components/DutyCalendar'
import {getStudentSchedules} from '@/lib/cached-data'
import {displayLabel} from '@/lib/labels'
export default async function Page({searchParams}:{searchParams:{message?:string;error?:string}}) {
 const {supabase,user,profile}=await requireUser('student')
 const today=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Manila'})
 const [{data:schedules,error},{data:registrations}]=await Promise.all([
  getStudentSchedules(profile.batch,profile.year_level,today),
  supabase.from('registrations').select('registration_id,schedule_id,duty_type,duty_count,status,remarks,submitted_at,mud_schedules(date,time_slot)').eq('student_id',user.id).order('submitted_at',{ascending:false})
 ])
 const activeRegistrations=(registrations||[]).filter(r=>r.status!=='denied')
 const registeredScheduleIds=activeRegistrations.map(r=>r.schedule_id)
 const registeredRegistrationIds=Object.fromEntries(activeRegistrations.map(r=>[r.schedule_id,r.registration_id]))
 const registrationRows=(registrations||[]).map(r=>({...r,mud_schedules:Array.isArray(r.mud_schedules)?r.mud_schedules[0]:r.mud_schedules}))
 return <div><p className="eyebrow">PLAN YOUR NEXT DUTY</p><h1>Duty registration</h1><p className="muted">Choose an available date, attach your documents, and submit for review.</p>{searchParams.message&&<p role="status" className="notice">{searchParams.message}</p>}{searchParams.error&&<p role="alert" className="notice">{searchParams.error}</p>}{error&&<p role="alert" className="notice">Unable to load schedules. Check the database setup.</p>}<DutyCalendar schedules={schedules||[]} registeredScheduleIds={registeredScheduleIds} registeredRegistrationIds={registeredRegistrationIds}/><h2 id="your-registrations" className="text-lg font-semibold mb-4">Your registrations</h2><div className="table-wrap"><table><thead><tr><th>Schedule</th><th>Category</th><th>Duties</th><th>Status</th><th>Remarks</th></tr></thead><tbody>{registrationRows.map(r=><tr id={`registration-${r.registration_id}`} key={r.registration_id}><td>{r.mud_schedules?.date} · {r.mud_schedules?.time_slot}</td><td>{displayLabel(r.duty_type)}</td><td>{r.duty_count}</td><td><span className="badge">{displayLabel(r.status)}</span></td><td>{r.remarks||'—'}</td></tr>)}</tbody></table></div>{!registrationRows.length&&<p className="muted mt-4">No registrations yet.</p>}</div>
}

