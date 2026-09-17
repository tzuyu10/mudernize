'use client'
import {useState} from 'react'
import {updatePassword} from '@/app/student/profile/actions'
import ConfirmButton from './ConfirmButton'

export default function StudentPasswordForm(){
 const [show,setShow]=useState(false)
 return <form action={updatePassword} className="space-y-4 bg-white border rounded-lg p-6 profile-security-form">
  <div><h2 className="font-semibold">Password and security</h2><p className="muted text-xs mt-1">Only you can change your password while signed in.</p></div>
  <div className="grid md:grid-cols-2 gap-4">
   <label>New password<span className="admin-password-field"><input name="password" type={show?'text':'password'} minLength={12} maxLength={128} autoComplete="new-password" required placeholder="At least 12 characters"/><button type="button" className="admin-password-toggle" onClick={()=>setShow(value=>!value)} aria-label={show?'Hide passwords':'Show passwords'} aria-pressed={show}>{show?'Hide':'Show'}</button></span></label>
   <label>Confirm new password<input name="confirm_password" type={show?'text':'password'} minLength={12} maxLength={128} autoComplete="new-password" required placeholder="Enter it again"/></label>
  </div>
  <ConfirmButton className="primary" message="Change your account password?">Change password</ConfirmButton>
 </form>
}
