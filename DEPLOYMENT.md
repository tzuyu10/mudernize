# MUDernize Deployment Guide

This guide explains how to deploy MUDernize for a client trial or production use. MUDernize is a dynamic Next.js application that uses Supabase for authentication, PostgreSQL data, and private document storage.

## Deployment options

| Option | Application host | Backend | Cost | Best use | Main limitation |
| --- | --- | --- | --- | --- | --- |
| **Recommended free option** | Netlify Free | Supabase Free | $0 | A small, active one-month client pilot | Monthly usage credits and no Supabase backups |
| **Free fallback** | Render Free Web Service | Supabase Free | $0 | Testing when Netlify is unavailable | Sleeps after 15 minutes and may take about one minute to wake |
| **Recommended production option** | Vercel Pro | Supabase Pro | Starts around US$45/month | Continued institutional use | Paid subscription |

GitHub Pages is not suitable because the application uses server-rendered routes, middleware, Server Actions, authentication cookies, and protected server-side operations.

## Information to prepare

Before deploying, obtain:

- Access to the GitHub repository that contains MUDernize.
- Access to the Supabase project already used by the application.
- The Supabase project URL.
- The public Supabase anonymous key.
- The private Supabase service-role key.
- Access to the institution's domain, if a custom domain will be used.
- The final Clinical Head account list.
- A secure method for giving initial passwords to account owners.

Never place the service-role key in GitHub, screenshots, client-side code, or variables beginning with `NEXT_PUBLIC_`.

## 1. Prepare the application

Run these commands from the project directory:

```powershell
cd C:\Users\vonvo\mudernize\mudernize
npm install
npm run test:predeploy
```

Deployment should continue only after both validation commands pass.

Confirm that the current changes are committed and pushed to GitHub. The hosting provider deploys the GitHub version, not uncommitted files that exist only on the development computer.

## 2. Prepare Supabase

### Use the existing Supabase project

The current MUDernize deployment path assumes that the original tables, authentication provisioning, private Storage bucket, helper functions, triggers, and Row Level Security policies already exist.

If the incremental migrations have not been applied, open **Supabase Dashboard → SQL Editor** and run these files once in order:

1. `database/002_performance_concurrency.sql`
2. `database/003_product_adjustments.sql`
3. `database/004_automatic_tally_ratios.sql`
4. `database/005_batch_and_user_management.sql`
5. `database/006_student_duty_completion.sql`
6. `database/007_optional_middle_initial.sql`

Do not run `database/001_base.sql` over an existing database. More database guidance is available in `database/EXISTING_DATABASE.md`.

After applying the migrations, configure `.env.local` on the development computer and run:

```powershell
npm run db:check
```

The local file must contain:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-private-service-role-key
```

After migration 007 has been applied, run the application, production-build, and live database checks together:

```powershell
npm run test:predeploy:db
```

### Verify Supabase security

Before allowing client access:

1. Open **Authentication → Providers** and disable public account signup.
2. Confirm that Row Level Security is enabled on every application table.
3. Confirm that the `duty-documents` bucket is private.
4. Confirm that students can read only their own profile, registrations, notifications, schedules, and documents.
5. Confirm that only Clinical Heads can create accounts or perform administrative actions.
6. Review warnings in **Database → Security Advisor**.
7. Remove unused development accounts and real documents from any test project.

### Optional demo data

Use demo data only in a development or demonstration database:

```powershell
npm run seed:preview
npm run seed:demo
```

`seed:demo` creates authentication accounts and database records. It requires the service-role key and prints the generated demo password. Save that password securely and never write it into public documentation.

Do not seed demo accounts into a database that contains real client records.

### Optional destructive reset

`database/reset_to_single_admin.sql` removes all MUDernize data and every Auth account except `ADMIN-001`, revokes its existing sessions, sets its configured password, and restores the three default batches. The administrator must already exist and be confirmed in Supabase Authentication; the script aborts before deletion when that account is missing or the Admin ID points to another identity.

## Option A: Deploy on Netlify Free

Netlify Free is the recommended no-cost option for a small one-month pilot.

### A1. Import the repository

1. Sign in to Netlify.
2. Select **Add new project → Import an existing project**.
3. Choose GitHub and authorize access to the MUDernize repository.
4. Select the repository.
5. Select the `main` branch for production deployment.

### A2. Configure the build

Netlify normally detects Next.js automatically. Verify these settings:

| Setting | Value |
| --- | --- |
| Base directory | Leave empty when `package.json` is at the repository root |
| Build command | `npm run build` |
| Publish directory | `.next` |
| Node.js version | `20` |

Add `NODE_VERSION` with the value `20` as an environment variable if the Netlify build does not use Node.js 20 automatically.

### A3. Add environment variables

Open **Project configuration → Environment variables** and add:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

Copy their values from the Supabase project or the local `.env.local` file. Set them for the production context. Never paste their actual values into source files.

### A4. Deploy

1. Select **Deploy project**.
2. Wait for the build to complete.
3. Open the generated `https://project-name.netlify.app` address.
4. If the build fails, open the deploy log and verify Node.js 20, the build command, and all environment variables.

Future commits pushed to `main` will trigger new production deployments.

### A5. Configure Supabase URLs

After Netlify provides the final address:

1. Open **Supabase Dashboard → Authentication → URL Configuration**.
2. Set **Site URL** to the Netlify production address.
3. Add the Netlify production address to **Redirect URLs**.
4. Add the custom domain as another allowed URL if one is connected later.
5. Do not use `localhost` as the production Site URL.

### A6. Optional custom domain

1. Open **Netlify → Domain management**.
2. Select **Add a domain**.
3. Follow Netlify's DNS instructions at the domain registrar.
4. Wait for the TLS certificate to become active.
5. Add the custom HTTPS address to the Supabase Site URL and Redirect URLs.

