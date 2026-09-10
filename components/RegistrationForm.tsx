'use client'
import {useState} from 'react'
import {useFormStatus} from 'react-dom'
import {registerForSchedule} from '@/app/student/registration/actions'

function Submit(){
 const {pending}=useFormStatus()
 return <button disabled={pending} onClick={event=>{const form=event.currentTarget.form;if(form?.checkValidity()&&!window.confirm('Submit this 1:1 duty registration for Clinical Head review?'))event.preventDefault()}} className="primary w-full">{pending?'Uploading & submitting…':'Submit for review'}</button>
}

export default function RegistrationForm({id,scheduleDate,embedded=false}:{id:string;scheduleDate:string;embedded?:boolean}){
 const [type,setType]=useState('excused'),[missedCount,setMissedCount]=useState(1)
 const today=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Manila'})
 return <form action={registerForSchedule} className={embedded?'space-y-5':'space-y-5 bg-white border rounded-lg p-6'}>
  <input type="hidden" name="schedule_id" value={id}/>
  <label>Duty category<select name="duty_type" value={type} onChange={event=>setType(event.target.value)}><option value="excused">Excused · 1:1</option><option value="unexcused">Unexcused · 1:1</option><option value="waived">Waived · 1:1</option></select></label>
  <label>Absence / appear date<input type="date" name="absence_date" max={today<scheduleDate?today:scheduleDate} required/><small className="muted block mt-2">Enter the original absence or required appearance date. Future dates are not accepted.</small></label>
  <label>Number of missed duties<input type="number" name="missed_count" min="1" max="30" value={missedCount} onChange={event=>setMissedCount(Math.max(1,Math.min(30,Number(event.target.value)||1)))} required/></label>
  <div className="ratio-preview" role="status" aria-live="polite"><span>Automatic duty requirement</span><strong>{missedCount} missed × 1 = {missedCount} {missedCount===1?'duty':'duties'}</strong><small>{type[0].toUpperCase()+type.slice(1)} registrations use a 1:1 ratio.</small></div>
  <p className="text-sm text-slate-500">One registration reserves one schedule seat. The calculated duty requirement is submitted for Clinical Head review.</p>
  {type==='waived'?<><label>Medical certificate<input type="file" name="medcert" accept=".pdf,.jpg,.jpeg,.png" required/></label><label>Excuse letter<input type="file" name="excuse_letter" accept=".pdf,.jpg,.jpeg,.png" required/></label></>:<><label>Payment receipt number<input name="receipt_number" required maxLength={100}/></label><label>Receipt of payment<input type="file" name="receipt" accept=".pdf,.jpg,.jpeg,.png" required/></label></>}
  <p className="text-xs text-slate-500">PDF, JPG or PNG only · Maximum 5 MB per file. Documents are private and visible to you and Clinical Heads.</p><Submit/>
 </form>
}
