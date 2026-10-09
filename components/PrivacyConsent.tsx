'use client'
import {useEffect,useId,useRef,useState} from 'react'
import {createPortal} from 'react-dom'
import {PRIVACY_NOTICE_VERSION} from '@/lib/privacy'
import styles from './PrivacyConsent.module.css'

export default function PrivacyConsent({purpose}:{purpose:'account'|'documents'}){
 const root=useRef<HTMLDivElement>(null)
 const dialog=useRef<HTMLDialogElement|null>(null)
 const trigger=useRef<HTMLButtonElement>(null)
 const [mounted,setMounted]=useState(false)
 const [accepted,setAccepted]=useState(false)
 const [terms,setTerms]=useState(false)
 const [processing,setProcessing]=useState(false)
 const resumeSubmission=useRef(false)
 const id=useId()
 function open(){
  setMounted(true)
  setTerms(accepted)
  setProcessing(accepted)
 }
 function close(){resumeSubmission.current=false;dialog.current?.close();setMounted(false);trigger.current?.focus()}
 function accept(){const resume=resumeSubmission.current;close();resumeSubmission.current=resume;setAccepted(true)}
 useEffect(()=>{if(accepted&&resumeSubmission.current){resumeSubmission.current=false;root.current?.closest('form')?.requestSubmit()}},[accepted])
 useEffect(()=>{
  const form=root.current?.closest('form')
  function beforeSubmit(event:Event){if(!accepted){event.preventDefault();event.stopImmediatePropagation();resumeSubmission.current=true;open()}}
  form?.addEventListener('submit',beforeSubmit,true)
  return ()=>form?.removeEventListener('submit',beforeSubmit,true)
 },[accepted])
 return <div ref={root} className={styles.consent}>
  <input type="hidden" name="privacy_consent" value={accepted?PRIVACY_NOTICE_VERSION:''}/>
  <button ref={trigger} type="button" className={styles.review} onClick={open} aria-haspopup="dialog">Terms &amp; Privacy Notice</button>
  <p role="status">{accepted?'Notice accepted.':'You’ll be asked to accept before submitting.'}</p>

  {mounted&&createPortal(<dialog ref={node=>{dialog.current=node;if(node&&!node.open)node.showModal()}} className={styles.dialog} aria-labelledby={id} onCancel={close} onClick={event=>{if(event.target===event.currentTarget)close()}} onClose={()=>{setMounted(false);trigger.current?.focus()}}>
   <header className={styles.header}><div><h2 id={id}>Terms &amp; Privacy Notice</h2><p>MUDernize · Version {PRIVACY_NOTICE_VERSION}</p><p>Trinity University of Asia – St. Luke's College of Nursing</p></div><button type="button" className={styles.close} aria-label="Close terms and privacy notice" onClick={close}>×</button></header>
   <div className={styles.body}>
    <p>{purpose==='account'?'Before creating your student account, review how your information is used.':'Before submitting documents, review how your information and supporting evidence are used.'}</p>
    <h3>Using MUDernize</h3>
    <p>Use your own student identity, provide accurate information, and protect your password. Submit authentic documents relevant to your duty request. Do not impersonate others, upload malicious files, or access records without permission. Submission does not guarantee approval; your Clinical Head reviews the request.</p>
    <h3>Information and purpose</h3>
    <p>{purpose==='account'?'Your Student ID, name, batch, year and section, required MUD counts by category, and sign-in credentials are used to create and manage your account and connect you to your duty records.':'Your registration details, excuse letters, medical certificates, receipts, and other supporting documents are used to assess the specific duty request, verify evidence, and maintain its review and completion record.'} Educational and health information may be sensitive personal information under Republic Act No. 10173, the Philippine Data Privacy Act of 2012.</p>
    <h3>Document handling</h3>
    <p>Upload only what is needed. Remove unrelated personal or patient details before uploading, without altering evidence needed for review. Do not submit someone else's private documents without proper authority. This acceptance does not permit marketing, public posting, or unrelated research or other uses; a new purpose needs its own notice and lawful basis.</p>
    <h3>Access and storage</h3>
    <p>Trinity University of Asia – St. Luke's College of Nursing operates MUDernize through its Clinical Heads. Authorized Clinical Heads review duty records and uploaded evidence. Supabase provides account, database, and document storage services. Documents are not intended for public distribution. Ask your Clinical Head for the school's official privacy contact and applicable retention schedule; this popup does not establish a deletion date.</p>
    <h3>Your privacy rights</h3>
    <p>Processing must follow transparency, legitimate purpose, and proportionality. Subject to applicable law, you may request access, correction, objection, erasure or blocking, and data portability. You may withdraw consent for future consent-based processing and lodge a complaint with the National Privacy Commission. Withdrawal does not invalidate earlier lawful processing; some records may need to be retained under another lawful basis.</p>
    <p>Contact your Clinical Head to reach the university's Data Protection Officer, request the applicable retention policy, or discuss an alternative submission process if you decline. Declining prevents this online submission. Acceptance does not waive your statutory rights.</p>
    <p><a href="https://privacy.gov.ph/data-privacy-act-/" target="_blank" rel="noreferrer">Read the Data Privacy Act</a> · <a href="https://privacy.gov.ph/implementing-rules-regulations-data-privacy-act-%202012/" target="_blank" rel="noreferrer">Implementing rules</a></p>
    <div className={styles.acceptance}>
     <label className={styles.check}><input type="checkbox" checked={terms} onChange={event=>{setTerms(event.target.checked);if(purpose==='account')setProcessing(event.target.checked)}}/><span>{purpose==='account'?'I have read and agree to the Terms & Privacy Notice, and consent to processing my account and educational information for account creation and duty management.':'I have read the notice and agree to the document submission terms.'}</span></label>
     {purpose==='documents'&&<label className={styles.check}><input type="checkbox" checked={processing} onChange={event=>setProcessing(event.target.checked)}/><span>I consent to processing the personal and sensitive information in this submission, including health information where provided, for assessment and management of this duty request.</span></label>}
    </div>
   </div>
   <footer className={styles.actions}><button type="button" onClick={()=>{setAccepted(false);close()}}>Decline</button><button type="button" disabled={!terms||!processing} onClick={accept}>Accept and continue</button></footer>
  </dialog>,document.body)}
 </div>
}
