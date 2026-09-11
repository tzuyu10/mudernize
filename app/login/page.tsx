import LoginScreen from './LoginScreen'
import {getBatchConfigs} from '@/lib/batch-data'

export default async function LoginPage({ searchParams }: { searchParams: { error?: string; message?: string } }) {
  const {data:batches}=await getBatchConfigs()
  return <LoginScreen error={searchParams.error} message={searchParams.message} batches={batches}/>
}
