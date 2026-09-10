'use client'
import {useRef,useState} from 'react'
import {adjustStudentTally} from '@/app/admin/students/actions'
import ConfirmButton from './ConfirmButton'
import {displayLabel} from '@/lib/labels'

type DutyType='excused'|'waived'|'unexcused'
export default function TallyAdjustmentForm({userId,studentName,dutyType}:{userId:string;studentName:string;dutyType:DutyType}){
 const [ratio,setRatio]=useState(3),[missed,setMissed]=useState(1)
 const details=useRef<HTMLDetailsElement>(null)
 const multiplier=dutyType==='unexcused'?ratio:1,total=missed*multiplier
 return <details ref={details} className="tally-editor"><summary className="adminAction">＋ Add</summary><form action={adjustStudentTally}>
  <input type="hidden" name="user_id" value={userId}/><input type="hidden" name="duty_type" value={dutyType}/>
  <p className="tally-form-title"><strong>{displayLabel(dutyType)}</strong><span>{dutyType==='unexcused'?'Repeat Rotation':'Automatic 1:1'}</span></p>
  {dutyType==='unexcused'&&<label>Repeat rotation ratio<select name="ratio" value={ratio} onChange={event=>setRatio(Number(event.target.value))}><option value="3">1:3</option><option value="6">1:6</option></select></label>}
  <label>Count to add<input name="missed_count" type="number" min="1" max={Math.floor(180/multiplier)} value={missed} onChange={event=>setMissed(Math.max(1,Math.min(Math.floor(180/multiplier),Number(event.target.value)||1)))}/></label>
  <div className="tally-modal-actions"><button type="button" className="adminSecondary" onClick={()=>details.current?.removeAttribute('open')}>Cancel</button><ConfirmButton className="primary" message={`Add ${total} ${displayLabel(dutyType)} duties to ${studentName}'s tally using the 1:${multiplier} rule?`}>Confirm Tally</ConfirmButton></div>
 </form></details>
}
