import {createClient} from '@supabase/supabase-js'
import nextEnv from '@next/env'
nextEnv.loadEnvConfig(process.cwd())
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY
if(!url||!key)throw new Error('Configure the Supabase URL and service role key in .env.local.')
const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})
const [profiles,tallies,batches,users,registrations,tallyVersion,logoBucket]=await Promise.all([
 db.from('student_profiles').select('manual_tally_count').limit(1),
 db.from('tally_adjustments').select('adjustment_id,adjustment_kind,signed_total').limit(1),
 db.from('batches').select('batch_id').limit(1),
 db.from('users').select('is_active,middle_initial,year_level,year_section').limit(1),
 db.from('registrations').select('student_completed_at').limit(1),
 db.rpc('mud_tally_balance_version'),
 db.storage.getBucket('batch-logos'),
])
if(profiles.error||tallies.error||batches.error||users.error||registrations.error||tallyVersion.error||tallyVersion.data!==5||logoBucket.error){
 console.error('Database adjustments are not installed. Run database/003_product_adjustments.sql through database/013_tally_completion_fixes.sql in order in Supabase SQL Editor.')
 process.exitCode=1
}else console.log('Database adjustments are installed.')