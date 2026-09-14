import {requireUser} from '@/lib/auth'
import {getBatchConfigs} from '@/lib/batch-data'
import {resetStudentPassword} from './actions'
import ConfirmButton from '@/components/ConfirmButton'
import TallyAdjustmentForm from '@/components/TallyAdjustmentForm'
import AddStudentForm from '@/components/AddStudentForm'
import StudentAccountManager from '@/components/StudentAccountManager'
import {displayLabel} from '@/lib/labels'
import {displayName} from '@/lib/names'
import {calculateTallyBalances} from '@/lib/tally'

const dutyTypes=['excused','waived','unexcused'] as const

export default async function Page({searchParams:searchParamsPromise}:{searchParams:Promise<{batch?:string;q?:string;error?:string;message?:string;created?:string}>}){
 const searchParams=await searchParamsPromise
 const {supabase}=await requireUser('clinical_head')
 const [{data:batchConfigs},{data:students,error},{data:registrations},{data:adjustments,error:adjustmentError},{data:resetRequests}]=await Promise.all([
  getBatchConfigs(true),
  supabase.from('users').select('user_id,student_number,first_name,middle_initial,last_name,year_level,year_section,batch,is_active').eq('role','student').order('last_name'),
  supabase.from('registrations').select('student_id,status,duty_type,duty_count'),
  supabase.from('tally_adjustments').select('student_id,duty_type,signed_total'),
  supabase.from('password_reset_requests').select('request_id,user_id,identifier,category,requested_at').eq('status','pending').order('requested_at',{ascending:false}).limit(20)
 ])
 const batches=batchConfigs.map(batch=>batch.name)
 const rows=(students||[]).filter(student=>(!searchParams.batch||student.batch===searchParams.batch)&&(!searchParams.q||[student.first_name,student.middle_initial,student.last_name,student.student_number,student.year_level,student.year_section].join(' ').toLowerCase().includes(searchParams.q.toLowerCase())))
 const statusCount=(status:string)=>(registrations||[]).filter(registration=>registration.status===status).length
 function categoryTotal(studentId:string,category:string){
  return calculateTallyBalances((adjustments||[]).filter(row=>row.student_id===studentId),(registrations||[]).filter(row=>row.student_id===studentId))[category as typeof dutyTypes[number]]
 }
 return <div className="space-y-6 page-stack">
  <div className="page-heading"><p className="eyebrow">STUDENT ANALYTICS</p><h1>My students</h1><p className="muted text-sm">Manage accounts and separate tallies for Excused, Waived, and Unexcused duties.</p></div>
  {(searchParams.error||error||adjustmentError)&&<p role="alert" className="notice">{searchParams.error||error?.message||adjustmentError?.message}</p>}{searchParams.message&&<p role="status" className="notice success-notice">{searchParams.message}</p>}
  <section className="grid grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Student analytics">{[['Students',(students||[]).length],['Pending',statusCount('pending')],['Ongoing',statusCount('ongoing')],['Completed',statusCount('completed')]].map(([label,value])=><article className="dashboardCard p-5" key={label}><p className="muted text-xs">{label}</p><strong className="themeValue text-3xl block mt-3">{value}</strong></article>)}</section>
  <section className="dashboardCard p-6"><div className="section-heading"><div><h2 className="font-semibold text-lg">Students by Batch</h2><p className="muted text-xs">Student account totals for each batch</p></div></div><div className="analytics-bars mt-5">{batchConfigs.map(batch=>{const count=(students||[]).filter(student=>student.batch===batch.name).length,maxCount=Math.max(1,...batchConfigs.map(item=>(students||[]).filter(student=>student.batch===item.name).length)),barWidth=Math.round(count/maxCount*100);return <div key={batch.name}><span><strong>{batch.name}</strong><small>{count} Student{count===1?'':'s'}</small></span><div><i style={{width:`${barWidth}%`,background:batch.theme_color}}/></div></div>})}</div></section>
  {!!resetRequests?.length&&<section className="dashboardCard p-6"><h2 className="font-semibold text-lg">Pending password reset requests</h2><p className="muted text-xs mt-1 mb-4">Set a temporary password and give it directly to the account owner.</p><div className="space-y-3">{resetRequests.map(request=><form action={resetStudentPassword} className="reset-request" key={request.request_id}><input type="hidden" name="request_id" value={request.request_id}/><input type="hidden" name="user_id" value={request.user_id}/><span><strong>{request.identifier} <span className="badge">{displayLabel(request.category)}</span></strong><small>{new Date(request.requested_at).toLocaleString('en-PH',{timeZone:'Asia/Manila'})}</small></span><label>Temporary password<input type="password" name="password" minLength={12} maxLength={128} required autoComplete="new-password"/></label><ConfirmButton className="primary" message={`Reset the password for ${request.identifier}?`}>Reset Password</ConfirmButton></form>)}</div></section>}
  <AddStudentForm batches={batchConfigs.filter(batch=>batch.is_active)} resetKey={searchParams.created}/>
  <form className="admin-filter-form dashboardCard p-5" role="search"><label>Search<span className="admin-search-field"><input name="q" type="search" placeholder="Name or student number" defaultValue={searchParams.q}/><button type="submit" aria-label="Search students" title="Search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m16 16 4 4"/></svg></button></span></label><label>Batch<select name="batch" defaultValue={searchParams.batch||''}><option value="">All Batches</option>{batches.map(batch=><option key={batch}>{batch}</option>)}</select></label></form>
  <div className="table-wrap student-tally-table"><table className="responsive-data-table"><thead><tr><th>Student profile</th><th>Pending</th><th>Duty balances</th><th>Total required</th><th>Actions</th></tr></thead><tbody>{rows.map(student=>{const values=Object.fromEntries(dutyTypes.map(type=>[type,categoryTotal(student.user_id,type)]));const grandTotal=dutyTypes.reduce((sum,type)=>sum+values[type].required,0),studentName=displayName(student);return <tr key={student.user_id} className={student.is_active===false?'inactive-user':''}><td data-label="Student profile"><strong className="student-table-name">{studentName}</strong><span className="student-table-number">{student.student_number}</span><div className="student-table-meta"><span>{student.batch}</span><span>{student.year_section||'Not set'} · {student.year_level} year</span><span className={`status-chip ${student.is_active===false?'is-archived':'is-active'}`}>{student.is_active===false?'Suspended':'Active'}</span></div></td><td data-label="Pending"><strong className="student-pending-count">{(registrations||[]).filter(row=>row.student_id===student.user_id&&row.status==='pending').length}</strong><small className="muted block">Requests awaiting review</small></td><td data-label="Duty balances"><div className="student-duty-grid">{dutyTypes.map(type=><section className="student-duty-card" key={type}><header><span>{displayLabel(type)}</span><strong className="number-text">{values[type].required}</strong></header><div className="student-duty-stats"><span><strong>{values[type].completed}</strong><small>Completed</small></span><span><strong>{values[type].registered}</strong><small>Registered</small></span><span><strong>{values[type].remaining}</strong><small>Available</small></span></div><TallyAdjustmentForm userId={student.user_id} studentName={studentName} dutyType={type} currentRequired={values[type].required} registered={values[type].registered}/></section>)}</div></td><td data-label="Total required"><strong className="themeValue student-required-total">{grandTotal}</strong><small className="muted block">Across all categories</small></td><td data-label="Actions"><StudentAccountManager student={student}/></td></tr>})}</tbody></table></div>{!rows.length&&<p className="muted">No students match your filters.</p>}
 </div>
}





