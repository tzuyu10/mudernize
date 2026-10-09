import {requireUser} from '@/lib/auth'
import {getBatchConfigs} from '@/lib/batch-data'
import {displayLabel} from '@/lib/labels'
import {createSchedule} from './actions'
import ScheduleCreateModal from '@/components/ScheduleCreateModal'
import AdminScheduleCalendar from '@/components/AdminScheduleCalendar'
import ConfirmButton from '@/components/ConfirmButton'
import ResetAfterSubmitForm from '@/components/ResetAfterSubmitForm'
import {getAllSchedules} from '@/lib/cached-data'
import {displayName} from '@/lib/names'

type ScheduleRegistration={
 registration_id:number
 schedule_id:number
 status:string
 duty_type:string
 duty_count:number
 submitted_at:string
 users:{first_name:string;middle_initial:string|null;last_name:string;student_number:string|null;batch:string|null;year_level:string|null;year_section:string|null}|null
}

function Fields({schedule,batches}:{schedule:any;batches:string[]}){
 return <div className="admin-form-grid">
  <label>Date<input type="date" name="date" defaultValue={schedule.date} required/></label>
  <label>Time<select name="time_slot" defaultValue={schedule.time_slot}><option>AM</option><option>PM</option></select></label>
  <label>Capacity<input name="max_capacity" type="number" min="1" max="200" defaultValue={schedule.max_capacity} required/></label>
  <label>Clinical Area<input name="clinical_area" defaultValue={schedule.clinical_area} required maxLength={150}/></label>
  <label>Batch<select name="batch" defaultValue={schedule.batch||''}><option value="">All Batches</option>{batches.map(batch=><option key={batch}>{batch}</option>)}</select></label>
  <label>Year<select name="year_level" defaultValue={schedule.year_level||'all'}>{['all','2nd','3rd','4th'].map(year=><option key={year} value={year}>{displayLabel(year)}</option>)}</select></label>
  <label>Status<select name="status" defaultValue={schedule.status||'open'}><option value="open">Open</option><option value="closed">Closed</option></select></label>
 </div>
}

