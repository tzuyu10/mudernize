import RegistrationForm from '@/components/RegistrationForm'
import { requireUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
export default async function Page({params,searchParams}:{params:{scheduleId:string};searchParams:{error?:string}}) {
 const {supabase,user}=await requireUser('student')
 const scheduleId=Number(params.scheduleId)
 if(!Number.isInteger(scheduleId)) redirect('/student/registration?error=Invalid+schedule.')
 const [{data:s},{data:existing}]=await Promise.all([
  supabase.from('mud_schedules').select('schedule_id,date,time_slot,status,max_capacity,current_count').eq('schedule_id',scheduleId).maybeSingle(),
  supabase.from('registrations').select('registration_id').eq('student_id',user.id).eq('schedule_id',scheduleId).neq('status','denied').maybeSingle()
 ])
 if(!s) redirect('/student/registration?error=This+schedule+is+not+available+for+your+batch+or+year.')
 const today=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Manila'})
 if(s.date<today) redirect('/student/registration?error=Past+duty+schedules+cannot+be+selected.')
 if(s.status!=='open') redirect('/student/registration?error=This+duty+schedule+is+closed.')
 if(s.current_count>=s.max_capacity) redirect('/student/registration?error=This+duty+schedule+is+already+full.')
 if(existing) redirect('/student/registration?error=You+already+have+an+active+registration+for+this+schedule.')
 return <div className="max-w-xl page-stack"><div className="page-heading"><p className="eyebrow">DUTY REGISTRATION</p><h1>Request a make-up duty</h1><p className="muted text-sm">{s.date} · {s.time_slot}</p></div>{searchParams.error && <p className="notice" role="alert">{searchParams.error}</p>}<RegistrationForm id={params.scheduleId} scheduleDate={s.date}/></div>
}
