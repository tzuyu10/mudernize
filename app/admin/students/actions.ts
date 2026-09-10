'use server'
import {requireUser,accountEmail,batches,studentYearForBatch} from '@/lib/auth'
import {createAdminClient} from '@/lib/supabase/admin'
import {redirect} from 'next/navigation'
import {revalidatePath} from 'next/cache'

export async function addStudent(form:FormData) {
 await requireUser('clinical_head')
 let failure=''
 try {
  const id=String(form.get('student_number')||'').trim()
  const batch=String(form.get('batch'))
  const year=studentYearForBatch(id,batch)
  const first=String(form.get('first_name')||'').trim(),last=String(form.get('last_name')||'').trim()
  const password=String(form.get('password')||'')
  if(!/^\d{4}-\d{6}$/.test(id)||!batches.includes(batch as any)||!first||!last||first.length>80||last.length>80||password.length<12||password.length>128) throw new Error('Use a valid cohort student ID, names, batch, and a password of 12–128 characters.')
  const {error}=await createAdminClient().auth.admin.createUser({email:accountEmail(id),password,email_confirm:true,app_metadata:{role:'student',student_number:id,batch,year_level:year,first_name:first,last_name:last}})
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
