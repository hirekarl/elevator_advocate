# Sprint 7: Accessibility & UX Pass 2 — Vulnerable User Hardening

**Date:** 2026-04-12
**Lead:** Sol (Orchestrator)
**Team:** Juno (audit), Maya (implementation), Blythe (validation)
**Status:** IN PROGRESS — Juno audit complete, Maya implementation not yet started

---

## Objective

A second accessibility pass focused specifically on the most vulnerable users of the app:
senior tenants with limited tech literacy, Spanish-speaking residents in crisis, and blind users
with screen readers. The question driving this sprint: do users have the tools they need to
advocate for themselves, and can they ask for help from community members or other advocates?

---

## Juno's Audit Findings (Complete)

### Critical gaps — real-emergency failures

| # | Issue | File | Details |
|---|---|---|---|
| P0 | TRAPPED and UNSAFE statuses missing from UI | `BuildingDetail.tsx` | Both exist in `ElevatorReport.STATUS_CHOICES` (backend model + migrations confirmed) but no buttons exist in the quick-report section. If someone needs to flag people trapped inside an elevator, they cannot. |
| P0 | 311 phone number never shown | `BuildingDetail.tsx` | The advocacy script is AI-generated text buried in a card. The number (NYC 311 = `212-639-9675`, or just dial `311`) is not displayed as a tappable `tel:` link anywhere. |
| P1 | Logged-out users hit a dead end | `BuildingDetail.tsx` | Tapping a report button fires a toast ("please sign in") but provides no inline path to login. On mobile the auth form is completely hidden. |

### Remaining WCAG violations

| # | Issue | File | Details |
|---|---|---|---|
| P1 | Status banner emojis not `aria-hidden` | `BuildingDetail.tsx` | `⚠️` and `✅` in the colored status bar are read aloud by screen readers before the status text |
| P1 | Advocacy script in `<pre>` element | `BuildingDetail.tsx` | Screen readers announce it as a code block. Should be a `<div style={{ whiteSpace: 'pre-wrap' }}>` |

### UX friction

| # | Issue | Details |
|---|---|---|
| P2 | Language toggle not discoverable | Small icon in top-right navbar — not visible to someone who can't read English well enough to find it |
| P2 | Share actions below the fold | "Share via WhatsApp" and "Email Representative" are at the bottom of the advocacy card, after all data. A neighbor wanting to help needs those up front. |
| P2 | No explanation of 2-person verification | Users who report DOWN and see "Verification Pending" with no explanation may think the app is broken |

---

## Maya's Implementation Plan (Not Yet Started)

### Task 1 — Emergency reporting buttons
Add a visually distinct "Emergency Reports" subsection below the main UP/DOWN/SLOW buttons.
- TRAPPED button: red, full-width, prominent. Label: "People Trapped Inside"
- UNSAFE button: orange. Label: "Unsafe Conditions"
- Both call existing `handleReport()` with their respective status strings
- Add a note: "These reports are treated as urgent by our system"

### Task 2 — Call 311 Now button
At the top of the Advocacy Center section (above the AI script card), add:
- A large `<a href="tel:311">` button (Bootstrap `btn-danger` or `btn-warning`)
- Text: "Call 311 Now" with sub-label "NYC's free helpline — available 24/7"
- Second line: the number spelled out ("212-639-9675") for users who can't tap-to-call

### Task 3 — Logged-out inline CTA
When `isLoggedIn` is false, render an inline prompt *inside* the quick report card
(below the buttons) instead of relying solely on the toast:
- Small Alert or callout: "Sign in to submit a report and help your neighbors."
- A "Sign In" button that triggers the auth modal (needs a callback prop or global state)

### Task 4 — Fix aria-hidden and pre element
- Wrap emojis in status banner with `<span aria-hidden="true">`
- Replace `<pre className="mb-0 text-wrap font-monospace small" style={{ whiteSpace: 'pre-wrap' }}>` with `<div className="mb-0 small" style={{ whiteSpace: 'pre-wrap' }}>`

### Task 5 — Share actions and verification explanation
- Move the "Share via WhatsApp" / "Email Representative" links to just below the Copy Summary button (currently they're in a separate div below an `<hr>`)
- Add one sentence to the quick report help text explaining the 2-person rule:
  "Two neighbors confirming the same status within 2 hours marks it as Verified."

### i18n strings needed (add to both EN and ES)
```
emergency_reports: "Emergency Reports"
status_trapped_label: "People Trapped Inside"
status_unsafe_label: "Unsafe Conditions"
emergency_reports_note: "These reports are flagged as urgent."
call_311_now: "Call 311 Now"
call_311_desc: "NYC's free helpline — available 24/7"
call_311_number: "212-639-9675"
report_login_cta: "Sign in to submit a report and help your neighbors."
verification_explainer: "Two neighbors confirming the same status within 2 hours marks it Verified."
```

---

## Blythe's Checklist (Pending)

- [ ] `ruff format` + `ruff check`
- [ ] `mypy --ignore-missing-imports`
- [ ] `manage.py check`
- [ ] `pytest` (11 tests must pass)

---

## Notes for Next Agent

- All backend work is already done — `TRAPPED` and `UNSAFE` are valid values in `ElevatorReport.STATUS_CHOICES`. No migrations needed.
- The `handleReport(status: string)` function in `BuildingDetail.tsx` already handles arbitrary status strings — just pass `'TRAPPED'` or `'UNSAFE'`.
- `isLoggedIn` is now a prop on `BuildingDetail` (added in Sprint 6) — use it for the logged-out CTA.
- The auth modal is controlled by `showAuthModal` state in `App.tsx` (parent). To trigger it from `BuildingDetail`, either lift a callback prop or use a global event. Simplest approach: add an `onShowAuth?: () => void` prop to `BuildingDetail` and pass `() => setShowAuthModal(true)` from `App.tsx`.
- Do NOT add `Co-Authored-By: Claude` to commits in this repo.
- Run `./backend/scripts/pre_flight.sh` before committing. All 4 checks must pass.
- Commit only the files changed in this sprint (don't drag in the pre-existing unstaged backend changes).
