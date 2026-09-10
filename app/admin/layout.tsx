import { requireUser } from '@/lib/auth'
import DashboardShell from '@/components/DashboardShell'
export default async function Layout({ children }: { children: React.ReactNode }) {
 const { profile } = await requireUser('clinical_head')
 return <DashboardShell admin profile={profile}>{children}</DashboardShell>
}
