'use client'
import {useState} from 'react'
import {useFormStatus} from 'react-dom'
import {registerForSchedule} from '@/app/student/registration/actions'
import {dutyCategories,type DutyCategory,type TallyBalances} from '@/lib/tally'
import {displayLabel} from '@/lib/labels'

function Submit({disabled}:{disabled:boolean}){
 const {pending}=useFormStatus()
 return <button disabled={pending||disabled} onClick={event=>{const form=event.currentTarget.form;if(form?.checkValidity()&&!window.confirm('Submit this 1:1 duty registration for Clinical Head review?'))event.preventDefault()}} className="primary w-full">{pending?'Uploading & submitting…':disabled?'No duties available':'Submit for review'}</button>
}

export default function RegistrationForm({id,scheduleDate,tallyBalances,embedded=false}:{id:string;scheduleDate:string;tallyBalances:TallyBalances;embedded?:boolean}){
 const firstAvailable=dutyCategories.find(category=>tallyBalances[category].remaining>0)||'excused'
 const [type,setType]=useState<DutyCategory>(firstAvailable),[missedCount,setMissedCount]=useState(1)
 const today=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Manila'})
 const balance=tallyBalances[type],maximum=Math.min(30,balance.remaining),disabled=maximum<1
 return <form action={registerForSchedule} className={embedded?'space-y-5':'space-y-5 bg-white border rounded-lg p-6'}>
  <input type="hidden" name="schedule_id" value={id}/>
  <label>Duty category<select name="duty_type" value={type} onChange={event=>{const category=event.target.value as DutyCategory;setType(category);setMissedCount(Math.min(1,tallyBalances[category].remaining))}}>{dutyCategories.map(category=><option key={category} value={category} disabled={tallyBalances[category].remaining<1}>{displayLabel(category)} · {tallyBalances[category].remaining} available</option>)}</select></label>
  <p className="registration-tally-note"><strong>{balance.remaining} duties available</strong><span>{balance.registered} already registered · {balance.required} duties still required.</span></p>
  <label>Absence / appear date<input type="date" name="absence_date" max={today<scheduleDate?today:scheduleDate} required/><small className="muted block mt-2">Enter the original absence or required appearance date. Future dates are not accepted.</small></label>
  <label>Number of duties to register<input type="number" name="missed_count" min="1" max={Math.max(1,maximum)} value={missedCount||1} onChange={event=>setMissedCount(Math.max(1,Math.min(Math.max(1,maximum),Number(event.target.value)||1)))} disabled={disabled} required/></label>
  <p className="text-sm text-slate-500">One registration reserves one schedule seat. Your number of missed duties is submitted for Clinical Head review.</p>
  {type==='waived'?<><label>Medical certificate<input type="file" name="medcert" accept=".pdf,.jpg,.jpeg,.png" required/></label><label>Excuse letter<input type="file" name="excuse_letter" accept=".pdf,.jpg,.jpeg,.png" required/></label></>:<><label>Payment receipt number<input name="receipt_number" required maxLength={100}/></label><label>Receipt of payment<input type="file" name="receipt" accept=".pdf,.jpg,.jpeg,.png" required/></label></>}
  <p className="text-xs text-slate-500">PDF, JPG or PNG only · Maximum 5 MB per file. Documents are private and visible to you and Clinical Heads.</p><Submit disabled={disabled}/>
 </form>
}