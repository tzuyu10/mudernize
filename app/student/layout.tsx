import { requireUser } from '@/lib/auth'
import DashboardShell from '@/components/DashboardShell'
import {getBatchConfigs} from '@/lib/batch-data'
export default async function Layout({ children }: { children: React.ReactNode }) {
 const { profile } = await requireUser('student')
 const {data:batches}=await getBatchConfigs(true)
 return <DashboardShell admin={false} profile={profile} batchConfig={batches.find(batch=>batch.name===profile.batch)}>{children}</DashboardShell>
}
