import {createClient} from '@supabase/supabase-js'
import nextEnv from '@next/env'
nextEnv.loadEnvConfig(process.cwd())
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY
if(!url||!key)throw new Error('Configure the Supabase URL and service role key in .env.local.')
const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})
const [profiles,resets,tallies]=await Promise.all([
 db.from('student_profiles').select('manual_tally_count').limit(1),
 db.from('password_reset_requests').select('request_id').limit(1),
 db.from('tally_adjustments').select('adjustment_id').limit(1),
])
if(profiles.error||resets.error||tallies.error){
 console.error('Database adjustments are not installed. Run database/003_product_adjustments.sql and database/004_automatic_tally_ratios.sql in Supabase SQL Editor.')
 process.exitCode=1
}else console.log('Database adjustments are installed.')
