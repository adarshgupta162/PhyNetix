
# Finish Phynetix Schema in One Migration

## Goal

Stop the batch-by-batch approach. Author **one** clean, idempotent SQL migration that contains every remaining table, enum, function, trigger, RLS policy and GRANT the frontend + edge functions require. Save it as a real file on disk under `supabase/migrations/` AND submit it through the migration tool so it actually runs against Lovable Cloud.

## What's already in the DB (keep, don't recreate)

`profiles`, `user_roles`, `courses`, `chapters`, `questions`, `tests`, `test_subjects`, `test_sections`, `test_section_questions`, `test_questions`, `test_attempts`, `qb_courses`, `qb_chapters`, `qb_questions`, `qb_attempts`, `qb_bookmarks`, `notifications`, `audit_logs`, `departments`, `staff_requests`, `community_messages`, plus the functions `has_role`, `handle_new_user`, `update_updated_at_column`, `generate_roll_number`, `user_completed_test`, `is_staff`.

## What's missing (this migration adds)

Tables the frontend / edge functions call but the DB doesn't have yet:

- **Batches & enrollment**: `batches`, `batch_enrollments`, `batch_tests`
- **Commerce**: `payments`, `coupons`
- **Institutions**: `institutions`, `institution_members`
- **Library**: `phynetix_library`
- **Platform**: `platform_settings`
- **DPP**: `dpps`, `dpp_questions`, `dpp_attempts`
- **Question extras**: `question_bookmarks`, `question_paragraphs`
- **Test overrides**: `test_user_overrides`
- **Proctoring (full set)**: `proctoring_test_settings`, `proctoring_user_overrides`, `proctoring_sessions`, `proctoring_events`, `proctoring_alerts`, `proctoring_recordings`, `monitoring_permissions`
- **Legacy aliases referenced in code**: `monitoring_sessions`, `monitoring_events` (created as compatibility tables)

Helper functions used by RLS and edge functions:

- `is_enrolled_in_batch(_user_id, _batch_id)` — security definer
- `user_has_paid_for_test(_user_id, _test_id)` — checks payments + batch enrollment
- `proctoring_schema_health()` — used by `_shared/proctoring.ts`

Each table gets, in this order: `CREATE TABLE` → `GRANT` (authenticated + service_role; anon only where intentionally public like `platform_settings`) → `ENABLE ROW LEVEL SECURITY` → `CREATE POLICY` (admin via `has_role`, owner via `auth.uid()`, enrollment via `is_enrolled_in_batch`) → `updated_at` trigger where applicable.

## Fixing the "bought course but test not visible / batch asks to buy again" bug

This is the root issue the user reported. It's caused by missing `batch_enrollments` + `user_has_paid_for_test` plumbing. The migration fixes it by:

1. Creating `batch_enrollments(user_id, batch_id, status, enrolled_at, expires_at)` with a unique `(user_id, batch_id)` index.
2. Creating `payments(user_id, batch_id?, test_id?, amount, status, …)` and on `status='completed'` having an AFTER trigger insert into `batch_enrollments` automatically.
3. RLS on `tests` and `batch_tests` lets a student `SELECT` when `is_enrolled_in_batch(auth.uid(), batch_id)` returns true.
4. Frontend hooks (`useEnrollment`, `useBatches`) already query these table names — no frontend changes needed once tables exist.

## File output

- **Write to disk**: `supabase/migrations/20260611000000_phynetix_complete_schema.sql` containing the full SQL (idempotent with `CREATE TABLE IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION`, `DROP POLICY IF EXISTS … ; CREATE POLICY …`).
- **Also save** the 3 already-applied consolidated files I ran earlier as-is (they're already on disk: `20260610122636…`, `20260610122713…`, `20260610122750…`) — confirmed present.
- **Apply** the new file through the migration tool in a single call so Lovable Cloud runs it and regenerates `src/integrations/supabase/types.ts`.

## Storage buckets (separate, after migration)

Storage buckets can't be created via SQL through the migration tool. After the migration runs, create the buckets the code references (`avatars`, `course-thumbnails`, `question-images`, `pdf-tests`, `library`, `proctoring-recordings`) via `supabase--storage_create_bucket` — public/private set per bucket.

## Out of scope for this step

- Rewriting the 40 original broken migration files (kept on disk for reference only; not replayed).
- Seeding data (courses, library items) — done later via the insert tool if needed.
- Frontend code changes — none expected; if `types.ts` regen surfaces a type error after the migration, fix at that point.

## Order of operations

1. Author the SQL (one file, ~700–900 lines).
2. Save it to `supabase/migrations/20260611000000_phynetix_complete_schema.sql`.
3. Submit identical SQL via the migration tool → user approves → runs.
4. Create storage buckets.
5. Smoke-test: open a batch page logged-in as a test student to confirm enrollment + tests are visible.
