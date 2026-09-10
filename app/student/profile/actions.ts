'use server'
import {requireUser} from '@/lib/auth'
import {redirect} from 'next/navigation'
import {revalidatePath} from 'next/cache'
export async function updateProfile(form:FormData) {
 const {supabase,user}=await requireUser('student')
 const payload=Object.fromEntries(['course_block','contact_number','address','clinical_area'].map(k=>[k,String(form.get(k)||'').trim().slice(0,500)]))
 const {error}=await supabase.from('student_profiles').upsert({...payload,user_id:user.id,updated_at:new Date().toISOString()},{onConflict:'user_id'})
 if(error) redirect('/student/profile?error='+encodeURIComponent(error.message))
 revalidatePath('/student/profile')
 redirect('/student/profile?message=Profile+saved')
}
