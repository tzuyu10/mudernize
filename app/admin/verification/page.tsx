import {requireUser} from '@/lib/auth'
import {getBatchConfigs} from '@/lib/batch-data'
import {displayLabel} from '@/lib/labels'
import {verifyRegistration} from './actions'
import ConfirmButton from '@/components/ConfirmButton'

type SearchParams={error?:string;batch?:string;status?:string;q?:string}

export default async function Page({searchParams}:{searchParams:SearchParams}) {
 const {supabase}=await requireUser('clinical_head')
 const {data:batchConfigs}=await getBatchConfigs(true),batches=batchConfigs.map(batch=>batch.name)
 const status=searchParams.status||'pending'
 const search=(searchParams.q||'').trim().toLowerCase()
 let query=supabase.from('registrations').select('registration_id,student_id,schedule_id,duty_type,absence_date,duty_count,receipt_number,receipt_url,medcert_path,excuse_letter_path,status,recommendation,remarks,submitted_at,users!registrations_student_id_fkey!inner(first_name,last_name,student_number,batch),mud_schedules(date,time_slot)').eq('status',status).order('submitted_at').limit(100)
 if(searchParams.batch)query=query.eq('users.batch',searchParams.batch)
 const {data,error}=await query
 const filtered=(data||[]).filter(row=>{
  if(!search)return true
  const student=Array.isArray(row.users)?row.users[0]:row.users
  return [student?.first_name,student?.last_name,student?.student_number,student?.batch].filter(Boolean).join(' ').toLowerCase().includes(search)
 })
 const documentPaths=[...new Set(filtered.flatMap(row=>[row.receipt_url,row.medcert_path,row.excuse_letter_path].filter((path):path is string=>Boolean(path))))]
 const {data:signedRows}=documentPaths.length?await supabase.storage.from('duty-documents').createSignedUrls(documentPaths,300):{data:[]}
 const signedByPath=new Map((signedRows||[]).map(item=>[item.path,item.signedUrl]))
 const rows=filtered.map(row=>({...row,users:Array.isArray(row.users)?row.users[0]:row.users,mud_schedules:Array.isArray(row.mud_schedules)?row.mud_schedules[0]:row.mud_schedules,documents:[['Payment receipt',row.receipt_url],['Medical certificate',row.medcert_path],['Excuse letter',row.excuse_letter_path]].filter((entry):entry is [string,string]=>Boolean(entry[1])).map(([label,path])=>({label,url:signedByPath.get(path)}))}))

 return <div className="space-y-5">
  <div><p className="eyebrow">CLINICAL HEAD WORKSPACE</p><h1>Review registrations</h1><p className="muted text-sm">Search students, filter requests, review evidence, and update duty status.</p></div>
  {(searchParams.error||error)&&<p role="alert" className="notice">{searchParams.error||error?.message}</p>}
  <form className="verification-filters dashboardCard p-5" role="search">
   <div className="verification-search"><label>Search<span className="admin-search-field"><input name="q" type="search" placeholder="Name or student number" defaultValue={searchParams.q||''}/><button type="submit" aria-label="Search registrations" title="Search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m16 16 4 4"/></svg></button></span></label></div>
   <label>Batch<select name="batch" defaultValue={searchParams.batch||''}><option value="">All Batches</option>{batches.map(batch=><option key={batch}>{batch}</option>)}</select></label>
   <label>Status<select name="status" defaultValue={status}>{['pending','verified','ongoing','completed','denied'].map(value=><option key={value} value={value}>{displayLabel(value)}</option>)}</select></label>
  </form>
  <p className="muted text-xs" aria-live="polite">{rows.length} registration{rows.length===1?'':'s'} found</p>
  <div className="verification-results">
   {rows.map(row=><article key={row.registration_id} className="dashboardCard verification-card p-6">
    <div className="verification-card-head"><div><h2 className="font-semibold">{row.users?.first_name} {row.users?.last_name}</h2><p className="muted text-xs mt-1">{row.users?.student_number} · {row.users?.batch}</p></div><span className="badge">{displayLabel(row.status)}</span></div>
    <div className="verification-meta"><span><strong>Schedule</strong>{row.mud_schedules?.date} · {row.mud_schedules?.time_slot}</span><span><strong>Category</strong>{displayLabel(row.duty_type)}</span><span><strong>Duties</strong>{row.duty_count}</span><span><strong>Absence date</strong>{row.absence_date}</span></div>
    <p className="text-xs muted">Receipt number: {row.receipt_number||'Not Applicable'}</p>
    <div className="verification-documents">{row.documents.map(document=>document.url?<a key={document.label} href={document.url} target="_blank" rel="noreferrer" className="adminDocumentLink">{document.label}</a>:<span key={document.label} className="text-rose-700">Document unavailable</span>)}</div>
    {['pending','verified','ongoing'].includes(row.status)?<form action={verifyRegistration} className="space-y-3 verification-review"><input type="hidden" name="registration_id" value={row.registration_id}/><input type="hidden" name="previous_status" value={row.status}/><label>Recommendation<select name="recommendation" defaultValue={row.recommendation||row.duty_type}>{['excused','unexcused','waived'].map(value=><option key={value} value={value}>{displayLabel(value)}</option>)}</select></label><label>Review notes (required for denial)<textarea name="remarks" maxLength={2000} defaultValue={row.remarks||''}/></label><div className="verification-actions"><ConfirmButton message={`${row.status==='pending'?'Approve this registration':row.status==='verified'?'Start this duty':'Mark this duty completed'}?`} name="decision" value={row.status==='pending'?'verified':row.status==='verified'?'ongoing':'completed'} className="primary">{row.status==='pending'?'Approve':row.status==='verified'?'Start Duty':'Mark Completed'}</ConfirmButton>{row.status!=='ongoing'&&<ConfirmButton message="Deny this registration? The student will receive a notification." name="decision" value="denied" className="dangerButton">Deny</ConfirmButton>}</div></form>:<p className="text-sm">{row.remarks||'No review notes.'}</p>}
   </article>)}
  </div>
  {!rows.length&&<div className="dashboardCard p-8 text-center muted">No registrations match your search and filters.</div>}
 </div>
}
