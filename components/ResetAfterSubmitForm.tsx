'use client'

import {useRef,type FormHTMLAttributes,type ReactNode} from 'react'

type Props=Omit<FormHTMLAttributes<HTMLFormElement>,'action'>&{
 action:(formData:FormData)=>Promise<void>
 children:ReactNode
}

export default function ResetAfterSubmitForm({action,children,...props}:Props){
 const formRef=useRef<HTMLFormElement>(null)
 async function submit(formData:FormData){
  await action(formData)
  formRef.current?.reset()
 }
 return <form {...props} ref={formRef} action={submit}>{children}</form>
}
