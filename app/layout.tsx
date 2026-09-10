import './globals.css'
import type { Metadata } from 'next'
import {Libre_Baskerville,Manrope} from 'next/font/google'

const display=Libre_Baskerville({weight:['400','700'],subsets:['latin'],variable:'--font-display',display:'swap'})
const sans=Manrope({weight:['400','500','600','700','800'],subsets:['latin'],variable:'--font-sans',display:'swap'})

export const metadata: Metadata = {
  title: 'MUDernize',
  description: 'A streamlined Make-Up Duty management system',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{__html:`try{var t=localStorage.getItem('mudernize-theme');var d=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.dataset.theme=d?'dark':'light';document.documentElement.style.colorScheme=d?'dark':'light'}catch(e){}`}} /></head>
      <body className={`${display.variable} ${sans.variable} bg-paper text-ink min-h-screen`}>{children}</body>
    </html>
  )
}
