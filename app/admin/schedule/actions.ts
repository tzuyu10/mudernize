'use server'
import {requireUser,batches} from '@/lib/auth'
import {redirect} from 'next/navigation'
import {revalidatePath,revalidateTag} from 'next/cache'
export async function createSchedule(form:FormData) {
 const {supabase,user}=await requireUser('clinical_head')
 const id=Number(form.get('schedule_id'))
 const batch=String(form.get('batch')||'')
 const payload={date:String(form.get('date')),time_slot:String(form.get('time_slot')),max_capacity:Number(form.get('max_capacity')),year_level:String(form.get('year_level')),batch:batch||null,clinical_area:String(form.get('clinical_area')||'').trim(),status:String(form.get('status')||'open')}
 let error
 if(form.get('operation')==='delete') ({error}=await supabase.from('mud_schedules').delete().eq('schedule_id',id))
 else {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(payload.date)||!Number.isInteger(payload.max_capacity)||payload.max_capacity<1||payload.max_capacity>200||!payload.clinical_area||!['AM','PM'].includes(payload.time_slot)||!['all','2nd','3rd','4th'].includes(payload.year_level)||!['open','closed'].includes(payload.status)||(batch&&!batches.includes(batch as any))) redirect('/admin/schedule?error=Invalid+schedule+details')
  if(id) ({error}=await supabase.from('mud_schedules').update(payload).eq('schedule_id',id))
  else ({error}=await supabase.from('mud_schedules').insert({...payload,created_by:user.id}))
 }
 if(error) redirect('/admin/schedule?error='+encodeURIComponent(error.message))
 revalidateTag('schedules');revalidatePath('/admin/schedule');revalidatePath('/student','layout')
 redirect('/admin/schedule?message='+encodeURIComponent(form.get('operation')==='delete'?'Schedule deleted.':id?'Schedule changes saved.':'Schedule created.'))
}
