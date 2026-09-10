import Link from 'next/link'
import {batches} from '@/lib/auth'
import {requestPasswordReset} from './actions'

export default function Page({searchParams}:{searchParams:{message?:string}}) {
 return <main className="forgot-shell"><section className="forgot-card"><span className="forgot-icon" aria-hidden="true">↻</span><p className="eyebrow">ACCOUNT RECOVERY</p><h1>Forgot your password?</h1><p className="muted">Send a secure request to your Clinical Head. For privacy, the result is the same whether or not an account matches.</p>{searchParams.message&&<p className="success-notice" role="status">{searchParams.message}</p>}<form action={requestPasswordReset} className="space-y-4"><label>Student ID or Admin ID<input name="identifier" required maxLength={40} placeholder="e.g. 2025-301107"/></label><label>Category<select name="category" required defaultValue=""><option value="" disabled>Select Category</option>{batches.map(batch=><option key={batch}>{batch}</option>)}<option>Admin</option></select></label><button className="primary w-full">Send Reset Request</button></form><Link href="/login" className="forgot-back">← Back to sign in</Link></section></main>
}