export default async function Page({searchParams:searchParamsPromise}:{searchParams:Promise<{error?:string;message?:string}>}){
 const searchParams=await searchParamsPromise
 const {supabase}=await requireUser('clinical_head')
 const [{data,error},{data:batchConfigs},{data:registrationLinks,error:registrationLinksError}]=await Promise.all([
  getAllSchedules(),
  getBatchConfigs(),
  supabase.from('registrations').select('registration_id,schedule_id,status,duty_type,duty_count,submitted_at,users!registrations_student_id_fkey(first_name,middle_initial,last_name,student_number,batch,year_level,year_section)')
 ]),schedules=data||[],batches=batchConfigs.map(batch=>batch.name)
 const registrationRows=(registrationLinks||[]).map(row=>({...row,users:(Array.isArray(row.users)?row.users[0]:row.users)||null})) as ScheduleRegistration[]
 const registrationsBySchedule=new Map<number,ScheduleRegistration[]>()
 for(const row of registrationRows)registrationsBySchedule.set(row.schedule_id,[...(registrationsBySchedule.get(row.schedule_id)||[]),row])
 const {data:archived,error:archiveError}=await supabase.from('mud_schedules').select('schedule_id,date,time_slot,clinical_area').not('archived_at','is',null).order('date',{ascending:false})
 const scheduleError=searchParams.error?.includes('registrations_schedule_id_fkey')||searchParams.error?.includes('violates foreign key constraint')?'This schedule cannot be deleted because it has registration history. Archive it to preserve those records.':searchParams.error
 return <div className="space-y-6 page-stack">
  <div className="admin-page-heading page-heading"><div><p className="eyebrow">CLINICAL HEAD WORKSPACE</p><h1>Duty Schedules</h1><p className="muted text-sm">Create and manage the dates available to students.</p></div><ScheduleCreateModal batches={batches}/></div>
  {(scheduleError||error||registrationLinksError)&&<p role="alert" className="notice">{scheduleError||error?.message||(registrationLinksError?'Schedule deletion availability could not be checked. Refresh the page before making changes.':'')}</p>}
  {searchParams.message&&<p role="status" className="notice success-notice">{searchParams.message}</p>}
  <p className="muted text-sm">Dates and audiences are locked once a slot has registrations. Select a calendar entry to open its settings.</p>
  <AdminScheduleCalendar schedules={schedules}/>
  <section className="dashboardCard p-6 space-y-3"><h2>Archived Schedules</h2><p className="muted text-sm">Archived schedules retain their registrations and can be restored.</p>{archiveError?<p role="alert">Archived schedules could not be loaded.</p>:!archived?.length?<p className="muted">No archived schedules.</p>:archived.map(schedule=><div key={schedule.schedule_id} className="schedule-actions"><span>{schedule.date} · {schedule.time_slot} · {schedule.clinical_area}</span><form action={createSchedule}><input type="hidden" name="schedule_id" value={schedule.schedule_id}/><ConfirmButton name="operation" value="restore" className="adminSecondary" message="Restore this schedule as closed?">Restore</ConfirmButton></form></div>)}</section>
  <h2 className="text-lg font-semibold">Schedule Details</h2>
  <div className="space-y-3">{schedules.map(schedule=>{
   const editFormId=`schedule-edit-${schedule.schedule_id}`
   const registrations=registrationsBySchedule.get(schedule.schedule_id)||[]
   const activeRegistrations=registrations.filter(row=>row.status!=='denied'&&row.users).sort((a,b)=>displayName(a.users||{}).localeCompare(displayName(b.users||{}),'en',{sensitivity:'base'}))
   const hasHistory=registrations.length>0
   const isFull=schedule.current_count>=schedule.max_capacity
   return <details id={`schedule-${schedule.schedule_id}`} key={schedule.schedule_id} className="dashboardCard p-5">
    <summary className="cursor-pointer font-semibold"><span className="schedule-summary-content"><span>{schedule.date} · {schedule.time_slot} · {schedule.batch||'All Batches'}</span><span className="badge">{schedule.current_count}/{schedule.max_capacity} · {isFull?'Full':displayLabel(schedule.status)}</span></span></summary>
    {activeRegistrations.length>0&&<section className="schedule-roster" aria-labelledby={`schedule-roster-${schedule.schedule_id}`}>
     <div className="schedule-roster-heading"><div><p className="eyebrow">ASSIGNED STUDENTS</p><h3 id={`schedule-roster-${schedule.schedule_id}`}>Students in this duty slot</h3></div><span className="badge">{activeRegistrations.length} Student{activeRegistrations.length===1?'':'s'}</span></div>
     <div className="schedule-roster-list">{activeRegistrations.map(registration=><article className="schedule-roster-card" key={registration.registration_id}>
      <div className="schedule-roster-student"><span className="schedule-roster-avatar" aria-hidden="true">{registration.users!.first_name[0]}{registration.users!.last_name[0]}</span><div><strong>{displayName(registration.users||{})}</strong><small>{registration.users!.student_number} · {registration.users!.batch}</small></div></div>
      <div className="schedule-roster-meta"><span><small>Year &amp; Section</small><strong>{registration.users!.year_section||`${registration.users!.year_level||'—'} year`}</strong></span><span><small>Duty</small><strong>{displayLabel(registration.duty_type)} · {registration.duty_count}</strong></span><span><small>Status</small><strong className="badge">{displayLabel(registration.status)}</strong></span></div>
     </article>)}</div>
    </section>}
    <ResetAfterSubmitForm id={editFormId} action={createSchedule} className="space-y-4 mt-4"><input type="hidden" name="schedule_id" value={schedule.schedule_id}/><Fields schedule={schedule} batches={batches}/></ResetAfterSubmitForm>
    <div className="schedule-actions"><ConfirmButton form={editFormId} className="primary" message="Save these schedule changes?">Save Changes</ConfirmButton><form action={createSchedule}><input type="hidden" name="schedule_id" value={schedule.schedule_id}/><ConfirmButton name="operation" value="archive" className="adminSecondary" message="Archive this schedule? Its registrations and history will be preserved.">Archive</ConfirmButton></form><form action={createSchedule}><input type="hidden" name="schedule_id" value={schedule.schedule_id}/><ConfirmButton name="operation" value="delete" className="dangerButton" disabled={!!registrationLinksError||hasHistory} message="Permanently delete this empty schedule? This cannot be undone.">Delete</ConfirmButton></form></div>
    {hasHistory&&<p className="schedule-delete-note">This schedule has registration history. Archive preserves those records; Delete is only available for schedules without registrations.</p>}
   </details>
  })}</div>
  {!schedules.length&&!error&&<div className="dashboardCard p-8 text-center muted">No schedules have been created.</div>}
 </div>
}
