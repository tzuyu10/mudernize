import LoginScreen from './LoginScreen'
import {getBatchConfigs} from '@/lib/batch-data'

export default async function LoginPage({ searchParams:searchParamsPromise }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const searchParams=await searchParamsPromise
  const {data:batches}=await getBatchConfigs()
  return <LoginScreen error={searchParams.error} message={searchParams.message} batches={batches}/>
}
