import {requireUser} from '@/lib/auth'
import {getBatchConfigs} from '@/lib/batch-data'
import {postAnnouncement} from './actions'
import {getAllAnnouncements} from '@/lib/cached-data'
import ConfirmButton from '@/components/ConfirmButton'
import ResetAfterSubmitForm from '@/components/ResetAfterSubmitForm'

function Fields({announcement,batches}:{announcement?:any;batches:string[]}){
 return <>
  <label>Title<input name="title" defaultValue={announcement?.title} required maxLength={150}/></label>
  <label>Audience<select name="batch" defaultValue={announcement?.batch||''}><option value="">All Batches · General</option>{batches.map(batch=><option key={batch}>{batch}</option>)}</select></label>
  <label>Announcement<textarea name="content" defaultValue={announcement?.content} required maxLength={10000}/></label>
 </>
}

export default async function Page({searchParams}:{searchParams:{error?:string;message?:string}}){
 await requireUser('clinical_head')
 const [{data,error},{data:batchConfigs}]=await Promise.all([getAllAnnouncements(),getBatchConfigs()]),batches=batchConfigs.map(batch=>batch.name)
 return <div className="space-y-6 page-stack">
  <div className="page-heading"><p className="eyebrow">CLINICAL HEAD WORKSPACE</p><h1>Announcements</h1><p className="muted text-sm">Publish updates for every student or a specific batch.</p></div>
  {(searchParams.error||error)&&<p role="alert" className="notice">{searchParams.error||error?.message}</p>}
  {searchParams.message&&<p role="status" className="notice success-notice">{searchParams.message}</p>}
  <ResetAfterSubmitForm action={postAnnouncement} className="dashboardCard p-6 space-y-4"><h2 className="font-semibold">New Announcement</h2><Fields batches={batches}/><ConfirmButton className="primary" message="Publish this announcement?">Publish Announcement</ConfirmButton></ResetAfterSubmitForm>
  <div className="space-y-3">{data?.map(announcement=>{
   const editFormId=`announcement-edit-${announcement.announcement_id}`
   return <details key={announcement.announcement_id} className="dashboardCard p-5">
    <summary className="cursor-pointer font-semibold">{announcement.title} <span className="badge">{announcement.batch||'General'}</span></summary>
    <ResetAfterSubmitForm id={editFormId} action={postAnnouncement} className="space-y-4 mt-4"><input type="hidden" name="announcement_id" value={announcement.announcement_id}/><Fields announcement={announcement} batches={batches}/></ResetAfterSubmitForm>
    <div className="announcement-actions"><ConfirmButton form={editFormId} className="primary" message="Save these announcement changes?">Save Changes</ConfirmButton><form action={postAnnouncement}><input type="hidden" name="announcement_id" value={announcement.announcement_id}/><ConfirmButton message="Delete this announcement? This action cannot be undone." name="operation" value="delete" className="dangerButton">Delete Announcement</ConfirmButton></form></div>
   </details>
  })}</div>
  {!data?.length&&!error&&<div className="dashboardCard p-8 text-center muted">No announcements have been published.</div>}
 </div>
}
