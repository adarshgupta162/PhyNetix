## Scope

Eight changes across backend (schema + edge functions) and frontend (test interface, admin, my-tests, checkout).

---

## 1. Auto-submit cleanup

- Remove the `pagehide` / `beforeunload` keepalive `fetch` to `submit-test` in `src/pages/NormalTestInterface.tsx`.
- Keep the existing time-up timer-based auto-submit and the 7-fullscreen-exit force-submit.
- Keep `auto-submit-expired` edge function (it's the server-side safety net that submits when `started_at + duration` has passed — that's exactly the "time keeps running in background" behavior).
- Result: closing tab / leaving page does NOT submit; only timer expiry or 7th fullscreen exit does.

## 2. Question palette color rules (NormalTestInterface)

In the OMR / QuestionPalette component, change the per-question box color logic:

- Answered + saved → **green**, even when currently viewing.
- Marked for review (regardless of answer) → **purple**, even when currently viewing.
- Currently viewing (and neither answered nor marked) → faded/dimmed style instead of solid highlight.
- Not viewed  → existing neutral.
-  not attempted → red

Edit: `src/components/test/OMRPanel.tsx` (and/or `EnhancedOMRPanel.tsx` whichever is wired in).

## 3. Course sections (admin + student)

### Schema (one migration)

- New table `course_sections`:
  - `id`, `batch_id` (FK batches), `name` (text, free-form), `display_order` (int), timestamps.
  - GRANTs + RLS: staff manage; enrolled students read.
- Add `section_id uuid NULL REFERENCES course_sections(id)` and `display_order int DEFAULT 0` to `batch_tests`.

### Admin UI

- `src/components/admin/BatchTestsManager.tsx`: add "Sections" panel — create / rename / delete / reorder sections; assign each test to a section; drag-to-reorder tests within a section (use simple up/down buttons to keep scope tight).

### Student UI

- `src/pages/MyBatchesPage.tsx` / batch details: dropdown to filter by section; default "set by admin".

## 4. My Tests card layout

- `src/pages/MyAttempts.tsx`: convert vertical card grid to horizontal row layout (thumbnail left, title/meta middle, actions right). One card per row, responsive (stacks on mobile).
- Remove the "No. of attempts" field from the card.

## 5. Student rating system

### Schema (same migration as #3)

- New table `test_reviews`: `id`, `user_id`, `test_id`, `batch_id`, `rating int 1-5`, `review text`, unique (user_id, test_id), timestamps.
- RLS: user can insert/update their own; everyone authenticated can read aggregate.

### Submit-test flow

- After successful submission in `NormalTestInterface.tsx`, show a rating dialog (1-5 stars + optional text) before redirecting to analysis. Skippable.

### Display

- Test card in My Tests: average rating + count.
- Course/batch card (`BatchCard.tsx`): average rating across all tests in batch + count.

## 6. Coupon: only allow checkout if final = ₹0

- `src/pages/CheckoutPage.tsx`:
  - Require a valid coupon application.
  - "Pay" button disabled unless `final_amount === 0`.
  - On submit with `final_amount === 0`: skip payment gateway, directly insert `payments` row with `status='completed'`, `amount=0`, coupon_id set → existing `auto_enroll_on_payment` trigger creates the enrollment.
- Make sure coupon validation logic actually computes discount correctly (percent vs flat, max discount cap, expiry, usage limits). Fix any bugs found in `CouponManager` / checkout coupon application.

## 7. Cleanup

- Remove all UI references to "attempts count" on student-facing test cards (admin views unchanged).

---

## Technical notes

- Migration order: 1 file with `course_sections`, `batch_tests.section_id`, `batch_tests.display_order`, `test_reviews`, plus all GRANTs/RLS.
- Reuse existing `auto_enroll_on_payment` trigger for ₹0 coupon flow — no new server logic needed for free enrollment.
- No edge function changes required beyond removing the client-side keepalive call.
- Rating dialog: new component `src/components/test/RatingDialog.tsx`.

## Out of scope

- Drag-and-drop reordering library +using up/down arrow buttons .
- Migrating historical attempts to compute "first rating prompt".