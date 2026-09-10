import { requireUser } from '@/lib/auth'
import DashboardShell from '@/components/DashboardShell'
export default async function Layout({ children }: { children: React.ReactNode }) {
 const { profile } = await requireUser('student')
 return <DashboardShell admin={false} profile={profile}>{children}</DashboardShell>
}
