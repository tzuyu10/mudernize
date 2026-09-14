# Existing Supabase database

Use this path when the six original MUDernize tables already exist. Back up production data and review current constraints and RLS policies before applying changes.

## Prerequisites

The existing project must already include:

- the six original application tables;
- the additional batch, admin ID, recommendation, schedule audience, absence date, duty count, receipt, and evidence columns used by the application;
- a private `duty-documents` Storage bucket;
- trusted Auth provisioning that creates matching application profiles;
- the `is_clinical_head()` helper and role-aware RLS policies; and
- database checks and triggers for capacity, evidence, status transitions, and review auditing.

`001_base.sql` is for empty databases and must not be run over existing tables. It does not provide the complete Auth, Storage, or RLS baseline.

## Apply incremental migrations

Run these files once in the Supabase SQL Editor, in order:

1. `002_performance_concurrency.sql`
2. `003_product_adjustments.sql`
3. `004_automatic_tally_ratios.sql`
4. `005_batch_and_user_management.sql`
5. `006_student_duty_completion.sql`
6. `007_optional_middle_initial.sql`
7. `008_year_section.sql`
8. `009_tally_balances.sql`

Afterward, run `npm run db:check`. Use `validate_constraints.sql` to validate deferred `mud_*` constraints after correcting older records that violate the new rules.

## Optional SQL-based sample population

Prepare real Auth users and private fixture uploads:

```powershell
node scripts/prepare-sql-seed.mjs --apply
```

Then run `populate_existing.sql` in the Supabase SQL Editor. The preparation command prints the generated password only for newly created accounts. Matching accounts are reused with their existing password.

For provisioning errors, inspect the Supabase Postgres logs. `diagnose_auth_provisioning.sql` reports custom triggers and constraints. `fix_auth_provisioning.sql` reinstalls the deferred MUDernize provisioning trigger without deleting accounts or profiles.
