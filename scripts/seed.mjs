import {createClient} from '@supabase/supabase-js'
import nextEnv from '@next/env'
import {randomBytes} from 'node:crypto'
nextEnv.loadEnvConfig(process.cwd())
if(!process.argv.includes('--apply')) {
 console.log('Creates four demo accounts, two announcements, three schedules and three registrations. Run node scripts/seed.mjs --apply against a development project after the SQL setup. It refuses to overwrite existing demo accounts.'); process.exit(0)
}
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY
if(!url||!key) throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})
const password=process.env.DEMO_PASSWORD||randomBytes(18).toString('base64url')
if(password.length<12) throw new Error('DEMO_PASSWORD must contain at least 12 characters')
const accounts=[
 {id:'ADMIN-001',role:'clinical_head',first_name:'Mara',last_name:'Reyes'},
 {id:'2025-301107',role:'student',first_name:'Andrea',last_name:'Santos',batch:'Sanghaya',year_level:'2nd',recommendation:'excused'},
 {id:'2023-301108',role:'student',first_name:'Luis',last_name:'Cruz',batch:'Astraea',year_level:'4th',recommendation:'unexcused'},
 {id:'2024-301109',role:'student',first_name:'Sofia',last_name:'Garcia',batch:'Solaris',year_level:'3rd',recommendation:'waived'}
]
function check(result) {if(result.error)throw result.error;return result.data}
const existing=check(await db.from('users').select('user_id').or('admin_number.eq.ADMIN-001,student_number.in.(2025-301107,2023-301108,2024-301109)'))
if(existing.length) throw new Error('Demo accounts already exist. No data was changed. Use a fresh development project.')
console.log('Demo password (save securely):',password)
for(const a of accounts) {
 const {id,...meta}=a
 const result=check(await db.auth.admin.createUser({email:id.toLowerCase()+'@accounts.mudernize.local',password,email_confirm:true,app_metadata:{...meta,[a.role==='student'?'student_number':'admin_number']:id}}))
 a.uuid=result.user.id
 console.log('Created',id,a.batch||'Admin')
}
const admin=accounts[0]
check(await db.from('announcements').insert([{posted_by:admin.uuid,title:'Welcome to MUDernize',content:'Select a duty date, upload the required documents, and submit your request for review.'},{posted_by:admin.uuid,batch:'Sanghaya',title:'Sanghaya clinical duty reminders',content:'Bring your clinical uniform and arrive 15 minutes before your assigned shift.'}]))
const today=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Manila'})
const date=new Date(today+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+7)
const bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=','base64')
for(const [index,a] of accounts.slice(1).entries()) {
 const s=check(await db.from('mud_schedules').insert({date:date.toISOString().slice(0,10),time_slot:'AM',max_capacity:10,year_level:'all',batch:a.batch,clinical_area:'Demo ward '+(index+1),created_by:admin.uuid}).select().single())
 const path=a.uuid+'/demo-document.png'
 check(await db.storage.from('duty-documents').upload(path,bytes,{contentType:'image/png'}))
 check(await db.from('registrations').insert({student_id:a.uuid,schedule_id:s.schedule_id,duty_type:a.recommendation,absence_date:today,duty_count:1,receipt_number:a.recommendation==='waived'?null:'DEMO-RECEIPT-'+(index+1),receipt_url:a.recommendation==='waived'?null:path,medcert_path:a.recommendation==='waived'?path:null,excuse_letter_path:a.recommendation==='waived'?path:null}))
}
console.log('Sample data ready. Documents are demo placeholders, not real medical or payment records. All registrations start pending; use the admin review screen to exercise the workflow.')

