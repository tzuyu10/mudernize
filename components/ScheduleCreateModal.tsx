'use client'

import { useRef } from 'react'
import { createSchedule } from '@/app/admin/schedule/actions'
import styles from './ScheduleCreateModal.module.css'
import {displayLabel} from '@/lib/labels'

export default function ScheduleCreateModal({batches}:{batches:readonly string[]}) {
  const dialog=useRef<HTMLDialogElement>(null)
  const form=useRef<HTMLFormElement>(null)
  const today=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Manila'})
  async function submit(formData:FormData){
    await createSchedule(formData)
    form.current?.reset()
    dialog.current?.close()
  }

  return <>
    <button type="button" className={`primary ${styles.trigger}`} onClick={()=>dialog.current?.showModal()}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
      Add schedule
    </button>
    <dialog ref={dialog} className={styles.dialog} aria-labelledby="create-schedule-title" onClick={event=>{if(event.target===event.currentTarget)dialog.current?.close()}}>
      <div className={styles.panel}>
        <div className={styles.heading}>
          <div><p className="eyebrow">DUTY CALENDAR</p><h2 id="create-schedule-title">Add a schedule</h2><p>Create a date students can select during registration.</p></div>
          <button type="button" className={styles.close} onClick={()=>dialog.current?.close()} aria-label="Close add schedule dialog">×</button>
        </div>
        <form ref={form} action={submit} className={styles.form} onSubmit={event=>{if(!window.confirm('Create this duty schedule?'))event.preventDefault()}}>
          <div className={styles.grid}>
            <label>Date<input type="date" name="date" min={today} required/></label>
            <label>Time<select name="time_slot" defaultValue="AM"><option>AM</option><option>PM</option></select></label>
            <label>Capacity<input name="max_capacity" type="number" min="1" max="200" defaultValue="10" required/></label>
            <label>Clinical area<input name="clinical_area" required maxLength={150} placeholder="e.g. Medical Ward"/></label>
            <label>Batch<select name="batch" defaultValue=""><option value="">All Batches</option>{batches.map(batch=><option key={batch}>{batch}</option>)}</select></label>
            <label>Year<select name="year_level" defaultValue="all">{['all','2nd','3rd','4th'].map(year=><option key={year} value={year}>{displayLabel(year)}</option>)}</select></label>
            <label>Status<select name="status" defaultValue="open"><option value="open">Open</option><option value="closed">Closed</option></select></label>
          </div>
          <div className={styles.actions}><button type="button" className={`adminSecondary ${styles.cancel}`} onClick={()=>{form.current?.reset();dialog.current?.close()}}>Cancel</button><button className="primary">Add Schedule</button></div>
        </form>
      </div>
    </dialog>
  </>
}
