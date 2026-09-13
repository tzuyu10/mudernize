import {requireUser} from '@/lib/auth'
import {updateProfile} from './actions'
import ConfirmButton from '@/components/ConfirmButton'
import {displayLabel} from '@/lib/labels'
import {displayName} from '@/lib/names'

const dutyTypes=['excused','waived','unexcused'] as const
export default async function Page({searchParams}:{searchParams:{error?:string;message?:string}}){
 const {supabase,user,profile}=await requireUser('student')
 const [{data:studentProfile,error},{data:registrations,error:registrationError},{data:adjustments,error:adjustmentError}]=await Promise.all([
  supabase.from('student_profiles').select('course_block,contact_number,address,clinical_area,manual_tally_count').eq('user_id',user.id).maybeSingle(),
  supabase.from('registrations').select('status,duty_count,duty_type').eq('student_id',user.id),
  supabase.from('tally_adjustments').select('duty_type,duty_total,duty_ratio,missed_count,created_at').eq('student_id',user.id).order('created_at',{ascending:false})
 ])
 const profileFields=[['course_block','Course / block'],['contact_number','Contact number'],['address','Address'],['clinical_area','Assigned Area']] as const
 const totals=Object.fromEntries(dutyTypes.map(type=>{const completed=(registrations||[]).filter(row=>row.status==='completed'&&row.duty_type===type).reduce((sum,row)=>sum+row.duty_count,0),added=(adjustments||[]).filter(row=>row.duty_type===type).reduce((sum,row)=>sum+row.duty_total,0);return [type,{completed,added,total:completed+added}]})) as Record<typeof dutyTypes[number],{completed:number;added:number;total:number}>
 const grandTotal=dutyTypes.reduce((sum,type)=>sum+totals[type].total,0)
 const loadError=error||registrationError||adjustmentError
 return <div className="space-y-6 page-stack"><div className="page-heading"><p className="eyebrow">STUDENT RECORD</p><h1>My profile</h1><p className="muted text-sm">Review your student details, duty totals, and contact information.</p></div><div className="bg-white border rounded-lg p-6"><h2 className="font-semibold text-lg">{displayName(profile)}</h2><p className="muted mt-2">{profile.student_number} · {profile.batch} · {profile.year_section||profile.year_level+' year'}</p></div>{(searchParams.error||loadError)&&<p className="notice" role="alert">{searchParams.error||loadError?.message}</p>}{searchParams.message&&<p className="notice success-notice" role="status">{searchParams.message}</p>}
  <section><div className="duty-tally-heading"><div className="duty-tally-title"><h2 className="text-lg font-semibold">Duty tally</h2><span className="duty-tally-total" aria-label={`${grandTotal} total duties`}><strong className="themeValue">{grandTotal}</strong><small>Total duties</small></span></div><p className="muted text-sm mt-1">Completed registrations and Clinical Head additions use the same category totals.</p></div><div className="grid md:grid-cols-3 gap-4">{dutyTypes.map(type=><article className="dashboardCard p-5" key={type}><p className="muted text-xs">{displayLabel(type)}</p><strong className="themeValue text-3xl block mt-2">{totals[type].total}</strong><p className="muted text-xs mt-2">{totals[type].completed} completed · {totals[type].added} added</p></article>)}</div></section>
  <section><h2 className="text-lg font-semibold mb-4">Registration status</h2><div className="grid grid-cols-4 gap-3">{['pending','verified','ongoing','completed'].map(status=><div className="bg-white border rounded-lg p-5" key={status}><p className="themeValue text-2xl">{(registrations||[]).filter(row=>row.status===status).length}</p><p className="muted text-xs mt-2">{displayLabel(status)}</p></div>)}</div></section>
  <form action={updateProfile} className="space-y-4 bg-white border rounded-lg p-6"><h2 className="font-semibold">Contact details</h2>{profileFields.map(([name,label])=><label key={name}>{label}<input name={name} defaultValue={studentProfile?.[name]||''} maxLength={500}/></label>)}<ConfirmButton className="primary" message="Save these profile changes?">Save profile</ConfirmButton></form>
 </div>
}
