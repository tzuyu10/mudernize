# MUDernize Deployment Guide

This guide covers preparation, deployment, acceptance testing, client handoff, and rollback for MUDernize. The application requires a Node.js host because it uses Next.js server rendering, Middleware, Server Actions, authentication cookies, and protected server-side Supabase operations.

## Deployment options

| Option | Application host | Backend | Recommended use | Main limitation |
| --- | --- | --- | --- | --- |
| **One-month pilot** | Netlify Free | Supabase Free | Recommended no-cost client trial | Both services have usage limits; Supabase may pause a low-activity free project |
| **Free fallback** | Render Free Web Service | Supabase Free | Testing when Netlify is unavailable | Render sleeps after 15 minutes without traffic and can take about one minute to wake |
| **Ongoing institutional use** | Vercel Pro or paid Netlify | Supabase Pro | Continued production operation | Paid subscriptions |

GitHub Pages is unsupported because it can host only static output and cannot run the application's server features.

Netlify currently supports the Next.js App Router, server-side rendering, Middleware, and Server Actions through its automatically installed OpenNext adapter. Do not pin the adapter or configure the `.next` folder as a manual static publish directory.

## Information required from the client

- Access to the GitHub repository and chosen hosting provider
- Access to the production Supabase project
- Supabase project URL and public anonymous key
- Supabase service-role key for server-only administration
- Final production domain, if applicable
- Initial Clinical Head account information
- A private method for delivering initial and temporary passwords
- Approved privacy, backup, document-retention, and account-removal policies

Never commit `.env.local` or expose `SUPABASE_SERVICE_ROLE_KEY` in GitHub, screenshots, browser code, or a variable whose name starts with `NEXT_PUBLIC_`.

## Phase 1: Prepare the release

1. Open PowerShell in the authoritative project directory:

   ```powershell
   cd C:\Users\vonvo\mudernize\mudernize
   ```

2. Install the exact dependency versions recorded in `package-lock.json`:

   ```powershell
   npm ci
   ```

3. Run TypeScript validation and a production build:

   ```powershell
   npm run test:predeploy
   ```

4. Resolve every error before deployment. Warnings should be reviewed and documented if they cannot be removed.

5. Commit the tested files and push them to the production branch. A connected host deploys the repository commit, not uncommitted files on the development computer.

## Phase 2: Prepare Supabase

### 2.1 Back up the existing project

Export the current schema and data before applying a migration to a database containing client records. Store the export in an encrypted location controlled by the client. Supabase Free does not provide downloadable managed backups, so the client needs a manual backup procedure during a pilot.

### 2.2 Apply the database migrations

The normal upgrade path assumes that the original MUDernize tables, Auth configuration, private Storage bucket, helper functions, triggers, and Row Level Security policies already exist.

Open **Supabase Dashboard → SQL Editor** and run each missing file once in numeric order:

1. `database/002_performance_concurrency.sql`
2. `database/003_product_adjustments.sql`
3. `database/004_automatic_tally_ratios.sql`
4. `database/005_batch_and_user_management.sql`
5. `database/006_student_duty_completion.sql`
6. `database/007_optional_middle_initial.sql`
7. `database/008_year_section.sql`
8. `database/009_tally_balances.sql`

Migration 008 adds the required `year_section` field using values such as `4NU-05`. Migration 009 adds signed tally adjustments, safe tally reductions, student balance checks, and transactional protection against concurrent registrations exceeding an assigned tally.

Do not run `database/001_base.sql` over an existing database. Follow `database/EXISTING_DATABASE.md` when upgrading an existing project.

### 2.3 Configure local release validation

