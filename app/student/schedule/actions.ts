'use server'
import {redirect} from 'next/navigation'
import {revalidatePath} from 'next/cache'
import {requireUser} from '@/lib/auth'

export async function completeScheduledDuty(form:FormData) {
 const registrationId=Number(form.get('registration_id'))
 if(!Number.isInteger(registrationId)||registrationId<1) redirect('/student/schedule?error=Invalid+duty+selection.')
 const {supabase}=await requireUser('student')
 const {error}=await supabase.rpc('complete_own_duty',{target_registration:registrationId})
 if(error) redirect('/student/schedule?error='+encodeURIComponent(error.message))
 revalidatePath('/student','layout')
 revalidatePath('/admin','layout')
 redirect('/student/schedule?message=Scheduled+duty+marked+as+completed.')
}

