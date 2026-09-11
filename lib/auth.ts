import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cache } from 'react'
export const batches = ['Sanghaya', 'Astraea', 'Solaris'] as const
export const cohortRules={Sanghaya:{prefix:'2025',year:'2nd'},Solaris:{prefix:'2024',year:'3rd'},Astraea:{prefix:'2023',year:'4th'}} as const
export function studentYearForBatch(studentNumber:string,batch:string) {
 const rule=cohortRules[batch as keyof typeof cohortRules]
 if(!rule||!studentNumber.startsWith(rule.prefix+'-')) throw new Error(`${batch} student numbers must start with ${rule?.prefix||'the assigned cohort year'}.`)
 return rule.year
}
export function accountEmail(id: string) {
 if (!/^[a-zA-Z0-9-]{3,40}$/.test(id)) throw new Error('Use an ID containing 3–40 letters, numbers or hyphens.')
 return `${id.toLowerCase()}@accounts.mudernize.local`
}
// React cache is request-scoped. Layouts and pages can share this lookup without
// leaking an authenticated profile into another request or user session.
const getSessionContext=cache(async()=>{
 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()
 if (!user) redirect('/login')
 const { data: profile } = await supabase.from('users').select('user_id,student_number,admin_number,role,first_name,last_name,year_level,batch,recommendation').eq('user_id', user.id).single()
 if (!profile) redirect('/login?error=Account+profile+is+not+configured')
 const {data:access}=await supabase.from('users').select('is_active').eq('user_id',user.id).maybeSingle()
 if(access?.is_active===false){await supabase.auth.signOut();redirect('/login?error=This+account+is+inactive.+Contact+your+Clinical+Head.')}
 return {supabase,user,profile}
})
export async function requireUser(role?: string) {
 const context=await getSessionContext()
 const {profile}=context
 if (role && profile.role !== role) redirect(profile.role === 'clinical_head' ? '/admin' : '/student')
 return context
}
