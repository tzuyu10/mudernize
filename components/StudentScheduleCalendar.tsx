'use client'
import {useState} from 'react'
import {useFormStatus} from 'react-dom'
import styles from './DutyCalendar.module.css'
import {displayLabel} from '@/lib/labels'
import {completeScheduledDuty} from '@/app/student/schedule/actions'

type Item={registration_id:number;status:string;duty_type:string;duty_count:number;mud_schedules?:{date:string;time_slot:string;clinical_area:string}|null}
function Mark({status}:{status:string}){
 return <svg viewBox="0 0 24 24" aria-hidden="true">{status==='completed'?<><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></>:status==='ongoing'?<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>:<><path d="M5 3h14v18H5z"/><path d="m8 12 2 2 5-5"/></>}</svg>
}

function CompleteButton(){
 const {pending}=useFormStatus()
 return <button type="submit" className={styles.completeButton} disabled={pending} onClick={event=>{if(!window.confirm('Mark this scheduled duty as completed?'))event.preventDefault()}}>{pending?'Saving…':'✓ Mark complete'}</button>
}

function ScheduleEntry({item,today}:{item:Item;today:string}){
 const date=item.mud_schedules!.date
 const canComplete=item.status!=='completed'&&date<=today
 const className=item.status==='completed'?styles.slotLink:item.status==='ongoing'?styles.registered:styles.approved
 return <div className={className}>
  <Mark status={item.status}/>
  <div className={styles.slotDetails}><strong>{item.mud_schedules?.time_slot} · {displayLabel(item.status)}</strong><small>{displayLabel(item.duty_type)} · {item.duty_count} duties</small><small>{item.mud_schedules?.clinical_area}</small>
   {canComplete?<form action={completeScheduledDuty} className={styles.completionForm}><input type="hidden" name="registration_id" value={item.registration_id}/><CompleteButton/></form>:item.status!=='completed'?<small className={styles.completionHint}>Completion opens on the scheduled date.</small>:<small className={styles.completionDone}>✓ Completion recorded</small>}
  </div>
 </div>
}

export default function StudentScheduleCalendar({items}:{items:Item[]}){
 const today=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Manila'})
 const dated=items.filter(item=>item.mud_schedules?.date)
 const months=[...new Set(dated.map(item=>item.mud_schedules!.date.slice(0,7)))].sort()
 const initial=months.find(value=>value>=today.slice(0,7))||months.at(-1)||today.slice(0,7)
 const [month,setMonth]=useState(initial)
 const [year,monthNumber]=month.split('-').map(Number)
 const offset=new Date(year,monthNumber-1,1).getDay(),days=new Date(year,monthNumber,0).getDate()
 const label=new Intl.DateTimeFormat('en-PH',{month:'long',year:'numeric'}).format(new Date(year,monthNumber-1,1))
 const monthItems=dated.filter(item=>item.mud_schedules?.date.startsWith(month))
 function move(change:number){const next=new Date(year,monthNumber-1+change,1);setMonth(`${next.getFullYear()}-${String(next.getMonth()+1).padStart(2,'0')}`)}
 return <section className={styles.section} aria-labelledby="my-calendar-title">
  <div className={styles.header}><div><p className={styles.kicker}>YOUR CLINICAL JOURNEY</p><h2 id="my-calendar-title">My schedule calendar</h2><p>Approved, ongoing, and completed duties use the same calendar view as registration.</p></div><div className={styles.controls}><button type="button" onClick={()=>move(-1)} aria-label="Previous month">‹</button><label><span>Month</span><input type="month" value={month} onChange={event=>event.target.value&&setMonth(event.target.value)} aria-label="Calendar month"/></label><button type="button" onClick={()=>move(1)} aria-label="Next month">›</button></div></div>
  <div className={styles.monthSummary}><strong>{label}</strong><span className={styles.availableCount}><Mark status="completed"/>{monthItems.filter(item=>item.status==='completed').length} Completed</span><span><Mark status="ongoing"/>{monthItems.filter(item=>item.status==='ongoing').length} Ongoing</span><span><Mark status="verified"/>{monthItems.filter(item=>item.status==='verified').length} Approved</span></div>
  <div className={styles.legend}><span className={styles.availableLegend}><Mark status="completed"/>Completed</span><span className={styles.registeredLegend}><Mark status="ongoing"/>Ongoing</span><span className={styles.approvedLegend}><Mark status="verified"/>Approved</span></div><p className={styles.mobileHint}>Swipe sideways to view every day of the month.</p>
  <div className={styles.calendarViewport} tabIndex={0} aria-label={`${label} student schedule calendar, horizontally scrollable on small screens`}><div className={styles.calendar}>{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((day,index)=><div className={`${styles.weekday} ${(index===0||index===6)?styles.weekend:''}`} key={day}>{day}</div>)}{Array.from({length:offset},(_,index)=><div className={styles.blank} aria-hidden="true" key={`blank-${index}`}/>)}{Array.from({length:days},(_,index)=>{const date=`${month}-${String(index+1).padStart(2,'0')}`,entries=monthItems.filter(item=>item.mud_schedules?.date===date);return <article key={date} className={`${styles.day} ${entries.length?styles.available:styles.unavailable} ${date===today?styles.today:''}`}><div className={styles.dayHead}><time dateTime={date}>{index+1}</time>{date===today&&<span>Today</span>}</div><div className={styles.slots}>{entries.map(item=><ScheduleEntry item={item} today={today} key={item.registration_id}/>)}{!entries.length&&<span className={styles.noSchedule}>No assigned duty</span>}</div></article>})}</div></div>
 </section>
}


