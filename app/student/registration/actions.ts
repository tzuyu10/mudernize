'use server'
import { requireUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import {calculateTallyBalances,type DutyCategory} from '@/lib/tally'
export async function registerForSchedule(form:FormData) {
 const {supabase,user}=await requireUser('student')
 const id=Number(form.get('schedule_id'))
 let failure=''
 const uploadedPaths:string[]=[]
 try {
  const type=String(form.get('duty_type'))
  const missedCount=Number(form.get('missed_count'))
  const count=missedCount // All student registration categories use a 1:1 ratio.
  const absenceDate=String(form.get('absence_date')||'')
  if(!['excused','unexcused','waived'].includes(type)||!Number.isInteger(count)||count<1||count>30||!Number.isInteger(id)) throw new Error('Invalid registration details.')
  const today=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Manila'})
  const [{data:schedule,error:scheduleError},{data:existing,error:existingError}]=await Promise.all([
   supabase.from('mud_schedules').select('schedule_id,date,status,max_capacity,current_count').eq('schedule_id',id).maybeSingle(),
   supabase.from('registrations').select('registration_id').eq('student_id',user.id).eq('schedule_id',id).neq('status','denied').maybeSingle()
  ])
  if(scheduleError||!schedule) throw new Error('This schedule is not available for your batch or year.')
  if(schedule.date<today) throw new Error('Past duty schedules cannot be selected.')
  if(!/^\d{4}-\d{2}-\d{2}$/.test(absenceDate)||absenceDate>today||absenceDate>schedule.date) throw new Error('The absence / appear date must be today or an earlier date.')
  if(schedule.status!=='open') throw new Error('This duty schedule is closed.')
  if(schedule.current_count>=schedule.max_capacity) throw new Error('This duty schedule is already full.')
  if(existingError) throw new Error('Unable to verify your existing registrations.')
  if(existing) throw new Error('You already have an active registration for this schedule.')
  const [{data:adjustments,error:tallyError},{data:registrations,error:registrationsError}]=await Promise.all([
   supabase.from('tally_adjustments').select('duty_type,signed_total').eq('student_id',user.id),
   supabase.from('registrations').select('duty_type,duty_count,status').eq('student_id',user.id)
  ])
  if(tallyError||registrationsError)throw new Error('Unable to verify your duty tally. Please try again.')
  const balance=calculateTallyBalances(adjustments,registrations)[type as DutyCategory]
  if(!balance||count>balance.remaining)throw new Error(`Only ${balance?.remaining||0} ${type} duties are available to register.`)
  const keys=type==='waived'?['medcert','excuse_letter']:['receipt']
  const uploads:Record<string,string>={}
  // Validate every file before uploading any.
  for(const key of keys) {
   const file=form.get(key)
   if(!(file instanceof File)||!file.size||file.size>5242880||!['application/pdf','image/jpeg','image/png'].includes(file.type)) throw new Error('Each document must be a PDF, JPG or PNG up to 5 MB.')
  }
  for(const key of keys) {
   const file=form.get(key) as File
   const ext=file.type==='application/pdf'?'pdf':file.type==='image/png'?'png':'jpg'
   const path=`${user.id}/${crypto.randomUUID()}.${ext}`
   const {error}=await supabase.storage.from('duty-documents').upload(path,file,{contentType:file.type,upsert:false})
   if(error) throw error
   uploads[key]=path
   uploadedPaths.push(path)
  }
  const {error}=await supabase.from('registrations').insert({student_id:user.id,schedule_id:id,duty_type:type,duty_count:count,absence_date:absenceDate,receipt_number:type==='waived'?null:String(form.get('receipt_number')||'').trim(),receipt_url:uploads.receipt||null,medcert_path:uploads.medcert||null,excuse_letter_path:uploads.excuse_letter||null})
  if(error) throw error
 } catch(e) {
  if(uploadedPaths.length)await supabase.storage.from('duty-documents').remove(uploadedPaths)
  failure=e instanceof Error?e.message:'Unable to submit. Check your documents and slot availability.'
 }
 if(failure) redirect(`/student/registration/${id}?error=${encodeURIComponent(failure)}`)
 revalidatePath('/student','layout')
 redirect('/student/registration?message=Registration+submitted+for+review')
}
