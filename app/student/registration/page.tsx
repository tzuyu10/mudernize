import {requireUser} from '@/lib/auth'
import DutyCalendar from '@/components/DutyCalendar'
import {getStudentSchedules} from '@/lib/cached-data'
import {displayLabel} from '@/lib/labels'
import {calculateTallyBalances} from '@/lib/tally'
export default async function Page({searchParams:searchParamsPromise}:{searchParams:Promise<{message?:string;error?:string}>}) {
 const searchParams=await searchParamsPromise
 const {supabase,user,profile}=await requireUser('student')
 const today=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Manila'})
 const [{data:schedules,error},{data:registrations},{data:adjustments,error:tallyError}]=await Promise.all([
  getStudentSchedules(profile.batch,profile.year_level,today),
  supabase.from('registrations').select('registration_id,schedule_id,duty_type,duty_count,status,remarks,submitted_at,mud_schedules(date,time_slot)').eq('student_id',user.id).order('submitted_at',{ascending:false}),
  supabase.from('tally_adjustments').select('duty_type,signed_total').eq('student_id',user.id)
 ])
 const activeRegistrations=(registrations||[]).filter(r=>r.status!=='denied')
 const registeredScheduleIds=activeRegistrations.map(r=>r.schedule_id)
 const registeredRegistrationIds=Object.fromEntries(activeRegistrations.map(r=>[r.schedule_id,r.registration_id]))
 const registrationRows=(registrations||[]).map(r=>({...r,mud_schedules:Array.isArray(r.mud_schedules)?r.mud_schedules[0]:r.mud_schedules}))
 const tallyBalances=calculateTallyBalances(adjustments,registrations)
 return <div className="page-stack"><div className="page-heading"><p className="eyebrow">PLAN YOUR NEXT DUTY</p><h1>Duty registration</h1><p className="muted text-sm">Choose an available date, attach your documents, and submit for review.</p></div>{searchParams.message&&<p role="status" className="notice">{searchParams.message}</p>}{searchParams.error&&<p role="alert" className="notice">{searchParams.error}</p>}{(error||tallyError)&&<p role="alert" className="notice">Unable to load schedules or duty tallies. Check the database setup.</p>}<section className="registration-balance-grid" aria-label="Duties available to register">{Object.entries(tallyBalances).map(([category,balance])=><article className="dashboardCard p-4" key={category}><span>{displayLabel(category)}</span><strong className="themeValue">{balance.remaining}</strong><small className="muted">Available of {balance.required} required</small></article>)}</section><DutyCalendar schedules={schedules||[]} registeredScheduleIds={registeredScheduleIds} registeredRegistrationIds={registeredRegistrationIds} tallyBalances={tallyBalances}/><section><h2 id="your-registrations" className="text-lg font-semibold mb-4">Your registrations</h2><div className="table-wrap"><table className="responsive-data-table"><thead><tr><th>Schedule</th><th>Category</th><th>Duties</th><th>Status</th><th>Remarks</th></tr></thead><tbody>{registrationRows.map(r=><tr id={`registration-${r.registration_id}`} key={r.registration_id}><td data-label="Schedule">{r.mud_schedules?.date} · {r.mud_schedules?.time_slot}</td><td data-label="Category">{displayLabel(r.duty_type)}</td><td data-label="Duties">{r.duty_count}</td><td data-label="Status"><span className="badge">{displayLabel(r.status)}</span></td><td data-label="Remarks">{r.remarks||'—'}</td></tr>)}</tbody></table></div>{!registrationRows.length&&<p className="muted mt-4">No registrations yet.</p>}</section></div>
}

