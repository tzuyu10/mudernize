// Creates Auth users through the supported Admin API and uploads fixture bytes.
// No announcements, schedules or registrations are inserted here.
import { createClient } from '@supabase/supabase-js'
import nextEnv from '@next/env'
import { randomBytes } from 'node:crypto'

nextEnv.loadEnvConfig(process.cwd())
if (!process.argv.includes('--apply')) {
  console.log('Preview only. Run node scripts/prepare-sql-seed.mjs --apply after the baseline schema and security rules are installed. This prepares four demo login accounts and three private fixture files for database/populate_existing.sql.')
  process.exit(0)
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) throw new Error('Configure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.')
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
const password = process.env.DEMO_PASSWORD || randomBytes(18).toString('base64url')
if (password.length < 12 || password.length > 128) throw new Error('DEMO_PASSWORD must be 12–128 characters.')
const accounts = [
  { id: 'ADMIN-001', role: 'clinical_head', first_name: 'Mara', middle_initial: 'L', last_name: 'Reyes' },
  { id: '2025-301107', role: 'student', first_name: 'Andrea', middle_initial: 'M', last_name: 'Santos', batch: 'Sanghaya', year_level: '2nd', year_section: '2NU-01', recommendation: 'excused' },
  { id: '2023-301108', role: 'student', first_name: 'Luis', last_name: 'Cruz', batch: 'Astraea', year_level: '4th', year_section: '4NU-05', recommendation: 'unexcused' },
  { id: '2024-301109', role: 'student', first_name: 'Sofia', middle_initial: 'R', last_name: 'Garcia', batch: 'Solaris', year_level: '3rd', year_section: '3NU-01', recommendation: 'waived' },
]
function checked(result) {
  if (result.error) throw new Error(result.error.message)
  return result.data
}
let printedPassword = false
for (const account of accounts) {
  const { id, ...metadata } = account
  const field = account.role === 'student' ? 'student_number' : 'admin_number'
  const email = id.toLowerCase() + '@accounts.mudernize.local'
  let profile = checked(await db.from('users').select('*').eq(field, id).maybeSingle())
  if (profile) {
    const auth = checked(await db.auth.admin.getUserById(profile.user_id))
    if (auth.user.email !== email || profile.role !== account.role ||
        (account.role === 'student' && (profile.batch !== account.batch || profile.year_level !== account.year_level || profile.year_section !== account.year_section))) {
      throw new Error('Existing ' + id + ' does not match the demo login/batch/year. Nothing on that account was overwritten.')
    }
    console.log('Reusing', id, '(existing password unchanged)')
  } else {
    const result = await db.auth.admin.createUser({
      email, password, email_confirm: true,
      app_metadata: { ...metadata, [field]: id },
    })
    if (result.error) {
      console.error('Could not create ' + id + ': ' + result.error.message)
      console.error('For "Database error creating new user", run database/fix_auth_provisioning.sql in Supabase SQL Editor, then retry. If it still fails, check Supabase Postgres logs for the exact constraint/trigger error.')
      process.exit(1)
    }
    const created = result.data
    if (!printedPassword) {
      console.log('Save this password for NEW demo accounts:', password)
      printedPassword = true
    }
    profile = checked(await db.from('users').select('*').eq('user_id', created.user.id).single())
    console.log('Created', id, account.batch || 'Admin')
  }
  if (account.role === 'student') {
    const name = 'sql-seed-placeholder.png'
    const files = checked(await db.storage.from('duty-documents').list(profile.user_id, { search: name, limit: 100 }))
    if (!files.some(file => file.name === name)) {
      const bytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=', 'base64')
      checked(await db.storage.from('duty-documents').upload(profile.user_id + '/' + name, bytes, { contentType: 'image/png', upsert: false }))
    }
  }
}
console.log('Preparation complete. Paste database/populate_existing.sql into Supabase SQL Editor. Fixtures are demo placeholders, not real evidence.')

