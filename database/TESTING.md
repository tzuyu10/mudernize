# Integration acceptance checks

Use only a development Supabase project. Apply the schema/setup and sample importer first.

1. Sign in as 2025-301107 / Sanghaya with the generated password. Repeat with Astraea or Admin selected: login must fail and leave no authenticated session.
2. Confirm `/signup` returns 404. A direct public Auth signup without trusted app metadata must fail.
3. Student dashboard shows general + Sanghaya announcements, not Astraea/Solaris content. Student calendar shows own-batch/all schedules only.
4. In another browser session, sign in as ADMIN-001 / Admin. Create an all-batch slot and confirm it appears for every batch.
5. Submit an excused request without a receipt, waived request without both documents, future absence, or file over 5 MB: each must fail. Valid evidence must submit pending.
6. Submit two requests for the same absence or same slot: the second must fail, including simultaneous requests.
7. Create a capacity-one all-batch slot. From two eligible students with different absence dates, submit concurrently: exactly one succeeds; current_count must remain 1.
8. Attempt student REST updates to role, batch, schedules or review status: RLS must reject them. Fetch another student's profile/registration/document: access must fail.
9. Admin denies without notes: reject. Deny with notes: seat is released and a verification_notes row is added.
10. Admin approves then starts then completes: all transitions work. Skip directly from pending to completed: reject. Repeat a stale review action: report failure.
11. Try changing an occupied schedule's date/audience or reducing capacity below occupancy: reject. Delete a schedule with history: reject.
12. Edit/delete announcements and unused schedules; reload both portals and verify changes.
13. Add a student with an ID like 2023-301110; verify login. Reuse an existing ID: reject without duplicate public profile.
14. Inspect signed document links: they expire after five minutes. Reload reviews to issue a new link.
15. Profile category filter changes registration counts and duty totals. Admin batch/search filters isolate the appropriate students.
16. Create a student with a matching year-section such as `4NU-05`; confirm it appears in My Students, Verification, and My Profile. Confirm a mismatched value such as `3NU-05` for a fourth-year batch is rejected.

No live integration results are claimed by this checklist.

