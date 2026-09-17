'use server'
import {requireUser} from '@/lib/auth'
import {redirect} from 'next/navigation'
import {revalidatePath} from 'next/cache'
import {createAdminClient} from '@/lib/supabase/admin'
import {normalizeMiddleInitial} from '@/lib/names'

export async function updateProfile(form:FormData) {
 const {user}=await requireUser('student')
 const firstName=String(form.get('first_name')||'').trim(),lastName=String(form.get('last_name')||'').trim()
 let middleInitial:string|null
 try{middleInitial=normalizeMiddleInitial(form.get('middle_initial'))}catch(error){redirect('/student/profile?error='+encodeURIComponent(error instanceof Error?error.message:'Invalid middle initial'))}
 if(!firstName||!lastName||firstName.length>80||lastName.length>80)redirect('/student/profile?error=Enter+valid+first+and+last+names')
 const profilePayload=Object.fromEntries(['course_block','contact_number','address','guardian_name','guardian_contact'].map(key=>[key,String(form.get(key)||'').trim().slice(0,500)]))
 const admin=createAdminClient()
 const {error:nameError}=await admin.from('users').update({first_name:firstName,middle_initial:middleInitial,last_name:lastName}).eq('user_id',user.id).eq('role','student')
 if(nameError)redirect('/student/profile?error='+encodeURIComponent(nameError.message))
 const {error}=await admin.from('student_profiles').upsert({...profilePayload,user_id:user.id,updated_at:new Date().toISOString()},{onConflict:'user_id'})
 if(error) redirect('/student/profile?error='+encodeURIComponent(error.message))
 revalidatePath('/student','layout');revalidatePath('/student/profile')
 redirect('/student/profile?message=Profile+saved')
}

export async function updatePassword(form:FormData){
 const {supabase}=await requireUser('student')
 const password=String(form.get('password')||''),confirmation=String(form.get('confirm_password')||'')
 if(password.length<12||password.length>128)redirect('/student/profile?error=Use+a+password+from+12+to+128+characters')
 if(password!==confirmation)redirect('/student/profile?error=The+passwords+do+not+match')
 const {error}=await supabase.auth.updateUser({password})
 if(error)redirect('/student/profile?error='+encodeURIComponent(error.message))
 redirect('/student/profile?message=Password+changed+successfully')
}

export async function changeOwnTally(form:FormData){
 const {supabase}=await requireUser('student')
 const dutyType=String(form.get('duty_type')||''),count=Number(form.get('count')),changeKind=String(form.get('change_kind')||'')
 if(!['excused','waived','unexcused'].includes(dutyType)||!['increase','decrease'].includes(changeKind)||!Number.isInteger(count)||count<1||count>180)redirect('/student/profile?error=Choose+a+valid+category,+change,+and+a+count+from+1+to+180')
 const {error}=await supabase.rpc('change_own_tally',{duty_category:dutyType,duty_count:count,change_kind:changeKind})
 if(error)redirect('/student/profile?error='+encodeURIComponent(error.message))
 revalidatePath('/student','layout');revalidatePath('/student/profile');revalidatePath('/student/registration');revalidatePath('/admin/students')
 redirect('/student/profile?message='+encodeURIComponent(`${count} ${dutyType} ${count===1?'duty':'duties'} ${changeKind==='increase'?'added to':'removed from'} your tally.`))
}