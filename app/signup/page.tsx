import {getBatchConfigs} from '@/lib/batch-data'
import SignupScreen from './SignupScreen'

export default async function SignupPage({searchParams:searchParamsPromise}:{searchParams:Promise<{error?:string}>}){
 const [{data:batches},searchParams]=await Promise.all([getBatchConfigs(),searchParamsPromise])
 return <SignupScreen batches={batches} error={searchParams.error}/>
}
