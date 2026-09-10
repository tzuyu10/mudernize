'use client'

import {useEffect,useRef,useState} from 'react'
import {addStudent} from '@/app/admin/students/actions'
import ConfirmButton from '@/components/ConfirmButton'

type Props={
 batches:readonly string[]
 resetKey?:string
}

function EyeIcon({hidden}:{hidden:boolean}){
 return hidden
  ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 4.2A10.8 10.8 0 0 1 12 4c5.5 0 9 5.5 9 5.5a15.8 15.8 0 0 1-2.2 2.8M6.6 6.6C4.4 8 3 10 3 10s3.5 5.5 9 5.5c1 0 2-.2 2.8-.5"/></svg>
  : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12s3.5-5.5 9-5.5 9 5.5 9 5.5-3.5 5.5-9 5.5S3 12 3 12Z"/><circle cx="12" cy="12" r="2.5"/></svg>
}

export default function AddStudentForm({batches,resetKey}:Props){
 const formRef=useRef<HTMLFormElement>(null)
 const [showPassword,setShowPassword]=useState(false)

 useEffect(()=>{
  if(!resetKey)return
  formRef.current?.reset()
  setShowPassword(false)
 },[resetKey])

 return <details className="bg-white border rounded-lg p-6">
  <summary className="font-semibold cursor-pointer">＋ Add Student</summary>
  <form ref={formRef} action={addStudent} className="space-y-4 mt-5" autoComplete="off">
   <div className="grid grid-cols-2 gap-4 admin-add-student-grid">
    <label>Student Number<input name="student_number" placeholder="2025-301107" pattern="[0-9]{4}-[0-9]{6}" required/></label>
    <label>Batch<select name="batch">{batches.map(batch=><option key={batch}>{batch}</option>)}</select><small className="muted block mt-2">2025 Sanghaya · 2024 Solaris · 2023 Astraea</small></label>
    <label>First Name<input name="first_name" required maxLength={80}/></label>
    <label>Last Name<input name="last_name" required maxLength={80}/></label>
   </div>
   <label>Initial Password
    <span className="admin-password-field">
     <input type={showPassword?'text':'password'} name="password" autoComplete="new-password" minLength={12} maxLength={128} required/>
     <button type="button" className="admin-password-toggle" aria-label={showPassword?'Hide password':'Show password'} aria-pressed={showPassword} onClick={()=>setShowPassword(value=>!value)}><EyeIcon hidden={showPassword}/></button>
    </span>
   </label>
   <ConfirmButton className="primary" message="Create this student account?">Create Student Account</ConfirmButton>
  </form>
 </details>
}
