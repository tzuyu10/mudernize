import RegistrationForm from '@/components/RegistrationForm'
import { requireUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import {calculateTallyBalances} from '@/lib/tally'
export default async function Page({params,searchParams}:{params:{scheduleId:string};searchParams:{error?:string}}) {
 const {supabase,user}=await requireUser('student')
 const scheduleId=Number(params.scheduleId)
 if(!Number.isInteger(scheduleId)) redirect('/student/registration?error=Invalid+schedule.')
 const [{data:s},{data:existing},{data:adjustments},{data:registrations}]=await Promise.all([
  supabase.from('mud_schedules').select('schedule_id,date,time_slot,status,max_capacity,current_count').eq('schedule_id',scheduleId).maybeSingle(),
  supabase.from('registrations').select('registration_id').eq('student_id',user.id).eq('schedule_id',scheduleId).neq('status','denied').maybeSingle(),
  supabase.from('tally_adjustments').select('duty_type,signed_total').eq('student_id',user.id),
  supabase.from('registrations').select('duty_type,duty_count,status').eq('student_id',user.id)
 ])
 if(!s) redirect('/student/registration?error=This+schedule+is+not+available+for+your+batch+or+year.')
 const today=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Manila'})
 if(s.date<today) redirect('/student/registration?error=Past+duty+schedules+cannot+be+selected.')
 if(s.status!=='open') redirect('/student/registration?error=This+duty+schedule+is+closed.')
 if(s.current_count>=s.max_capacity) redirect('/student/registration?error=This+duty+schedule+is+already+full.')
 if(existing) redirect('/student/registration?error=You+already+have+an+active+registration+for+this+schedule.')
 const tallyBalances=calculateTallyBalances(adjustments,registrations)
 if(!Object.values(tallyBalances).some(balance=>balance.remaining>0))redirect('/student/registration?error=Your+Clinical+Head+must+add+an+available+duty+tally+before+you+can+register.')
 return <div className="max-w-xl page-stack"><div className="page-heading"><p className="eyebrow">DUTY REGISTRATION</p><h1>Request a make-up duty</h1><p className="muted text-sm">{s.date} · {s.time_slot}</p></div>{searchParams.error && <p className="notice" role="alert">{searchParams.error}</p>}<RegistrationForm id={params.scheduleId} scheduleDate={s.date} tallyBalances={tallyBalances}/></div>
}
