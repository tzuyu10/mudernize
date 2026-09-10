import {requireUser,batches} from '@/lib/auth'
import {resetStudentPassword} from './actions'
import ConfirmButton from '@/components/ConfirmButton'
import TallyAdjustmentForm from '@/components/TallyAdjustmentForm'
import AddStudentForm from '@/components/AddStudentForm'
import {displayLabel} from '@/lib/labels'

const dutyTypes=['excused','waived','unexcused'] as const

export default async function Page({searchParams}:{searchParams:{batch?:string;q?:string;error?:string;message?:string;created?:string}}){
 const {supabase}=await requireUser('clinical_head')
 const [{data:students,error},{data:registrations},{data:adjustments,error:adjustmentError},{data:resetRequests}]=await Promise.all([
  supabase.from('users').select('user_id,student_number,first_name,last_name,year_level,batch').eq('role','student').order('last_name'),
  supabase.from('registrations').select('student_id,status,duty_type,duty_count'),
  supabase.from('tally_adjustments').select('student_id,duty_type,duty_total'),
  supabase.from('password_reset_requests').select('request_id,user_id,identifier,category,requested_at').eq('status','pending').order('requested_at',{ascending:false}).limit(20)
 ])
 const rows=(students||[]).filter(student=>(!searchParams.batch||student.batch===searchParams.batch)&&(!searchParams.q||[student.first_name,student.last_name,student.student_number].join(' ').toLowerCase().includes(searchParams.q.toLowerCase())))
 const statusCount=(status:string)=>(registrations||[]).filter(registration=>registration.status===status).length
 function categoryTotal(studentId:string,category:string){
  const completed=(registrations||[]).filter(row=>row.student_id===studentId&&row.status==='completed'&&row.duty_type===category).reduce((sum,row)=>sum+row.duty_count,0)
  const added=(adjustments||[]).filter(row=>row.student_id===studentId&&row.duty_type===category).reduce((sum,row)=>sum+row.duty_total,0)
  return {completed,added,total:completed+added}
 }
 return <div className="space-y-6">
  <div><p className="eyebrow">STUDENT ANALYTICS</p><h1>My students</h1><p className="muted text-sm">Manage accounts and separate tallies for Excused, Waived, and Unexcused duties.</p></div>
  {(searchParams.error||error||adjustmentError)&&<p role="alert" className="notice">{searchParams.error||error?.message||adjustmentError?.message}</p>}{searchParams.message&&<p role="status" className="notice success-notice">{searchParams.message}</p>}
  <section className="grid grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Student analytics">{[['Students',(students||[]).length],['Pending',statusCount('pending')],['Ongoing',statusCount('ongoing')],['Completed',statusCount('completed')]].map(([label,value])=><article className="dashboardCard p-5" key={label}><p className="muted text-xs">{label}</p><strong className="themeValue text-3xl block mt-3">{value}</strong></article>)}</section>
  <section className="dashboardCard p-6"><h2 className="font-semibold text-lg mb-5">Batch distribution</h2><div className="analytics-bars">{batches.map(batch=>{const count=(students||[]).filter(student=>student.batch===batch).length,percent=(students||[]).length?Math.round(count/(students||[]).length*100):0;return <div key={batch}><span><strong>{batch}</strong><small>{count} students · {percent}%</small></span><div><i style={{width:`${percent}%`,background:batch==='Sanghaya'?'#ffacec':batch==='Astraea'?'#401268':'#7a0000'}}/></div></div>})}</div></section>
  {!!resetRequests?.length&&<section className="dashboardCard p-6"><h2 className="font-semibold text-lg">Pending password reset requests</h2><p className="muted text-xs mt-1 mb-4">Set a temporary password and give it directly to the account owner.</p><div className="space-y-3">{resetRequests.map(request=><form action={resetStudentPassword} className="reset-request" key={request.request_id}><input type="hidden" name="request_id" value={request.request_id}/><input type="hidden" name="user_id" value={request.user_id}/><span><strong>{request.identifier} <span className="badge">{displayLabel(request.category)}</span></strong><small>{new Date(request.requested_at).toLocaleString('en-PH',{timeZone:'Asia/Manila'})}</small></span><label>Temporary password<input type="password" name="password" minLength={12} maxLength={128} required autoComplete="new-password"/></label><ConfirmButton className="primary" message={`Reset the password for ${request.identifier}?`}>Reset Password</ConfirmButton></form>)}</div></section>}
  <AddStudentForm batches={batches} resetKey={searchParams.created}/>
  <form className="admin-filter-form dashboardCard p-5" role="search"><label>Search<span className="admin-search-field"><input name="q" type="search" placeholder="Name or student number" defaultValue={searchParams.q}/><button type="submit" aria-label="Search students" title="Search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m16 16 4 4"/></svg></button></span></label><label>Batch<select name="batch" defaultValue={searchParams.batch||''}><option value="">All Batches</option>{batches.map(batch=><option key={batch}>{batch}</option>)}</select></label></form>
  <div className="table-wrap student-tally-table"><table><thead><tr><th>Student</th><th>Batch / year</th><th>Pending</th>{dutyTypes.map(type=><th key={type}>{displayLabel(type)}</th>)}<th>Total</th></tr></thead><tbody>{rows.map(student=>{const values=Object.fromEntries(dutyTypes.map(type=>[type,categoryTotal(student.user_id,type)]));const grandTotal=dutyTypes.reduce((sum,type)=>sum+values[type].total,0);return <tr key={student.user_id}><td>{student.first_name} {student.last_name}<br/><span className="muted">{student.student_number}</span></td><td>{student.batch} · {student.year_level}</td><td>{(registrations||[]).filter(row=>row.student_id===student.user_id&&row.status==='pending').length}</td>{dutyTypes.map(type=><td key={type}><strong className="number-text">{values[type].total}</strong><small className="muted block">{values[type].completed} completed · {values[type].added} added</small><TallyAdjustmentForm userId={student.user_id} studentName={`${student.first_name} ${student.last_name}`} dutyType={type}/></td>)}<td><strong className="themeValue text-xl">{grandTotal}</strong></td></tr>})}</tbody></table></div>{!rows.length&&<p className="muted">No students match your filters.</p>}
 </div>
}



