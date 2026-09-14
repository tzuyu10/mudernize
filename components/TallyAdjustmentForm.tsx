'use client'
import {useRef,useState} from 'react'
import {adjustStudentTally} from '@/app/admin/students/actions'
import ConfirmButton from './ConfirmButton'
import {displayLabel} from '@/lib/labels'

type DutyType='excused'|'waived'|'unexcused'
export default function TallyAdjustmentForm({userId,studentName,dutyType,currentRequired,registered}:{userId:string;studentName:string;dutyType:DutyType;currentRequired:number;registered:number}){
 const [ratio,setRatio]=useState(3),[missed,setMissed]=useState(1),[changeKind,setChangeKind]=useState<'increase'|'decrease'>('increase')
 const details=useRef<HTMLDetailsElement>(null)
 const multiplier=changeKind==='decrease'?1:dutyType==='unexcused'?ratio:1,total=missed*multiplier
 const removable=Math.max(0,currentRequired-registered)
 const canDecrease=removable>0
 function close(){details.current?.removeAttribute('open')}
 return <details ref={details} className="tally-editor"><summary className="adminAction">＋ / − Modify</summary><form action={adjustStudentTally}>
  <input type="hidden" name="user_id" value={userId}/><input type="hidden" name="duty_type" value={dutyType}/><input type="hidden" name="change_kind" value={changeKind}/><input type="hidden" name="ratio" value={multiplier}/>
  <div className="tally-popup-heading"><p className="tally-form-title"><strong>{displayLabel(dutyType)}</strong><span>{changeKind==='decrease'?'Exact duty units':dutyType==='unexcused'?'Repeat Rotation':'Automatic 1:1'}</span></p><button type="button" className="popup-close" onClick={close} aria-label="Close tally adjustment">×</button></div>
  <p className="tally-balance-summary"><span><small>Required</small><strong>{currentRequired}</strong></span><span><small>Registered</small><strong>{registered}</strong></span><span><small>Can Remove</small><strong>{removable}</strong></span></p>
  <div className="tally-change-toggle" role="group" aria-label="Tally change"><button type="button" className={changeKind==='increase'?'active':''} onClick={()=>setChangeKind('increase')}>＋ Increase</button><button type="button" className={changeKind==='decrease'?'active':''} disabled={!canDecrease} onClick={()=>{setChangeKind('decrease');setMissed(1)}}>− Decrease</button></div>
  {dutyType==='unexcused'&&changeKind==='increase'&&<label>Repeat rotation ratio<select value={ratio} onChange={event=>setRatio(Number(event.target.value))}><option value="3">1:3</option><option value="6">1:6</option></select></label>}
  <label>Count to {changeKind==='increase'?'add':'remove'}<input name="missed_count" type="number" min="1" max={changeKind==='decrease'?Math.max(1,Math.floor(removable/multiplier)):Math.floor(180/multiplier)} value={missed} onChange={event=>setMissed(Math.max(1,Math.min(changeKind==='decrease'?Math.max(1,Math.floor(removable/multiplier)):Math.floor(180/multiplier),Number(event.target.value)||1)))}/></label>
  <div className="tally-modal-actions"><button type="button" className="adminSecondary" onClick={close}>Cancel</button><ConfirmButton className={changeKind==='decrease'?'dangerButton':'primary'} message={`${changeKind==='increase'?'Add':'Remove'} ${total} ${displayLabel(dutyType)} ${total===1?'duty':'duties'} ${changeKind==='increase'?'to':'from'} ${studentName}'s tally${changeKind==='increase'?` using the 1:${multiplier} rule`:''}?`}>{changeKind==='increase'?'Add to Tally':'Remove from Tally'}</ConfirmButton></div>
 </form></details>
}
