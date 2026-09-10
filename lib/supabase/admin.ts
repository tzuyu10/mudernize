import 'server-only'
import {createClient} from '@supabase/supabase-js'
export function createAdminClient() {
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY
 if(!key) throw new Error('Account creation requires SUPABASE_SERVICE_ROLE_KEY on the server.')
 return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,key,{auth:{persistSession:false,autoRefreshToken:false}})
}
