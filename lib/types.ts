export type Role = 'student' | 'clinical_head'
export type Batch = string
export type YearLevel = '2nd' | '3rd' | '4th'
export type DutyType = 'excused' | 'unexcused' | 'waived'
export type RegistrationStatus = 'pending' | 'verified' | 'denied' | 'ongoing' | 'completed'

export interface AppUser {
  user_id: string
  student_number: string | null
  admin_number: string | null
  batch: Batch | null
  recommendation: DutyType | null
  role: Role
  first_name: string
  middle_initial: string | null
  last_name: string
  year_level: YearLevel | null
  year_section: string | null
  created_at: string
}

export interface StudentProfile {
  profile_id: number
  user_id: string
  photo_url: string | null
  course_block: string | null
  contact_number: string | null
  address: string | null
  guardian_name: string | null
  guardian_contact: string | null
  clinical_area: string | null
  updated_at: string
}

export interface MudSchedule {
  batch: Batch | null
  clinical_area: string
  schedule_id: number
  date: string
  time_slot: 'AM' | 'PM'
  max_capacity: number
  current_count: number
  year_level: YearLevel | 'all' | null
  status: 'open' | 'closed'
  created_by: string
  created_at: string
}

export interface Registration {
  absence_date: string | null
  duty_count: number
  receipt_number: string | null
  medcert_path: string | null
  excuse_letter_path: string | null
  registration_id: number
  student_id: string
  schedule_id: number
  duty_type: DutyType
  receipt_url: string | null
  status: RegistrationStatus
  recommendation: DutyType | null
  submitted_at: string
  verified_at: string | null
  verified_by: string | null
  remarks: string | null
}

export interface Announcement {
  batch: Batch | null
  announcement_id: number
  posted_by: string
  title: string
  content: string
  posted_at: string
  updated_at: string | null
}
