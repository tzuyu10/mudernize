'use server'
import {redirect} from 'next/navigation'
import {revalidatePath,revalidateTag} from 'next/cache'
import {requireUser} from '@/lib/auth'
import {createAdminClient} from '@/lib/supabase/admin'

const back=(kind:'error'|'message',message:string)=>`/admin/batches?${kind}=${encodeURIComponent(message)}`

async function uploadBatchLogo(admin:ReturnType<typeof createAdminClient>,name:string,file:File){
 if(!file.size)return null
 if(file.size>2*1024*1024||!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error('Use a transparent PNG, JPG, or WebP logo up to 2 MB.')
 const {data:bucket}=await admin.storage.getBucket('batch-logos')
 if(!bucket){
  const {error}=await admin.storage.createBucket('batch-logos',{public:true,fileSizeLimit:2*1024*1024,allowedMimeTypes:['image/png','image/jpeg','image/webp']})
  if(error)throw error
 }
 const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg'
 const slug=name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
 const path=`${slug}/${crypto.randomUUID()}.${ext}`
 const {error}=await admin.storage.from('batch-logos').upload(path,await file.arrayBuffer(),{contentType:file.type,upsert:false,cacheControl:'3600'})
 if(error)throw error
 return {path,url:admin.storage.from('batch-logos').getPublicUrl(path).data.publicUrl}
}

const refreshBatches=()=>{revalidateTag('batches');revalidatePath('/admin','layout');revalidatePath('/student','layout');revalidatePath('/login');revalidatePath('/signup');revalidatePath('/forgot-password')}

export async function saveBatch(form:FormData){
 const {user}=await requireUser('clinical_head')
 const name=String(form.get('name')||'').trim().replace(/\s+/g,' ')
 const prefix=String(form.get('student_year_prefix')||'').trim()
 const year=String(form.get('year_level')||'')
 const color=String(form.get('theme_color')||'').trim()
 if(!/^[A-Za-z][A-Za-z -]{1,39}$/.test(name)||!/^\d{4}$/.test(prefix)||!['2nd','3rd','4th'].includes(year)||!/^#[0-9a-fA-F]{6}$/.test(color))redirect(back('error','Enter a valid batch name, four-digit student year, year level, and color.'))
 const admin=createAdminClient(),file=form.get('logo')
 const {error}=await admin.from('batches').insert({name,student_year_prefix:prefix,year_level:year,theme_color:color.toLowerCase(),logo_path:'/logos/mudernize-logo.png',created_by:user.id})
 if(error)redirect(back('error',error.message))
 if(file instanceof File&&file.size){
  try{const uploaded=await uploadBatchLogo(admin,name,file);if(uploaded){const {error:logoError}=await admin.from('batches').update({logo_path:uploaded.url,updated_at:new Date().toISOString()}).eq('name',name);if(logoError){await admin.storage.from('batch-logos').remove([uploaded.path]);throw logoError}}}
  catch(uploadError){redirect(back('error',`Batch created with the default logo. ${uploadError instanceof Error?uploadError.message:'Logo upload failed.'}`))}
 }
 refreshBatches()
 redirect(back('message','Batch created.'))
}

export async function updateBatchLogo(form:FormData){
 await requireUser('clinical_head')
 const name=String(form.get('name')||''),file=form.get('logo')
 if(!(file instanceof File)||!file.size)redirect(back('error','Choose a logo image to upload.'))
 const admin=createAdminClient()
 const {data:batch,error:readError}=await admin.from('batches').select('logo_path').eq('name',name).maybeSingle()
 if(readError||!batch)redirect(back('error','Batch not found.'))
 let uploaded
 try{uploaded=await uploadBatchLogo(admin,name,file)}catch(error){redirect(back('error',error instanceof Error?error.message:'Logo upload failed.'))}
 if(!uploaded)redirect(back('error','Choose a logo image to upload.'))
 const {error}=await admin.from('batches').update({logo_path:uploaded.url,updated_at:new Date().toISOString()}).eq('name',name)
 if(error){await admin.storage.from('batch-logos').remove([uploaded.path]);redirect(back('error',error.message))}
 const marker='/storage/v1/object/public/batch-logos/'
 if(batch.logo_path?.includes(marker)){
  const oldPath=decodeURIComponent(batch.logo_path.split(marker)[1].split('?')[0])
  if(oldPath&&oldPath!==uploaded.path)await admin.storage.from('batch-logos').remove([oldPath])
 }
 refreshBatches()
 redirect(back('message',`${name} logo updated.`))
}

export async function setBatchStatus(form:FormData){
 await requireUser('clinical_head')
 const name=String(form.get('name')||''),active=String(form.get('active'))==='true'
 const {error}=await createAdminClient().from('batches').update({is_active:active,updated_at:new Date().toISOString()}).eq('name',name)
 if(error)redirect(back('error',error.message))
 refreshBatches()
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
 refreshBatches()
 redirect(back('message','Unused batch deleted.'))
}
