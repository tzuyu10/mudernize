import { requireUser, batches } from '@/lib/auth'
import Link from 'next/link'
import {displayLabel} from '@/lib/labels'

export default async function Page() {
  const { supabase, profile } = await requireUser('clinical_head')
  const { data, error } = await supabase
    .from('registrations')
    .select('status,users!registrations_student_id_fkey(batch)')
  const count = (status: string) => data?.filter(row => row.status === status).length || 0

  return <div className="space-y-7">
    <section>
      <p className="eyebrow">CLINICAL HEAD DASHBOARD</p>
      <h1 className="dashboardGreeting !mb-2">Welcome back, {profile.first_name}.</h1>
      <p className="muted text-sm">Monitor registrations and move every batch forward.</p>
    </section>
    {error && <p className="notice">Unable to load registrations. Check the database setup.</p>}
    <section className="themePanel p-7 md:p-8 flex flex-col sm:flex-row justify-between sm:items-center gap-6">
      <div>
        <p className="text-xs opacity-70 tracking-widest">PENDING REVIEW</p>
        <p className="text-4xl font-semibold mt-2">{count('pending')}</p>
        <p className="text-sm opacity-80 mt-2">Registration requests are waiting for your decision.</p>
      </div>
      <Link href="/admin/verification" className="adminHeroAction self-start sm:self-auto">Review now →</Link>
    </section>
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {['pending', 'verified', 'ongoing', 'completed'].map((status, index) =>
        <article className="dashboardCard p-5" key={status} data-searchable>
          <div className="flex justify-between"><span className="text-xl">{['◷', '◇', '↻', '✓'][index]}</span><span className="badge">{displayLabel(status)}</span></div>
          <p className="themeValue text-3xl mt-5 font-semibold">{count(status)}</p>
          <p className="muted text-xs mt-1">{displayLabel(status)} registrations</p>
        </article>
      )}
    </section>
    <section>
      <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-semibold">Pending reviews by batch</h2><Link href="/admin/students" className="text-xs muted">View all students →</Link></div>
      <div className="grid md:grid-cols-3 gap-4">
        {batches.map(batch => <Link data-searchable href={'/admin/verification?batch=' + batch} key={batch} className="dashboardCard p-6 group">
          <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ background: batch === 'Astraea' ? '#401268' : batch === 'Sanghaya' ? '#ffacec' : '#7a0000' }} />
          <strong>{batch}</strong>
          <p className="text-3xl font-semibold mt-5">{data?.filter((row: any) => row.status === 'pending' && row.users?.batch === batch).length || 0}</p>
          <p className="muted text-xs mt-1">Awaiting review <span className="group-hover:ml-1 transition-all">→</span></p>
        </Link>)}
      </div>
    </section>
  </div>
}


