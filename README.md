# MUDernize

<p align="center">
  <img src="public/logos/mudernize-logo.png" alt="MUDernize logo" width="128" />
</p>

MUDernize is a web-based make-up duty management system for nursing students and Clinical Heads. It centralizes student account management, duty registration, evidence submission, schedule assignment, request verification, announcements, notifications, and duty tallies.

The system replaces manual forms and disconnected records with a role-based workflow. Students can submit and track their make-up duty requirements, while Clinical Heads can publish available schedules, review supporting documents, update request statuses, and monitor student progress.

## Intended users

### Students

Students belong to one of three batches:

| Batch | Student ID prefix | Derived year level | Theme color |
| --- | --- | --- | --- |
| Sanghaya | `2025-` | 2nd year | `#FFACEC` |
| Solaris | `2024-` | 3rd year | `#7A0000` |
| Astraea | `2023-` | 4th year | `#401268` |

### Clinical Heads

Clinical Heads are administrators who manage student accounts, schedules, announcements, registration reviews, access status, and student duty tallies.

## System workflow

### Student workflow

1. A new student creates an account using an official student number, active batch, name, year and section, and password. The student ID year and year level must match the selected batch.
2. The student signs in using the registered student number, batch, and password.
3. From My Profile, the student can update their name and contact profile, change their own password, and add 1:1 Excused, Waived, or Unexcused tally requirements.
4. The dashboard displays announcements, recent registration updates, notifications, and the remaining tally.
5. The student opens Duty Registration. The page shows the required, registered, completed, and available counts for each duty category.
6. The student selects an available schedule from the calendar. A schedule can be selected only when at least one duty category has an available balance.
7. The student enters the absence or appearance date and chooses a category:
   - **Excused** — requires a payment receipt and receipt number.
   - **Unexcused** — requires a payment receipt and receipt number.
   - **Waived** — requires a medical certificate and excuse letter.
8. The requested duty count cannot exceed the remaining tally for the selected category.
9. The student reviews the information and submits the registration.
10. The request appears as **Pending** while waiting for Clinical Head review.
11. The student receives a notification when the request is approved, denied, started, completed, or otherwise updated.
12. Approved, ongoing, and completed duties appear in the My Schedule calendar.
13. On or after an approved schedule's date, the student can mark that duty as completed from the calendar.
14. My Profile displays the student's identity, year and section, contact information, and category balances.

### Clinical Head workflow

1. The Clinical Head signs in using an administrator ID, the Admin category, and a password.
2. The dashboard displays registration totals and pending requests by batch.
3. My Students allows the Clinical Head to create student accounts with year-and-section information and manage separate Excused, Waived, and Unexcused requirements.
4. A Clinical Head can increase or decrease a requirement. The system keeps an adjustment history and prevents reductions below duties already registered.
5. Duty Schedules allows available dates, time slots, capacity, audience, and status to be created and updated through calendar-based controls.
6. Verification displays searchable registration cards with student details, evidence, recommendations, and review notes.
7. The Clinical Head can approve, start, complete, or deny a registration. Denial requires a reason and notifies the student.
8. Announcements can be published for all students or a selected batch.

## Student features

- Secure role-aware sign-in
- Student self-signup with active-batch, student-ID, and year-section validation
- Student-owned name, contact-profile, password, and 1:1 tally updates
- Account recovery with Clinical Head identity approval and a 15-minute one-time code
- Batch-specific visual theme and branding
- Dashboard status counts for Pending, Ongoing, Completed, and Total requests
- General and batch-specific announcements
- Calendar-based duty registration
- Available-date and remaining-capacity validation
- Excused, Unexcused, and Waived registration categories
- Receipt, medical certificate, and excuse-letter uploads
- Registration review and confirmation before submission
- Status and denial notifications
- Calendar-based personal schedule
- Date-guarded student completion control for approved or ongoing duties
- Profile and category-based duty tally
- Required, registered, completed, and available duty balances
- Registration limits based on the Clinical Head's category tally
- Light and dark modes
- Responsive navigation for desktop, tablet, and mobile devices

