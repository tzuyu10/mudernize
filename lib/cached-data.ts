import 'server-only'
import { cache } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'

const scheduleFields='schedule_id,date,time_slot,max_capacity,current_count,clinical_area,batch,year_level,status,archived_at'
const announcementFields='announcement_id,title,content,batch,posted_at,updated_at'
const result=<T>(data:T[]|null,error:{message:string}|null)=>({data:data||[],error:error?{message:error.message}:null})

export const getStudentSchedules=cache(async(batch:string,year:string,today:string)=>{
 const {data,error}=await createAdminClient().from('mud_schedules').select(scheduleFields).is('archived_at',null).eq('status','open').gte('date',today).or(`batch.is.null,batch.eq.${batch}`).or(`year_level.is.null,year_level.eq.all,year_level.eq.${year}`).order('date')
 return result(data,error)
})

export const getAllSchedules=cache(async()=>{
 const {data,error}=await createAdminClient().from('mud_schedules').select(scheduleFields).is('archived_at',null).order('date')
 return result(data,error)
})

export const getStudentAnnouncements=cache(async(batch:string)=>{
 const {data,error}=await createAdminClient().from('announcements').select(announcementFields).or(`batch.is.null,batch.eq.${batch}`).order('posted_at',{ascending:false}).limit(20)
 return result(data,error)
})

export const getAllAnnouncements=cache(async()=>{
 const {data,error}=await createAdminClient().from('announcements').select(announcementFields).order('posted_at',{ascending:false}).limit(100)
 return result(data,error)
})
