import {createClient} from '@supabase/supabase-js'
import nextEnv from '@next/env'

nextEnv.loadEnvConfig(process.cwd())
if(!process.argv.includes('--apply')){
 console.log('Creates or updates one Clinical Head account. Set NEW_ADMIN_ID and NEW_ADMIN_PASSWORD, then run with --apply.')
 process.exit(0)
}
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY
const id=String(process.env.NEW_ADMIN_ID||'').trim().toUpperCase(),password=String(process.env.NEW_ADMIN_PASSWORD||'')
const firstName=String(process.env.NEW_ADMIN_FIRST_NAME||'Clinical').trim(),lastName=String(process.env.NEW_ADMIN_LAST_NAME||'Administrator').trim()
if(!url||!key)throw new Error('Configure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.')
if(!/^[A-Z0-9-]{3,40}$/.test(id)||password.length<12||password.length>128||!firstName||!lastName)throw new Error('Use a valid admin ID, names, and a password from 12 to 128 characters.')
const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}),email=`${id.toLowerCase()}@accounts.mudernize.local`
const metadata={role:'clinical_head',admin_number:id,first_name:firstName,last_name:lastName}
let {data:profile,error:profileError}=await db.from('users').select('user_id').eq('admin_number',id).maybeSingle()
if(profileError)throw profileError
let userId=profile?.user_id
if(!userId){
 const {data:list,error:listError}=await db.auth.admin.listUsers({page:1,perPage:1000})
 if(listError)throw listError
 userId=list.users.find(user=>user.email?.toLowerCase()===email)?.id
}
if(userId){
 const {error}=await db.auth.admin.updateUserById(userId,{email,password,email_confirm:true,app_metadata:metadata})
 if(error)throw error
 const {error:upsertError}=await db.from('users').upsert({user_id:userId,student_number:null,admin_number:id,role:'clinical_head',first_name:firstName,middle_initial:null,last_name:lastName,year_level:null,year_section:null,batch:null,recommendation:null,is_active:true},{onConflict:'user_id'})
 if(upsertError)throw upsertError
 console.log(`Updated Clinical Head account ${id}.`)
}else{
 const {error}=await db.auth.admin.createUser({email,password,email_confirm:true,app_metadata:metadata})
 if(error)throw error
 console.log(`Created Clinical Head account ${id}.`)
}
