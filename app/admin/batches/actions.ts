'use server'
import {redirect} from 'next/navigation'
import {revalidatePath,revalidateTag} from 'next/cache'
import {requireUser} from '@/lib/auth'
import {createAdminClient} from '@/lib/supabase/admin'

const back=(kind:'error'|'message',message:string)=>`/admin/batches?${kind}=${encodeURIComponent(message)}`

export async function saveBatch(form:FormData){
 const {user}=await requireUser('clinical_head')
 const name=String(form.get('name')||'').trim().replace(/\s+/g,' ')
 const prefix=String(form.get('student_year_prefix')||'').trim()
 const year=String(form.get('year_level')||'')
 const color=String(form.get('theme_color')||'').trim()
 if(!/^[A-Za-z][A-Za-z -]{1,39}$/.test(name)||!/^\d{4}$/.test(prefix)||!['2nd','3rd','4th'].includes(year)||!/^#[0-9a-fA-F]{6}$/.test(color))redirect(back('error','Enter a valid batch name, four-digit student year, year level, and color.'))
 const {error}=await createAdminClient().from('batches').insert({name,student_year_prefix:prefix,year_level:year,theme_color:color.toLowerCase(),logo_path:'/logos/mudernize-logo.png',created_by:user.id})
 if(error)redirect(back('error',error.message))
 revalidateTag('batches');revalidatePath('/admin','layout');revalidatePath('/login')
 redirect(back('message','Batch created.'))
}

export async function setBatchStatus(form:FormData){
 await requireUser('clinical_head')
 const name=String(form.get('name')||''),active=String(form.get('active'))==='true'
 const {error}=await createAdminClient().from('batches').update({is_active:active,updated_at:new Date().toISOString()}).eq('name',name)
 if(error)redirect(back('error',error.message))
 revalidateTag('batches');revalidatePath('/admin','layout');revalidatePath('/login')
 redirect(back('message',active?'Batch activated.':'Batch archived. Existing records remain available.'))
}

export async function removeBatch(form:FormData){
 await requireUser('clinical_head')
 const name=String(form.get('name')||'')
 const admin=createAdminClient()
 const checks=await Promise.all([
  admin.from('users').select('user_id',{count:'exact',head:true}).eq('batch',name),
  admin.from('mud_schedules').select('schedule_id',{count:'exact',head:true}).eq('batch',name),
  admin.from('announcements').select('announcement_id',{count:'exact',head:true}).eq('batch',name),
 ])
 const error=checks.find(result=>result.error)?.error
 if(error)redirect(back('error',error.message))
 const references=checks.reduce((total,result)=>total+(result.count||0),0)
 if(references)redirect(back('error',`Cannot delete ${name}: ${references} linked record${references===1?'':'s'} remain. Archive it instead.`))
 const {error:deleteError}=await admin.from('batches').delete().eq('name',name)
 if(deleteError)redirect(back('error',deleteError.message))
 revalidateTag('batches');revalidatePath('/admin','layout');revalidatePath('/login')
 redirect(back('message','Unused batch deleted.'))
}
