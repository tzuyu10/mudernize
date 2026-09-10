'use server'
import {requireUser} from '@/lib/auth'
import {redirect} from 'next/navigation'
import {revalidatePath} from 'next/cache'
export async function verifyRegistration(form:FormData) {
 const {supabase}=await requireUser('clinical_head')
 const decision=String(form.get('decision'))
 if(!['verified','denied','ongoing','completed'].includes(decision)) redirect('/admin/verification?error=Invalid+decision')
 const {data:updated,error}=await supabase.from('registrations').update({status:decision,remarks:String(form.get('remarks')||'').trim(),recommendation:String(form.get('recommendation')||'')||null}).eq('registration_id',Number(form.get('registration_id'))).eq('status',String(form.get('previous_status'))).select('registration_id').maybeSingle()
 if(error) redirect('/admin/verification?error='+encodeURIComponent(error.message))
 if(!updated) redirect('/admin/verification?error='+encodeURIComponent('This registration was already updated by another Clinical Head. The page has been refreshed.'))
 revalidatePath('/admin','layout');revalidatePath('/student','layout')
}
