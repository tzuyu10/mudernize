'use server'
import { createClient } from '@/lib/supabase/server'
import { accountEmail } from '@/lib/auth'
import { redirect } from 'next/navigation'
export async function login(form: FormData) {
 const id = String(form.get('identifier') || '').trim()
 const category = String(form.get('category') || '')
 let email: string
 try { email = accountEmail(id) } catch { redirect('/login?error=Enter+a+valid+ID') }
 if (!category||category.length>40) redirect('/login?error=Choose+a+category')
 const supabase = await createClient()
 const { data, error } = await supabase.auth.signInWithPassword({ email, password: String(form.get('password') || '') })
 if (error || !data.user) redirect('/login?error=Invalid+ID,+category,+or+password')
 const { data: profile } = await supabase.from('users').select('role,batch').eq('user_id', data.user.id).single()
 if (!profile || (category === 'Admin' ? profile.role !== 'clinical_head' : profile.role !== 'student' || profile.batch !== category)) {
  await supabase.auth.signOut()
  redirect('/login?error=Invalid+ID,+category,+or+password')
 }
 const {data:access}=await supabase.from('users').select('is_active').eq('user_id',data.user.id).maybeSingle()
 if(access?.is_active===false){await supabase.auth.signOut();redirect('/login?error=This+account+is+inactive.+Contact+your+Clinical+Head.')}
 redirect(profile.role === 'clinical_head' ? '/admin' : '/student')
}
