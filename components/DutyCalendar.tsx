'use client'

import { useMemo, useRef, useState } from 'react'
import styles from './DutyCalendar.module.css'
import modalStyles from './ScheduleCreateModal.module.css'
import RegistrationForm from './RegistrationForm'
import type {TallyBalances} from '@/lib/tally'

type Schedule={schedule_id:number;date:string;time_slot:'AM'|'PM';max_capacity:number;current_count:number}
type StatusIcon='available'|'registered'|'unavailable'|'full'

function StatusMark({name}:{name:StatusIcon}) {
 const paths={
  available:<><circle cx="12" cy="12" r="9"/><path d="m9 12 2 2 4-4"/></>,
  registered:<><path d="M5 3h14v18H5z"/><path d="m8 12 2 2 5-5"/></>,
  unavailable:<><circle cx="12" cy="12" r="9"/><path d="M8 12h8"/></>,
  full:<><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>
 }
 return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
}

export default function DutyCalendar({schedules,registeredScheduleIds=[],registeredRegistrationIds={},tallyBalances}:{schedules:Schedule[];registeredScheduleIds?:number[];registeredRegistrationIds?:Record<number,number>;tallyBalances:TallyBalances}) {
 const today=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Manila'})
 const firstMonth=today.slice(0,7)
 const lastMonth=schedules[schedules.length-1]?.date.slice(0,7)||firstMonth
 const [month,setMonth]=useState(firstMonth)
 const [selected,setSelected]=useState<Schedule|null>(null)
 const dialog=useRef<HTMLDialogElement>(null)
 const registered=useMemo(()=>new Set(registeredScheduleIds),[registeredScheduleIds])
 const [year,monthNumber]=month.split('-').map(Number)
 const firstWeekday=new Date(year,monthNumber-1,1).getDay()
 const days=new Date(year,monthNumber,0).getDate()
 const monthLabel=new Intl.DateTimeFormat('en-PH',{month:'long',year:'numeric'}).format(new Date(year,monthNumber-1,1))
 const monthSchedules=schedules.filter(schedule=>schedule.date.startsWith(month))
 const hasAvailableTally=Object.values(tallyBalances).some(balance=>balance.remaining>0)
 const availableCount=hasAvailableTally?monthSchedules.filter(schedule=>schedule.date>=today&&schedule.current_count<schedule.max_capacity&&!registered.has(schedule.schedule_id)).length:0
 const registeredCount=monthSchedules.filter(schedule=>registered.has(schedule.schedule_id)).length
 const fullCount=monthSchedules.filter(schedule=>schedule.current_count>=schedule.max_capacity&&!registered.has(schedule.schedule_id)).length

 function moveMonth(change:number) {
  const next=new Date(year,monthNumber-1+change,1)
  const value=`${next.getFullYear()}-${String(next.getMonth()+1).padStart(2,'0')}`
  if(value>=firstMonth&&value<=lastMonth)setMonth(value)
 }
 function openRegistration(schedule:Schedule){setSelected(schedule);requestAnimationFrame(()=>dialog.current?.showModal())}

 return <section className={styles.section} aria-labelledby="calendar-title">
  <div className={styles.header}>
   <div><p className={styles.kicker}>SELECT A DUTY DATE</p><h2 id="calendar-title">Registration calendar</h2><p>Choose an available schedule. Registered entries open your existing request.</p></div>
   <div className={styles.controls}>
    <button type="button" onClick={()=>moveMonth(-1)} disabled={month<=firstMonth} aria-label="Previous month">‹</button>
    <label><span>Month</span><input type="month" min={firstMonth} max={lastMonth} value={month} onChange={event=>event.target.value&&setMonth(event.target.value)} aria-label="Calendar month"/></label>
    <button type="button" onClick={()=>moveMonth(1)} disabled={month>=lastMonth} aria-label="Next month">›</button>
   </div>
  </div>
  <div className={styles.monthSummary} aria-live="polite"><strong>{monthLabel}</strong><span className={styles.availableCount}><StatusMark name="available"/>{availableCount} available</span><span><StatusMark name="registered"/>{registeredCount} registered</span>{fullCount>0&&<span><StatusMark name="full"/>{fullCount} full</span>}</div>
  <div className={styles.legend} aria-label="Calendar legend"><span className={styles.availableLegend}><StatusMark name="available"/>Available to select</span><span className={styles.registeredLegend}><StatusMark name="registered"/>Your registration</span><span className={styles.unavailableLegend}><StatusMark name="unavailable"/>Past or not scheduled</span><span className={styles.fullLegend}><StatusMark name="full"/>No slots remaining</span></div>
  <p className={styles.mobileHint}>Swipe sideways to view every day of the month.</p>
  <div className={styles.calendarViewport} tabIndex={0} aria-label={`${monthLabel} duty calendar, horizontally scrollable on small screens`}>
   <div className={styles.calendar}>
    {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((day,index)=><div className={`${styles.weekday} ${(index===0||index===6)?styles.weekend:''}`} key={day}>{day}</div>)}
    {Array.from({length:firstWeekday},(_,index)=><div className={styles.blank} aria-hidden="true" key={`blank-${index}`}/>)}
    {Array.from({length:days},(_,index)=>{
     const day=index+1
     const date=`${month}-${String(day).padStart(2,'0')}`
     const daySchedules=monthSchedules.filter(schedule=>schedule.date===date)
     const hasRegistered=daySchedules.some(schedule=>registered.has(schedule.schedule_id))
     const unavailable=date<today||daySchedules.length===0||(!hasAvailableTally&&!hasRegistered)||daySchedules.every(schedule=>registered.has(schedule.schedule_id)||schedule.current_count>=schedule.max_capacity)
     const isToday=date===today
     const dateLabel=new Intl.DateTimeFormat('en-PH',{weekday:'long',month:'long',day:'numeric',year:'numeric',timeZone:'Asia/Manila'}).format(new Date(`${date}T00:00:00+08:00`))
     return <article key={date} className={`${styles.day} ${unavailable?styles.unavailable:styles.available} ${isToday?styles.today:''}`} aria-label={`${dateLabel}${isToday?', today':''}`} aria-disabled={unavailable&&!hasRegistered}>
      <div className={styles.dayHead}><time dateTime={date}>{day}</time>{isToday&&<span>Today</span>}</div>
      <div className={styles.slots}>
       {daySchedules.map(schedule=>registered.has(schedule.schedule_id)
        ? <a className={styles.registered} key={schedule.schedule_id} href={`#registration-${registeredRegistrationIds[schedule.schedule_id]??schedule.schedule_id}`} aria-label={`${schedule.time_slot}, registered. View your request`}><StatusMark name="registered"/><span><strong>{schedule.time_slot} · Registered</strong><small>View request</small></span><b aria-hidden="true">→</b></a>
        : date<today
         ? null
         : !hasAvailableTally
         ? <span className={styles.full} key={schedule.schedule_id}><StatusMark name="unavailable"/><span><strong>{schedule.time_slot} · No duty balance</strong><small>Ask your Clinical Head to update your tally</small></span></span>
         : schedule.current_count>=schedule.max_capacity
         ? <span className={styles.full} key={schedule.schedule_id}><StatusMark name="full"/><span><strong>{schedule.time_slot} · Full</strong><small>No slots remaining</small></span></span>
         : <button type="button" className={styles.slotLink} key={schedule.schedule_id} onClick={()=>openRegistration(schedule)} aria-label={`Register for ${dateLabel}, ${schedule.time_slot}. ${schedule.max_capacity-schedule.current_count} slots left`}><StatusMark name="available"/><span><strong>{schedule.time_slot} · Available</strong><small>{schedule.max_capacity-schedule.current_count} slots left</small></span><b aria-hidden="true">→</b></button>)}
       {(daySchedules.length===0||date<today)&&<span className={styles.noSchedule}><StatusMark name="unavailable"/>{date<today?'Past date':'Not scheduled'}</span>}
      </div>
     </article>
    })}
   </div>
  </div>
  {availableCount===0&&<p className={styles.empty}><StatusMark name="unavailable"/><span><strong>No selectable schedules in {monthLabel}.</strong><small>{hasAvailableTally?'A Clinical Head must publish an open schedule with available slots for your batch and year.':'Your Clinical Head must add an available duty tally before you can register.'}</small></span></p>}
  <dialog ref={dialog} className={modalStyles.dialog} aria-labelledby="create-registration-title" onClose={()=>setSelected(null)} onClick={event=>{if(event.target===event.currentTarget)dialog.current?.close()}}><div className={modalStyles.panel}><div className={modalStyles.heading}><div><p className="eyebrow">DUTY REGISTRATION</p><h2 id="create-registration-title">Create a registration</h2><p>{selected?`${selected.date} · ${selected.time_slot}`:'Select an available schedule.'}</p></div><button type="button" className={modalStyles.close} onClick={()=>dialog.current?.close()} aria-label="Close registration dialog">×</button></div>{selected&&<div className={modalStyles.form}><RegistrationForm id={String(selected.schedule_id)} scheduleDate={selected.date} tallyBalances={tallyBalances} embedded/></div>}</div></dialog>
 </section>
}
