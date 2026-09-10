import {requireUser,batches} from '@/lib/auth'
import {displayLabel} from '@/lib/labels'
import {createSchedule} from './actions'
import ScheduleCreateModal from '@/components/ScheduleCreateModal'
import AdminScheduleCalendar from '@/components/AdminScheduleCalendar'
import ConfirmButton from '@/components/ConfirmButton'
import ResetAfterSubmitForm from '@/components/ResetAfterSubmitForm'
import {getAllSchedules} from '@/lib/cached-data'

function Fields({schedule}:{schedule:any}){
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

export default async function Page({searchParams}:{searchParams:{error?:string;message?:string}}){
 await requireUser('clinical_head')
 const {data,error}=await getAllSchedules(),schedules=data||[]
 return <div className="space-y-6">
  <div className="admin-page-heading"><div><p className="eyebrow">CLINICAL HEAD WORKSPACE</p><h1>Duty Schedules</h1><p className="muted text-sm">Create and manage the dates available to students.</p></div><ScheduleCreateModal batches={batches}/></div>
  {(searchParams.error||error)&&<p role="alert" className="notice">{searchParams.error||error?.message}</p>}
  {searchParams.message&&<p role="status" className="notice success-notice">{searchParams.message}</p>}
  <p className="muted text-sm">Dates and audiences are locked once a slot has registrations. Select a calendar entry to open its settings.</p>
  <AdminScheduleCalendar schedules={schedules}/>
  <h2 className="text-lg font-semibold">Schedule Details</h2>
  <div className="space-y-3">{schedules.map(schedule=>{const editFormId=`schedule-edit-${schedule.schedule_id}`;return <details id={`schedule-${schedule.schedule_id}`} key={schedule.schedule_id} className="dashboardCard p-5"><summary className="cursor-pointer font-semibold">{schedule.date} · {schedule.time_slot} · {schedule.batch||'All Batches'} <span className="badge">{schedule.current_count}/{schedule.max_capacity} · {displayLabel(schedule.status)}</span></summary><ResetAfterSubmitForm id={editFormId} action={createSchedule} className="space-y-4 mt-4"><input type="hidden" name="schedule_id" value={schedule.schedule_id}/><Fields schedule={schedule}/></ResetAfterSubmitForm><div className="schedule-actions"><ConfirmButton form={editFormId} className="primary" message="Save these schedule changes?">Save Changes</ConfirmButton><form action={createSchedule}><input type="hidden" name="schedule_id" value={schedule.schedule_id}/><ConfirmButton message="Delete this empty schedule? This action cannot be undone." name="operation" value="delete" className="dangerButton">Delete Empty Schedule</ConfirmButton></form></div></details>})}</div>
  {!schedules.length&&!error&&<div className="dashboardCard p-8 text-center muted">No schedules have been created.</div>}
 </div>
}