### A7. Monitor the free tier

Netlify Free currently uses monthly credits for production deployments, bandwidth, requests, and serverless compute. Avoid unnecessary production deployments and check **Usage & billing** during the trial.

Supabase Free currently includes 500 MB of database storage, 1 GB of file storage, and 5 GB of egress. Uploaded receipts, medical certificates, and excuse letters count toward Storage and egress. A low-activity free project may be paused after seven days.

## Option B: Deploy on Render Free

Use Render Free if Netlify cannot build or run the application. The first visitor after 15 minutes of inactivity may wait about one minute while the service starts.

### B1. Create the web service

1. Sign in to Render.
2. Select **New → Web Service**.
3. Connect GitHub and select the MUDernize repository.
4. Choose the `main` branch.
5. Select the **Free** instance type.

### B2. Configure the service

| Setting | Value |
| --- | --- |
| Runtime | Node |
| Build command | `npm install && npm run build` |
| Start command | `npm run start` |
| Health check path | `/login` |
| Node version | `20` or newer |

Add these environment variables under the service's **Environment** settings:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NODE_VERSION=20
```

### B3. Deploy and configure URLs

1. Select **Create Web Service**.
2. Wait for the build and start checks to pass.
3. Open the generated `https://project-name.onrender.com` address.
4. Set that address as the Supabase Authentication Site URL.
5. Add it to the Supabase Redirect URLs.

The Render filesystem is temporary. All persistent application data and uploaded documents must remain in Supabase.

## Option C: Deploy on Vercel Pro

Use this option if the pilot becomes an ongoing client service. Vercel Hobby is intended for personal, non-commercial work, so use Pro for institutional deployment.

### C1. Import and configure

1. Sign in to Vercel and create or select a Pro team.
2. Select **Add New → Project**.
3. Import the MUDernize GitHub repository.
4. Keep the automatically detected **Next.js** framework preset.
5. Keep `npm run build` as the build command.
6. Set Node.js to version 20.

### C2. Add environment variables

Add the following variables for Production and Preview as appropriate:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

Deploy the project, then configure the resulting Vercel address in the Supabase Authentication Site URL and Redirect URLs.

For continuing production use, upgrade Supabase to Pro as well so the database does not pause and receives managed backups.

## 3. Test the deployed system

Use test accounts and non-sensitive placeholder documents for this checklist.

### Authentication

- Sign in as one student from each batch.
- Confirm that selecting the wrong batch rejects the login.
- Sign in as a Clinical Head.
- Submit a password-reset request and process it from the Clinical Head account.
- Confirm that a suspended student cannot sign in.

### Student workflow

- Open the dashboard and verify announcements and counts.
- Open Duty Registration and select an available future schedule.
- Submit Excused and Unexcused requests with a receipt.
- Submit a Waived request with a medical certificate and excuse letter.
- Confirm that unavailable, full, closed, and past schedules cannot be selected.
- Confirm that notifications appear when a request status changes.
- Check My Schedule and My Profile on desktop and mobile.

### Clinical Head workflow

- Create a temporary test student, then verify that the form clears.
- Create, edit, close, and delete an empty schedule.
- Review, approve, deny, start, and complete test registrations.
- Confirm that denial requires a reason.
- Create, edit, and delete a test announcement.
- Add and manage batches.
- Add tally counts and confirm that they appear on the student's profile.

### Security and files

- Verify that one student cannot open another student's document.
- Verify that document links expire and are not permanent public links.
- Confirm that the service-role key is absent from browser source and network responses.
- Confirm that direct unauthenticated visits to `/student` and `/admin` redirect to login.

## 4. Client handoff

Provide the client with:

- The production website address.
- Ownership or administrator access to the hosting account.
- Ownership or administrator access to the Supabase organization.
- Ownership of the domain and DNS records.
- The initial Clinical Head credentials through a private channel.
- Instructions for creating students and issuing temporary passwords.
- The agreed document-retention and account-removal process.

Do not send the service-role key, database password, or user passwords in the same document as the public website address.

## 5. Backup and rollback

### Before the pilot

1. Export the Supabase database schema and data.
2. Record the deployed Git commit.
3. Verify that the export can be stored in an encrypted location.

### During the pilot

1. Check hosting and Supabase usage every few days.
2. Export important data regularly because Supabase Free does not include downloadable managed backups.
3. Keep real medical and payment documents only for the approved retention period.

### Roll back the application

- On Netlify, open **Deploys**, choose the last working deployment, and publish it.
- On Render, open **Deploys** and roll back to a recent successful deployment.
- On Vercel, open **Deployments**, select a known-good deployment, and promote it to Production.

Application rollback does not reverse database migrations or restore deleted records. Restore database data separately from a verified backup.

## 6. Removing the trial deployment

At the end of the trial:

1. Export any records the institution must retain.
2. Confirm that the client has received the export.
3. Remove real uploaded evidence according to the approved retention policy.
4. Disable or remove trial accounts.
5. Remove the custom domain from the trial host.
6. Delete hosting and Supabase resources only after the client confirms that they are no longer required.

## Official platform documentation

- [Netlify Next.js deployment](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/)
- [Netlify pricing and free-tier credits](https://www.netlify.com/pricing/)
- [Render Next.js deployment](https://render.com/docs/deploy-nextjs-app)
- [Render free-tier limitations](https://render.com/docs/free)
- [Vercel Next.js deployment](https://vercel.com/docs/frameworks/full-stack/nextjs)
- [Supabase pricing](https://supabase.com/pricing)
- [Supabase production checklist](https://supabase.com/docs/guides/deployment/going-into-prod)
