## 1. Fix auto-submit when time expires

**Client-side hardening** (`NormalTestInterface.tsx`):

- Store absolute `expiresAt = started_at + (duration + extra) * 60s` on mount.
- Replace the drifty `setInterval` decrement with a recompute against `Date.now()` every second.
- Add a `visibilitychange` listener that, on return to tab, recomputes `timeLeft`; if ≤ 0, immediately fire `handleSubmit(false, true)`.
- Add a `pagehide`/`beforeunload` listener that does **not** submit (per earlier decision) but stamps `last_seen_at` so the server cron can find truly-expired attempts.

**Server-side safety net (cron)**:

- Enable `pg_cron` + `pg_net`.
- Schedule `auto-submit-expired` edge function every 1 minute via `cron.schedule(...)` (run via `supabase--insert`, not migration, since it contains the project URL + anon key).
- The existing `auto-submit-expired` function already grades and finalizes — no edge-function code changes needed.
- Instead of running every minute try to submit test 3 hours(as per duration of test) after starting of test from server side + user side

## 2. "My Tests" sidebar dropdown (categorized across all batches)

New component `TestCategorySidebar.tsx` rendered on `MyAttempts.tsx` and `BatchDetailsPage.tsx`:

```text
All Tests                       [x]
─────────────────────────────────
QUIZRR MOCK TESTS
  Quizrr Part Test (QPT)     >
  Quizrr Full Test (QFT)     >
PYQS AS MOCK TESTS
  2026 PYQs                  >
  2024-25 PYQs               >
TOPIC & CHAPTER-WISE TESTS
  Physics                    >
  Chemistry                  >
  Mathematics                >
```

- Source of categories: aggregate `course_sections.name` across the user's active `batch_enrollments` (de-duplicated). Group headers come from a simple mapping of section name → group (`Part Test`/`Full Test` → "Quizrr Mock Tests"; names ending with `PYQ`/`PYQs` → "PYQs as Mock Tests"; subject names → "Topic & Chapter-wise Tests"; anything else → "Other").
- Selecting an item filters the right-side test list by `section_id`.
- A search-bar + status filter chips (`All / Not Attempted / Attempted / Upcoming / Resume`) sit above the cards, matching the screenshot.

## 3. New horizontal test-card layout

`TestListCard.tsx` (used in `MyAttempts` and `BatchDetailsPage`):

```text
┌────────────────────────────────────────────────────────────┐
│ Quizrr Part Test (QPT) - 1                                 │
│ Based on Reduced Syllabus (as per NTA)                     │
│ ┌──────────────────┐  ┌──────────────────────────────────┐ │
│ │  View Syllabus   │  │        Attempt Test              │ │
│ └──────────────────┘  └──────────────────────────────────┘ │
│ ⓘ 75 Qs   ⏱ 180 Min   A+ Total Marks: 300                 │
└────────────────────────────────────────────────────────────┘
```

- If `release_at > now()` → attempt test buttons disabled, add marks line  along with `Releasing: 14 Jun (Sun), 09:00 am`.
- `View Syllabus` opens a dialog rendering the test's `syllabus` rich text.
- `Attempt Test` → `/test/:id` (or `Resume` if an in-progress attempt exists).

## 4. Syllabus rich-text on Test (Advanced Settings)

- Migration: add `tests.syllabus text NULL` and `tests.syllabus_subtitle text NULL` ("Based on Reduced Syllabus (as per NTA)").
- `AdvancedTestSettingsPage.tsx`: add a "Syllabus" card with subtitle input + markdown textarea (reuse existing `Textarea`).
- `TestListCard` reads these; modal renders subtitle + markdown content via `react-markdown` (already in deps) or a simple `whitespace-pre-wrap` block if not.

## 5. Out of scope

- No new queue table — `auto-submit-expired` is already idempotent and finishes well within the edge-function time limit for the per-attempt workload, so a cron + the existing function is enough.
- No changes to the test-taking OMR/proctoring logic beyond the visibility-change recompute.

## Files to create / edit

**Create**

- `src/components/test/TestCategorySidebar.tsx`
- `src/components/test/TestListCard.tsx`
- `src/components/test/SyllabusDialog.tsx`

**Edit**

- `src/pages/NormalTestInterface.tsx` — visibility recompute + absolute expiry.
- `src/pages/MyAttempts.tsx` — adopt sidebar + new card.
- `src/pages/BatchDetailsPage.tsx` — adopt sidebar + new card.
- `src/components/admin/NormalTestEditor/AdvancedTestSettingsPage.tsx` — syllabus inputs.

**DB**

- Migration: `ALTER TABLE tests ADD syllabus text, ADD syllabus_subtitle text;`
- Insert (not migration): `cron.schedule('auto-submit-expired-every-min', '* * * * *', ...)`.