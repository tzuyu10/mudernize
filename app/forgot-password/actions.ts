'use server'

import {redirect} from 'next/navigation'
import {createAdminClient} from '@/lib/supabase/admin'

function resetError(message:string):never{
 redirect('/forgot-password?error='+encodeURIComponent(message))
}

export async function resetStudentPassword(form:FormData){
 const studentNumber=String(form.get('student_number')||'').trim()
 const batch=String(form.get('batch')||'').trim()
 const password=String(form.get('password')||'')
 const confirmation=String(form.get('confirm_password')||'')
 if(!/^\d{4}-\d{6}$/.test(studentNumber))resetError('Use the student ID format YYYY-NNNNNN.')
 if(!batch)resetError('Choose your batch.')
 if(password.length<12||password.length>128)resetError('Use a password from 12 to 128 characters.')
 if(password!==confirmation)resetError('The passwords do not match.')

 const admin=createAdminClient()
 const {data:student,error:lookupError}=await admin.from('users').select('user_id,batch,role,is_active').eq('student_number',studentNumber).maybeSingle()
 if(lookupError||!student||student.role!=='student'||student.batch!==batch)resetError('No student account matches that ID and batch.')
 if(student.is_active===false)resetError('This account is suspended. Contact your Clinical Head.')
 const {error}=await admin.auth.admin.updateUserById(student.user_id,{password})
 if(error)resetError('The password could not be changed. Please try again.')
 redirect('/login?message='+encodeURIComponent('Password changed. Sign in with your new password.'))
}
