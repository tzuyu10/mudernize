'use server'
import {requireUser,batches} from '@/lib/auth'
import {redirect} from 'next/navigation'
import {revalidatePath,revalidateTag} from 'next/cache'
export async function postAnnouncement(form:FormData) {
 const {supabase,user}=await requireUser('clinical_head')
 const id=Number(form.get('announcement_id')), operation=String(form.get('operation')||'save')
 const batch=String(form.get('batch')||'')
 const title=String(form.get('title')||'').trim(),content=String(form.get('content')||'').trim()
 if(operation!=='delete'&&(!title||title.length>150||!content||content.length>10000||(batch&&!batches.includes(batch as any)))) redirect('/admin/announcements?error=Invalid+announcement')
 const result=operation==='delete'?await supabase.from('announcements').delete().eq('announcement_id',id):id?await supabase.from('announcements').update({title,content,batch:batch||null,updated_at:new Date().toISOString()}).eq('announcement_id',id):await supabase.from('announcements').insert({title,content,batch:batch||null,posted_by:user.id})
 if(result.error) redirect('/admin/announcements?error='+encodeURIComponent(result.error.message))
 revalidateTag('announcements');revalidatePath('/admin/announcements');revalidatePath('/student')
 redirect('/admin/announcements?message='+encodeURIComponent(operation==='delete'?'Announcement deleted.':id?'Announcement changes saved.':'Announcement published.'))
}