Create `.env.local` from `.env.local.example` and enter the production project's values:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-private-service-role-key
```

Run the complete application and live-schema check:

```powershell
npm run test:predeploy:db
```

Do not deploy until this command confirms that the connected database contains all required adjustments.

### 2.4 Verify authentication, storage, and security

1. In **Authentication → Providers**, disable public user signup. Clinical Heads create students through the application.
2. In **Authentication → URL Configuration**, set the production **Site URL** after the host supplies it and add the exact production URL to **Redirect URLs**.
3. Confirm that Row Level Security is enabled on every application table.
4. Confirm that `duty-documents` is a private Storage bucket.
5. Confirm that students can read only their own profile, registrations, notifications, and evidence.
6. Confirm that only authenticated Clinical Heads can create accounts or change administrative data.
7. Review **Database → Security Advisor** and resolve applicable warnings.
8. Configure the Storage file-size limit consistently with MUDernize's 5 MB application limit.
9. Remove unused demo accounts and test documents before client access.

### Optional data operations

Use demo data only in a disposable development project:

```powershell
npm run seed:preview
npm run seed:demo
```

`database/reset_to_single_admin.sql` is destructive. Use it only when the client explicitly wants all student and operational data removed while retaining `ADMIN-001` and restoring the three default batches.

## Phase 3A: Deploy on Netlify Free

Netlify Free is the preferred no-cost option for a small one-month pilot. The free plan currently provides a monthly credit allowance, so monitor usage and avoid unnecessary production rebuilds.

1. Sign in to Netlify and select **Add new project → Import an existing project**.
2. Connect GitHub, choose the MUDernize repository, and select the production branch.
3. Let Netlify detect Next.js automatically.
4. Verify the build configuration:

   | Setting | Value |
   | --- | --- |
   | Base directory | Empty when `package.json` is at the repository root |
   | Build command | `npm run build` |
   | Node.js | A supported Node.js 20 or 22 release |

5. Do not set `.next` as a manual static publish directory and do not pin `@netlify/plugin-nextjs`; Netlify configures the current adapter automatically.
6. Add these production environment variables:

   ```text
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   ```

7. Optionally add `NETLIFY_NEXT_SKEW_PROTECTION=true` to reduce failures when a browser has assets from an older deployment.
8. Deploy and open the generated `https://project-name.netlify.app` URL.
9. If the new project is private by default, publish it for public client access in Netlify's project settings.
10. Set the final HTTPS URL as the Supabase Auth Site URL and add it to Redirect URLs.
11. If adding a custom domain, wait for HTTPS to become active, then add that exact address to Supabase as well.

## Phase 3B: Deploy on Render Free

Render Free is a fallback for testing and short pilots. A free service spins down after 15 minutes without requests, and its local filesystem is temporary. All durable records and uploads must remain in Supabase.

1. In Render, select **New → Web Service** and connect the GitHub repository.
2. Choose the production branch and the Free instance type.
3. Configure:

   | Setting | Value |
   | --- | --- |
   | Runtime | Node |
   | Build command | `npm ci && npm run build` |
   | Start command | `npm run start` |
   | Health check path | `/login` |
   | Node.js | 20 or 22 |

4. Add the three Supabase environment variables listed above.
5. Deploy and open the generated `https://project-name.onrender.com` URL.
6. Set that URL as the Supabase Auth Site URL and add it to Redirect URLs.
7. Test again after at least 15 minutes of inactivity so the client understands the cold-start delay.

## Phase 3C: Deploy for ongoing institutional use

For continued client operation, use Vercel Pro or a paid Netlify plan with Supabase Pro. Vercel deployment steps are:

1. Create or select a Vercel Pro team.
2. Import the GitHub repository and keep the detected Next.js preset.
3. Select a supported Node.js 20 or 22 release.
4. Add the three Supabase environment variables for Production. Add them to Preview only if previews should access a separate non-production Supabase project.
5. Deploy, then configure the final address in Supabase Auth Site URL and Redirect URLs.
6. Connect the custom domain and repeat the Supabase URL configuration for its HTTPS address.

Supabase Pro is recommended for ongoing operation to avoid inactivity pauses and gain managed backup capabilities.

## Phase 4: Acceptance-test the deployed system

Use test identities and non-sensitive placeholder files. Remove them when acceptance testing is complete.

### Authentication and access

