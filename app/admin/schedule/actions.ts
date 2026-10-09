'use server'
import {requireUser} from '@/lib/auth'
import {getBatchRule} from '@/lib/batch-data'
import {redirect} from 'next/navigation'
import {revalidatePath} from 'next/cache'
export async function createSchedule(form:FormData) {
 const {supabase,user}=await requireUser('clinical_head')
 const id=Number(form.get('schedule_id'))
 const batch=String(form.get('batch')||'')
 const payload={date:String(form.get('date')),time_slot:String(form.get('time_slot')),max_capacity:Number(form.get('max_capacity')),year_level:String(form.get('year_level')),batch:batch||null,clinical_area:String(form.get('clinical_area')||'').trim(),status:String(form.get('status')||'open')}
 let error,completionMessage=''
 const operation=String(form.get('operation')||'save')
 if(['delete','archive','restore'].includes(operation)) {
  if(!Number.isInteger(id)||id<1)redirect('/admin/schedule?error=Invalid+schedule')
  if(operation==='delete'){
   const {count,error:checkError}=await supabase.from('registrations').select('registration_id',{count:'exact',head:true}).eq('schedule_id',id)
   if(checkError||count===null)redirect('/admin/schedule?error=Unable+to+check+registration+history.+Deletion+cancelled.')
   if(count>0)redirect('/admin/schedule?error=This+schedule+has+registration+history.+Use+Archive+to+preserve+it.')
   // The existing foreign key also prevents deletion if a registration arrives after the check.
   ;({error}=await supabase.from('mud_schedules').delete().eq('schedule_id',id))
   completionMessage='Empty schedule permanently deleted.'
  }else{
   ;({error}=await supabase.from('mud_schedules').update({status:'closed',archived_at:operation==='archive'?new Date().toISOString():null}).eq('schedule_id',id))
   completionMessage=operation==='archive'?'Schedule archived. Registration history is preserved.':'Schedule restored as closed. You can reopen it in schedule settings.'
  }
 }
 else {
  if(batch){try{await getBatchRule(batch)}catch{redirect('/admin/schedule?error=Choose+an+active+batch')}}
  if(!/^\d{4}-\d{2}-\d{2}$/.test(payload.date)||!Number.isInteger(payload.max_capacity)||payload.max_capacity<1||payload.max_capacity>200||!payload.clinical_area||!['AM','PM'].includes(payload.time_slot)||!['all','2nd','3rd','4th'].includes(payload.year_level)||!['open','closed'].includes(payload.status)) redirect('/admin/schedule?error=Invalid+schedule+details')
  if(id) ({error}=await supabase.from('mud_schedules').update(payload).eq('schedule_id',id))
  else ({error}=await supabase.from('mud_schedules').insert({...payload,created_by:user.id}))
 }
 if(error) {
  const message=error.code==='23503'
   ?'This schedule cannot be deleted because it has registration history. Archive it to preserve those records.'
   :'The schedule could not be saved. Please review the details and try again.'
  redirect('/admin/schedule?error='+encodeURIComponent(message))
 }
 revalidatePath('/admin','layout');revalidatePath('/student','layout')
 redirect('/admin/schedule?message='+encodeURIComponent(completionMessage?completionMessage:id?'Schedule changes saved.':'Schedule created.'))
}
