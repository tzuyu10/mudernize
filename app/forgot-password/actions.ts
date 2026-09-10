'use server'
import {redirect} from 'next/navigation'
import {createAdminClient} from '@/lib/supabase/admin'
import {accountEmail,batches} from '@/lib/auth'

export async function requestPasswordReset(form:FormData) {
 const rawIdentifier=String(form.get('identifier')||'').trim()
 const category=String(form.get('category')||'')
 const success='/forgot-password?message='+encodeURIComponent('If the account details match, a Clinical Head will receive your request. Ask them for your temporary password.')
 if(![...batches,'Admin'].includes(category)) redirect(success)
 const identifier=category==='Admin'?rawIdentifier.toUpperCase():rawIdentifier
 try {accountEmail(identifier)} catch {redirect(success)}
 try {
  const admin=createAdminClient()
  const query=category==='Admin'
   ?admin.from('users').select('user_id,role,batch').eq('admin_number',identifier).eq('role','clinical_head')
   :admin.from('users').select('user_id,role,batch').eq('student_number',identifier).eq('role','student').eq('batch',category)
  const {data:user,error}=await query.maybeSingle()
  if(!error&&user) await admin.from('password_reset_requests').upsert({user_id:user.user_id,identifier,category,status:'pending',requested_at:new Date().toISOString(),resolved_at:null,resolved_by:null},{onConflict:'user_id',ignoreDuplicates:false})
 } catch(error) {
  console.error('Password reset request failed:',error instanceof Error?error.message:'Unknown server error')
 }
 redirect(success)
}
