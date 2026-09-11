import 'server-only'
import {unstable_cache} from 'next/cache'
import {createAdminClient} from '@/lib/supabase/admin'
import {defaultBatchConfigs,type BatchConfig} from '@/lib/batch-config'

const fields='name,student_year_prefix,year_level,theme_color,logo_path,is_active'

function normalizeBatchLogo(batch:BatchConfig):BatchConfig{
 return batch.logo_path==='/logos/mudernize-logo.svg'?{...batch,logo_path:'/logos/mudernize-logo.png'}:batch
}

export const getBatchConfigs=unstable_cache(async(includeInactive=false)=>{
 const {data,error}=await createAdminClient().from('batches').select(fields).order('student_year_prefix',{ascending:false})
 if(error)return {data:defaultBatchConfigs.filter(batch=>includeInactive||batch.is_active),error:{message:error.message},usingFallback:true}
 return {data:(data as BatchConfig[]).map(normalizeBatchLogo).filter(batch=>includeInactive||batch.is_active),error:null,usingFallback:false}
},['batch-configs-v1'],{revalidate:60,tags:['batches']})

export async function getBatchRule(name:string){
 const {data,error}=await createAdminClient().from('batches').select(fields).eq('name',name).eq('is_active',true).maybeSingle()
 if(data)return normalizeBatchLogo(data as BatchConfig)
 const fallback=defaultBatchConfigs.find(batch=>batch.name===name)
 if(error&&fallback)return fallback
 throw new Error('Choose an active batch.')
}
