'use server'

import {parseInitialMuds} from '@/lib/signup-muds'
import {redirect} from 'next/navigation'
import {hasPrivacyConsent,PRIVACY_NOTICE_VERSION} from '@/lib/privacy'
import {accountEmail} from '@/lib/auth'
import {getBatchRule} from '@/lib/batch-data'
import {normalizeMiddleInitial} from '@/lib/names'
import {createAdminClient} from '@/lib/supabase/admin'

function signupError(message:string):never{
 redirect('/signup?error='+encodeURIComponent(message))
}

export async function signupStudent(form:FormData){
 if(!hasPrivacyConsent(form))signupError('Please review and accept the Terms & Privacy Notice before creating an account.')
 let initialMuds
 try{initialMuds=parseInitialMuds(form)}catch(error){signupError(error instanceof Error?error.message:'Enter your required MUDs.')}
 const studentNumber=String(form.get('student_number')||'').trim()
 const batch=String(form.get('batch')||'').trim()
 const yearSection=String(form.get('year_section')||'').trim().toUpperCase()
 const firstName=String(form.get('first_name')||'').trim()
 const lastName=String(form.get('last_name')||'').trim()
 const password=String(form.get('password')||'')
 const confirmation=String(form.get('confirm_password')||'')
 let middleInitial:string|null
 try{middleInitial=normalizeMiddleInitial(form.get('middle_initial'))}
 catch(error){signupError(error instanceof Error?error.message:'Enter a valid middle initial.')}
 if(!/^\d{4}-\d{6}$/.test(studentNumber))signupError('Use the student ID format YYYY-NNNNNN.')
 if(!firstName||!lastName||firstName.length>80||lastName.length>80)signupError('Enter your first and last name.')
 if(password.length<12||password.length>128)signupError('Use a password from 12 to 128 characters.')
 if(password!==confirmation)signupError('The passwords do not match.')
 let rule
 try{rule=await getBatchRule(batch)}catch{signupError('Choose an active batch.')}
 if(!studentNumber.startsWith(rule.student_year_prefix+'-'))signupError(`${rule.name} student IDs must start with ${rule.student_year_prefix}.`)
 if(!new RegExp(`^${rule.year_level[0]}NU-\\d{2}$`).test(yearSection))signupError(`Use the ${rule.year_level[0]}NU-05 format for year and section.`)
 const admin=createAdminClient()
 const {data:version,error:versionError}=await admin.rpc('mud_signup_tally_version')
 if(versionError||version!==1)signupError('Account creation is temporarily unavailable. Ask the Clinical Head to install the signup tally update.')
 const {error}=await admin.auth.admin.createUser({
  email:accountEmail(studentNumber),password,email_confirm:true,
  app_metadata:{initial_muds:initialMuds,privacy_notice_version:PRIVACY_NOTICE_VERSION,privacy_accepted_at:new Date().toISOString(),role:'student',student_number:studentNumber,batch:rule.name,year_level:rule.year_level,year_section:yearSection,first_name:firstName,middle_initial:middleInitial,last_name:lastName},
 })
 if(error){
  const duplicate=/already|registered|exists/i.test(error.message)
  signupError(duplicate?'A student account with this ID already exists.':'The account could not be created. Check your details and try again.')
 }
 redirect('/login?message='+encodeURIComponent('Student account created. You can now sign in.'))
}
