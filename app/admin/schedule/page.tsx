import {requireUser} from '@/lib/auth'
import {getBatchConfigs} from '@/lib/batch-data'
import {displayLabel} from '@/lib/labels'
import {createSchedule} from './actions'
import ScheduleCreateModal from '@/components/ScheduleCreateModal'
import AdminScheduleCalendar from '@/components/AdminScheduleCalendar'
import ConfirmButton from '@/components/ConfirmButton'
import ResetAfterSubmitForm from '@/components/ResetAfterSubmitForm'
import {getAllSchedules} from '@/lib/cached-data'

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
 const [{data,error},{data:batchConfigs},{data:registrationLinks,error:registrationLinksError}]=await Promise.all([getAllSchedules(),getBatchConfigs(),supabase.from('registrations').select('schedule_id')]),schedules=data||[],batches=batchConfigs.map(batch=>batch.name),linkedScheduleIds=new Set((registrationLinks||[]).map(row=>row.schedule_id))
 const scheduleError=searchParams.error?.includes('registrations_schedule_id_fkey')||searchParams.error?.includes('violates foreign key constraint')?'This schedule cannot be deleted because it has registration history. Close the schedule to keep it unavailable.':searchParams.error
 return <div className="space-y-6 page-stack">
  <div className="admin-page-heading page-heading"><div><p className="eyebrow">CLINICAL HEAD WORKSPACE</p><h1>Duty Schedules</h1><p className="muted text-sm">Create and manage the dates available to students.</p></div><ScheduleCreateModal batches={batches}/></div>
  {(scheduleError||error||registrationLinksError)&&<p role="alert" className="notice">{scheduleError||error?.message||(registrationLinksError?'Schedule deletion availability could not be checked. Refresh the page before making changes.':'')}</p>}
  {searchParams.message&&<p role="status" className="notice success-notice">{searchParams.message}</p>}
  <p className="muted text-sm">Dates and audiences are locked once a slot has registrations. Select a calendar entry to open its settings.</p>
  <AdminScheduleCalendar schedules={schedules}/>
  <h2 className="text-lg font-semibold">Schedule Details</h2>
  <div className="space-y-3">{schedules.map(schedule=>{const editFormId=`schedule-edit-${schedule.schedule_id}`,hasRegistrationHistory=registrationLinksError||linkedScheduleIds.has(schedule.schedule_id);return <details id={`schedule-${schedule.schedule_id}`} key={schedule.schedule_id} className="dashboardCard p-5"><summary className="cursor-pointer font-semibold">{schedule.date} · {schedule.time_slot} · {schedule.batch||'All Batches'} <span className="badge">{schedule.current_count}/{schedule.max_capacity} · {displayLabel(schedule.status)}</span></summary><ResetAfterSubmitForm id={editFormId} action={createSchedule} className="space-y-4 mt-4"><input type="hidden" name="schedule_id" value={schedule.schedule_id}/><Fields schedule={schedule} batches={batches}/></ResetAfterSubmitForm><div className="schedule-actions"><ConfirmButton form={editFormId} className="primary" message="Save these schedule changes?">Save Changes</ConfirmButton>{hasRegistrationHistory?<button type="button" className="dangerButton" disabled title="Schedules with registration history must be retained">Deletion Unavailable</button>:<form action={createSchedule}><input type="hidden" name="schedule_id" value={schedule.schedule_id}/><ConfirmButton message="Delete this empty schedule? This action cannot be undone." name="operation" value="delete" className="dangerButton">Delete Empty Schedule</ConfirmButton></form>}</div>{hasRegistrationHistory&&<p className="schedule-delete-note">This schedule has registration history. Set its status to Closed if students should no longer use it.</p>}</details>})}</div>
  {!schedules.length&&!error&&<div className="dashboardCard p-8 text-center muted">No schedules have been created.</div>}
 </div>
}