- Sign in as a student from Sanghaya, Solaris, and Astraea.
- Confirm that choosing the wrong batch rejects a student login.
- Sign in as a Clinical Head and verify all admin routes.
- Submit and process a password-recovery request.
- Confirm that a suspended student cannot sign in.
- Confirm that unauthenticated requests to `/student` and `/admin` return to login.

### Student and tally workflow

- Create a temporary student with an optional middle initial and a valid year-and-section value such as `4NU-05`; confirm that the creation form clears.
- Add Excused, Waived, and Unexcused tally requirements from the Clinical Head account.
- Increase and decrease a tally; confirm that its audit history and the student's Required, Registered, Completed, and Available values update.
- Confirm that a tally cannot be reduced below duties already registered.
- Confirm that Duty Registration shows the remaining balance and blocks requests that exceed it.
- Open two student sessions and submit against the same remaining balance; confirm that the database accepts only a valid combined quantity.

### Schedule and registration workflow

- Create, edit, close, and delete an empty schedule from the calendar popup.
- Confirm that registered schedules cannot have protected fields changed or be deleted as empty.
- Submit Excused and Unexcused registrations with a receipt and receipt number.
- Submit a Waived registration with a medical certificate and excuse letter.
- Confirm that past, closed, full, unavailable, and wrong-audience schedules cannot be selected.
- Approve, start, complete, and deny test requests; confirm that denial requires a reason.
- Confirm that denied registrations release their reserved capacity and balance.
- On or after a scheduled date, confirm that the student can mark their Approved or Ongoing duty complete.
- Confirm that schedule and registration updates appear in student notifications.

### Content, display, and files

- Create, edit, and delete an announcement; confirm its intended batch audience.
- Check dashboards, forms, cards, tables, calendars, dialogs, navigation, loading state, and theme controls on desktop and mobile widths.
- Test light and dark modes, including selected navigation, current calendar date, batch colors, statistics, and action-button contrast.
- Confirm that long names, year-section values, statuses, and announcements wrap without overlapping controls.
- Verify that one student cannot open another student's evidence.
- Verify that evidence links expire and are not permanent public URLs.
- In browser developer tools, confirm that the service-role key is absent from page source, JavaScript, and network responses.

## Phase 5: Client handoff

Provide the client with:

- Production website address and custom domain
- Administrator access to the hosting and Supabase organizations
- Domain and DNS ownership
- Initial Clinical Head credentials through a private channel
- Instructions for creating students, adding tallies, publishing schedules, reviewing requests, and issuing temporary passwords
- Agreed backup, privacy, support, document-retention, and account-removal procedures

Do not place the public URL, service-role key, database password, and user passwords in one handoff document.

## Monitoring during a one-month pilot

- Check host build, request, bandwidth, and compute usage every few days.
- Check Supabase database, Storage, and egress usage every few days.
- Visit a Supabase Free project regularly; low-activity projects may pause after seven days.
- Export important database records on the client's agreed schedule.
- Review application and Supabase logs after failed logins, uploads, registration errors, or unexpected status changes.
- Remove evidence and accounts according to the institution's retention policy.

## Rollback

1. Record the Git commit used for every production release.
2. Before a database migration, create and verify a backup. Application rollback does not reverse a database migration.
3. For an application-only problem, publish or promote the last known-good deployment in Netlify, Render, or Vercel.
4. For a database problem, stop administrative writes, assess the affected migration, and restore or repair from the verified backup. Do not improvise a destructive rollback on live client data.
5. Repeat the acceptance checks that cover the affected feature before reopening the service.

## Official platform references

- [Netlify Next.js overview](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/)
- [Netlify pricing](https://www.netlify.com/pricing/)
- [Render Next.js deployment](https://render.com/docs/deploy-nextjs-app)
- [Render free services](https://render.com/docs/free)
- [Vercel Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)
- [Vercel environment variables](https://vercel.com/docs/environment-variables/framework-environment-variables)
- [Supabase production checklist](https://supabase.com/docs/guides/deployment/going-into-prod)
- [Supabase Auth redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
- [Supabase Storage upload limits](https://supabase.com/docs/guides/storage/uploads/file-limits)
