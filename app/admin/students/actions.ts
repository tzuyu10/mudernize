'use server'
import {requireUser,accountEmail} from '@/lib/auth'
import {getBatchRule} from '@/lib/batch-data'
import {createAdminClient} from '@/lib/supabase/admin'
import {redirect} from 'next/navigation'
import {revalidatePath} from 'next/cache'
import {normalizeMiddleInitial} from '@/lib/names'

export async function addStudent(form:FormData) {
 await requireUser('clinical_head')
 let failure=''
 try {
  const id=String(form.get('student_number')||'').trim()
  const batch=String(form.get('batch'))
  const rule=await getBatchRule(batch)
  if(!id.startsWith(rule.student_year_prefix+'-'))throw new Error(`${batch} student numbers must start with ${rule.student_year_prefix}.`)
  const year=rule.year_level
  const yearSection=String(form.get('year_section')||'').trim().toUpperCase()
  const first=String(form.get('first_name')||'').trim(),middle=normalizeMiddleInitial(form.get('middle_initial')),last=String(form.get('last_name')||'').trim()
  const password=String(form.get('password')||'')
  if(!/^\d{4}-\d{6}$/.test(id)||!first||!last||first.length>80||last.length>80||password.length<12||password.length>128||!new RegExp(`^${year[0]}NU-\\d{2}$`).test(yearSection)) throw new Error(`Use a valid cohort student ID, names, ${year[0]}NU-05 year-section format, and a password of 12–128 characters.`)
  const {error}=await createAdminClient().auth.admin.createUser({email:accountEmail(id),password,email_confirm:true,app_metadata:{role:'student',student_number:id,batch,year_level:year,year_section:yearSection,first_name:first,middle_initial:middle,last_name:last}})
  if(error) throw error
 } catch(error) {failure=error instanceof Error?error.message:'Could not create student'}
 if(failure) redirect('/admin/students?error='+encodeURIComponent(failure))
 revalidatePath('/admin/students')
 redirect('/admin/students?message=Student+account+created&created='+Date.now())
}

export async function adjustStudentTally(form:FormData) {
 const {supabase}=await requireUser('clinical_head')
 const userId=String(form.get('user_id')||'')
 const dutyType=String(form.get('duty_type')||'')
 const missedCount=Number(form.get('missed_count'))
 const ratio=dutyType==='unexcused'?Number(form.get('ratio')):1
 const validRatio=dutyType==='unexcused'?[3,6].includes(ratio):ratio===1
 if(!/^[0-9a-f-]{36}$/i.test(userId)||!['excused','unexcused','waived'].includes(dutyType)||!Number.isInteger(missedCount)||missedCount<1||missedCount>180||!validRatio||missedCount*ratio>180) redirect('/admin/students?error=Invalid+tally+ratio')
 const {error}=await supabase.rpc('apply_tally_adjustment',{target_user:userId,missed_count:missedCount,duty_category:dutyType,duty_ratio:ratio})
 if(error) redirect('/admin/students?error='+encodeURIComponent(error.message))
 revalidatePath('/admin/students');revalidatePath('/student/profile')
 redirect('/admin/students?message=Tally+updated')
}

export async function resetStudentPassword(form:FormData) {
 const {user}=await requireUser('clinical_head')
 const userId=String(form.get('user_id')||'')
 const requestId=Number(form.get('request_id'))
 const password=String(form.get('password')||'')
 if(!/^[0-9a-f-]{36}$/i.test(userId)||!Number.isInteger(requestId)||password.length<12||password.length>128) redirect('/admin/students?error=Use+a+temporary+password+of+12–128+characters')
 const admin=createAdminClient()
 const {data:request,error:requestError}=await admin.from('password_reset_requests').update({status:'resolved',resolved_at:new Date().toISOString(),resolved_by:user.id}).eq('request_id',requestId).eq('user_id',userId).eq('status','pending').select('request_id').maybeSingle()
 if(requestError||!request) redirect('/admin/students?error='+encodeURIComponent('This password reset request is no longer pending. Refresh the page and try again.'))
 const {error}=await admin.auth.admin.updateUserById(userId,{password})
 if(error){
  await admin.from('password_reset_requests').update({status:'pending',resolved_at:null,resolved_by:null}).eq('request_id',requestId).eq('user_id',userId).eq('status','resolved')
  redirect('/admin/students?error='+encodeURIComponent(error.message))
 }
 revalidatePath('/admin/students')
 redirect('/admin/students?message=Temporary+password+set')
}