## Clinical Head features

- Clinical Head dashboard and analytics
- Student account creation with automatic cohort validation, an optional middle initial, and required year-and-section information such as `4NU-05`
- Batch creation, archiving, activation, and guarded deletion
- Clinical Head batch-logo upload and replacement using transparent PNG, JPG, or WebP images
- Student academic-record management and access suspension
- Password visibility control during account creation
- Student search and batch filtering
- Alphabetical student ordering after search and batch filtering
- Separate Excused, Waived, and Unexcused tally columns
- Audited tally increases and decreases with safeguards for active registrations
- Unexcused repeat-rotation ratios of 1:3 or 1:6
- Calendar-based schedule creation and management
- Schedule capacity and registration-lock rules
- Searchable and filterable registration verification
- Secure evidence links with limited availability
- Approval, denial, ongoing, and completion actions
- General and batch-specific announcement management
- Confirmation prompts for major changes
- Light and dark modes
- Responsive layouts for desktop, tablet, and mobile devices

## Registration and schedule rules

- Student IDs must use the `YYYY-NNNNNN` format.
- The student ID year must match the selected batch.
- Each student has a year-and-section record in `4NU-05` format; its leading year must match the selected batch's derived year level.
- Students can select only published, open, future schedules intended for their batch and year level.
- Past, closed, full, or unavailable schedules cannot be registered.
- Duplicate registrations for the same schedule are rejected.
- Absence dates cannot be in the future.
- Duty registrations use a 1:1 ratio for Excused, Unexcused, and Waived requests.
- Manually added Unexcused tallies can use a 1:3 or 1:6 repeat-rotation ratio.
- Students can increase or decrease their own 1:1 category requirements. Clinical Heads can also change requirements; no decrease can go below duties already registered.
- Students can register only the remaining Excused, Waived, or Unexcused balance assigned to them.
- Schedule dates and audiences are locked after registrations exist.
- Clinical Heads can delete any Open, Closed, or finished schedule. Empty schedules are removed permanently; schedules with registrations are archived so their history remains intact.
- Denied registrations release their reserved schedule capacity.
- Students can complete only their own Approved or Ongoing duty on or after its scheduled date.

## Status flow

```text
Pending → Approved → Ongoing → Completed
    └──────────────→ Denied
```

- **Pending** — submitted and waiting for review.
- **Approved** — accepted and assigned to a schedule.
- **Ongoing** — duty performance has started.
- **Completed** — duty requirement has been completed.
- **Denied** — request was rejected with a review reason.

## Technology stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| Front end | Next.js 15 App Router | Pages, layouts, navigation, and server-rendered views |
| UI | React 18 and TypeScript | Interactive components and type-safe application code |
| Styling | Tailwind CSS and CSS Modules | Responsive layout, themes, and component styling |
| Authentication | Supabase Auth | Student and Clinical Head authentication |
| Database | Supabase PostgreSQL | Users, schedules, registrations, announcements, tallies, and notifications |
| File storage | Supabase Storage | Payment receipts, medical certificates, and excuse letters |
| Security | PostgreSQL Row Level Security | Role-based and record-level data access |
| Performance | Server-side caching, indexed queries, and transactional locks | Faster repeated reads and safe concurrent tally or registration changes |

## Client requirements

The client must provide and maintain:

- A Supabase project for the production environment
- The production Supabase project URL and public anonymous key
- A protected Supabase service-role key for server-side administration
- A Node.js-compatible hosting provider for the Next.js application
- The official MUDernize logo and final batch logos, if the placeholders will be replaced
- A confirmed list of Clinical Head accounts
- An approved list of student accounts and their correct batch assignments
- Final wording for announcements, support details, privacy notices, and institutional policies
- A defined document-retention period for receipts and medical documents
- A process for distributing administrator-created initial passwords securely

The Supabase service-role key must be available only to trusted server code. It must never be included in browser code, screenshots, public documentation, or client-side environment variables.

## Environment requirements

