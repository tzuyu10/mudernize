import 'server-only'
import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

const scheduleFields='schedule_id,date,time_slot,max_capacity,current_count,clinical_area,batch,year_level,status,archived_at'
const announcementFields='announcement_id,title,content,batch,posted_at,updated_at'
const result=<T>(data:T[]|null,error:{message:string}|null)=>({data:data||[],error:error?{message:error.message}:null})

export const getStudentSchedules=unstable_cache(async(batch:string,year:string,today:string)=>{
 const {data,error}=await createAdminClient().from('mud_schedules').select(scheduleFields).is('archived_at',null).eq('status','open').gte('date',today).or(`batch.is.null,batch.eq.${batch}`).or(`year_level.is.null,year_level.eq.all,year_level.eq.${year}`).order('date')
 return result(data,error)
},['student-schedules-v1'],{revalidate:20,tags:['schedules']})

export const getAllSchedules=unstable_cache(async()=>{
 const {data,error}=await createAdminClient().from('mud_schedules').select(scheduleFields).is('archived_at',null).order('date')
 return result(data,error)
},['all-schedules-v1'],{revalidate:20,tags:['schedules']})

export const getStudentAnnouncements=unstable_cache(async(batch:string)=>{
 const {data,error}=await createAdminClient().from('announcements').select(announcementFields).or(`batch.is.null,batch.eq.${batch}`).order('posted_at',{ascending:false}).limit(20)
 return result(data,error)
},['student-announcements-v1'],{revalidate:30,tags:['announcements']})

export const getAllAnnouncements=unstable_cache(async()=>{
 const {data,error}=await createAdminClient().from('announcements').select(announcementFields).order('posted_at',{ascending:false}).limit(100)
 return result(data,error)
},['all-announcements-v1'],{revalidate:30,tags:['announcements']})