export async function updateStudentAccount(form:FormData){
 await requireUser('clinical_head')
 const userId=String(form.get('user_id')||''),first=String(form.get('first_name')||'').trim(),last=String(form.get('last_name')||'').trim(),yearSection=String(form.get('year_section')||'').trim().toUpperCase()
 let middle:string|null
 try{middle=normalizeMiddleInitial(form.get('middle_initial'))}catch(error){redirect('/admin/students?error='+encodeURIComponent(error instanceof Error?error.message:'Invalid middle initial'))}
 if(!/^[0-9a-f-]{36}$/i.test(userId)||!first||!last||first.length>80||last.length>80||!/^[234]NU-\d{2}$/.test(yearSection))redirect('/admin/students?error=Enter+valid+student+details+and+use+the+year-section+format+4NU-05')
 const admin=createAdminClient()
 const {data:authRecord,error:authReadError}=await admin.auth.admin.getUserById(userId)
 if(authReadError||!authRecord.user)redirect('/admin/students?error='+encodeURIComponent(authReadError?.message||'Student account not found'))
 const {data:student,error:studentReadError}=await admin.from('users').select('year_level').eq('user_id',userId).eq('role','student').single()
 if(studentReadError||!student||yearSection[0]!==student.year_level?.[0])redirect('/admin/students?error=Year+and+section+must+match+the+student+year+level')
 const {error}=await admin.from('users').update({first_name:first,middle_initial:middle,last_name:last,year_section:yearSection}).eq('user_id',userId).eq('role','student')
 if(error)redirect('/admin/students?error='+encodeURIComponent(error.message))
 const {error:authError}=await admin.auth.admin.updateUserById(userId,{app_metadata:{...authRecord.user.app_metadata,first_name:first,middle_initial:middle,last_name:last,year_section:yearSection}})
 if(authError)redirect('/admin/students?error='+encodeURIComponent(authError.message))
 revalidatePath('/admin/students');revalidatePath('/student','layout')
 redirect('/admin/students?message=Student+profile+updated')
}

export async function setStudentAccess(form:FormData){
 await requireUser('clinical_head')
 const userId=String(form.get('user_id')||''),active=String(form.get('active'))==='true'
 if(!/^[0-9a-f-]{36}$/i.test(userId))redirect('/admin/students?error=Invalid+student+account')
 const admin=createAdminClient()
 const {error:authError}=await admin.auth.admin.updateUserById(userId,{ban_duration:active?'none':'876000h'})
 if(authError)redirect('/admin/students?error='+encodeURIComponent(authError.message))
 const {error}=await admin.from('users').update({is_active:active}).eq('user_id',userId).eq('role','student')
 if(error){await admin.auth.admin.updateUserById(userId,{ban_duration:active?'876000h':'none'});redirect('/admin/students?error='+encodeURIComponent(error.message))}
 revalidatePath('/admin/students')
 redirect('/admin/students?message='+encodeURIComponent(active?'Student access restored.':'Student access suspended.'))
}

export async function issueStudentPassword(form:FormData){
 await requireUser('clinical_head')
 const userId=String(form.get('user_id')||''),password=String(form.get('password')||'')
 if(!/^[0-9a-f-]{36}$/i.test(userId)||password.length<12||password.length>128)redirect('/admin/students?error=Use+a+temporary+password+of+12–128+characters')
 const {error}=await createAdminClient().auth.admin.updateUserById(userId,{password})
 if(error)redirect('/admin/students?error='+encodeURIComponent(error.message))
 redirect('/admin/students?message=Temporary+password+set')
}