The hosted application requires these environment variables:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-private-service-role-key
```

The server environment must use Node.js 20 or newer. Keep Supabase's direct public email signup disabled. The application's `/signup` route provisions student-only accounts through validated server code, while Clinical Heads can still create and manage accounts from My Students.

## Database requirements

The system uses the following main database records:

- Users and student profiles
- Announcements
- Make-up duty schedules
- Duty registrations
- Verification notes
- Tally adjustments
- Signed tally balances and registration-allocation safeguards

The production database must include the supplied constraints, indexes, triggers, storage configuration, and Row Level Security policies. These rules protect student data, validate registration transitions, reserve schedule capacity safely, and support concurrent users.

For an existing database, apply `002_performance_concurrency.sql` through `013_tally_completion_fixes.sql` in numeric order. Migration 008 adds year-and-section records. Migration 009 adds tally decreases and prevents registrations from exceeding assigned balances. Migration 010 lets Clinical Heads remove exact unregistered duty units. Migration 011 adds student-owned profile/tally support and safe schedule archival. Migration 012 adds public read-only storage for Clinical Head-managed batch logos. Migration 013 fixes student tally decreases and completion transitions.

## Document requirements

- Accepted file formats: PDF, JPG, and PNG
- Maximum file size: 5 MB per document
- Batch logos accept PNG, JPG, or WebP images up to 2 MB; transparent PNG is recommended.
- Excused and Unexcused requests require a receipt and receipt number.
- Waived requests require both a medical certificate and an excuse letter.
- Evidence files are stored in a private bucket and opened through short-lived signed links.

## Security and privacy

- Students can access only their own profile, registrations, schedule, notifications, and uploaded evidence.
- Clinical Head functions require an authenticated administrator account.
- Students can create only student accounts through the validated signup page and cannot choose or elevate their roles.
- Authenticated students can change only their own password and add tally requirements only to their own account.
- Sensitive account creation uses a server-only administrative client.
- Database constraints protect schedule capacity during concurrent registrations.
- Transactional database locks prevent concurrent tally edits or registrations from exceeding a student's assigned category balance.
- Major changes require confirmation before submission.
- Denials require review notes for accountability.
- Medical documents and student records should be handled according to the institution's privacy and retention policies.

## Demo accounts

Development data may include these sample identifiers:

| Sign-in ID | Category | Sample user |
| --- | --- | --- |
| `ADMIN-001` | Admin | Mara Reyes |
| `2025-301107` | Sanghaya | Andrea Santos |
| `2023-301108` | Astraea | Luis Cruz |
| `2024-301109` | Solaris | Sofia Garcia |

Demo passwords are assigned during account creation and should be delivered separately. Production passwords and private keys must never be written in this document.

## Current limitations

- A signed-in student can change their password from My Profile. A locked-out student can request recovery, receive a short-lived code after Clinical Head identity approval, and choose their own replacement password.
- The system does not send email, SMS, or operating-system push notifications.
- Notifications are displayed inside the application.
- Uploaded evidence is not automatically scanned for malware or checked for authenticity.
- Attendance timekeeping, report exports, and automated document deletion are not included.
- The institution must define its own data-retention, privacy, backup, and account-recovery policies before production use.

## Pre-deployment checklist

- Configure the production Supabase environment.
- Apply and verify all database constraints, indexes, triggers, and security policies.
- Create and test the initial Clinical Head account.
- Disable public Supabase user signup.
- Configure private evidence storage and upload limits.
- Set the required environment variables on the hosting provider.
- Replace placeholder branding assets when final files are available.
- Test student and Clinical Head workflows on desktop and mobile devices.
- Confirm backup, privacy, retention, and support procedures with the institution.

## Validation commands

Run the application checks from the project directory before every deployment:

```powershell
npm ci
npm run test:predeploy
```

After all database migrations have been applied and the three Supabase environment variables are configured, run the database-aware release check:

```powershell
npm run test:predeploy:db
```

`test:predeploy` performs TypeScript validation and a production Next.js build. `test:predeploy:db` repeats those checks and verifies the connected Supabase schema. See [DEPLOYMENT.md](DEPLOYMENT.md) for the complete setup, release, acceptance-test, and rollback process.