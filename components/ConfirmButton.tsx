'use client'

type ButtonProps=React.ButtonHTMLAttributes<HTMLButtonElement>&{message:string}
export default function ConfirmButton({message,onClick,...props}:ButtonProps) {
 return <button {...props} onClick={event=>{
  onClick?.(event)
  if(event.defaultPrevented)return
  const form=event.currentTarget.form
  if(form&&!form.checkValidity())return
  if(!window.confirm(message))event.preventDefault()
 }}/>
}
