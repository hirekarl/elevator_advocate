# Sprint 6: Accessibility & UX Hardening

**Date:** 2026-04-12
**Lead:** Sol (Orchestrator)
**Team:** Juno (audit), Maya (implementation), Blythe (validation)
**Status:** Completed ✅

---

## Objective

Address WCAG 2.2 Level AA violations and UX friction points in the Resident Action Center (`BuildingDetail`, `HeroSearch`, `App`). This sprint continued work Juno had begun in the prior session.

---

## Juno's Audit Findings

| Severity | Issue |
|---|---|
| Bug | `autofide` typo on Toast — auto-dismiss was broken |
| Bug | `btn-xs` is not a Bootstrap 5 class — news refresh button unstyled |
| WCAG | Report buttons (UP/DOWN/SLOW) had no `aria-label`; screen readers announced emoji only |
| WCAG | Progress bars had no `aria-label`; percentage values were context-free |
| WCAG | "Share via WhatsApp" and "Email Representative" were non-interactive `<Badge>` elements |
| WCAG | News "Read Full Story →" links were indistinguishable from each other by screen readers |
| WCAG | Address fields in `HeroSearch` lacked `<fieldset>`/`<legend>` grouping |
| UX | Quick report button grid: UP was `xs={12}`, DOWN/SLOW were `xs={6}` — lopsided on mobile |
| UX | `alert()` for building-not-found: native dialog, not i18n-aware, unstyled |
| UX | "Set as Home" button driven by raw `localStorage.getItem()` in JSX — not reactive to login state |

---

## Maya's Implementation

### `BuildingDetail.tsx`
- Fixed `autofide` → `autohide` on Toast
- Fixed `btn-xs` → `btn-sm` on news refresh button; added `aria-label`
- Balanced quick report grid to `xs={4}` for all three buttons
- Added `aria-label` + `aria-hidden="true"` on icons for UP/DOWN/SLOW buttons
- Added descriptive `aria-label` on both ProgressBar components
- Converted "Share via WhatsApp" and "Email Representative" `<Badge>` elements to real `<a>` tags with pre-filled `wa.me` and `mailto:` hrefs
- Added per-article `aria-label` on "Read Full Story" links
- Accepted `isLoggedIn` prop; replaced `localStorage.getItem('token')` JSX check with prop

### `HeroSearch.tsx`
- Wrapped address fields in `<fieldset>` with visually-hidden `<legend>`

### `App.tsx`
- Added `searchError` state; replaced `alert()` with inline Bootstrap `<Alert>`
- Passed `isLoggedIn` prop to `BuildingDetail`

### `i18n.ts`
- Added `building_not_found` key in EN and ES

---

## Blythe's Validation

- `ruff format` + `ruff check`: ✅ All checks passed
- `mypy`: ✅ No issues (38 source files)
- `manage.py check`: ✅ No issues
- `pytest`: ✅ 11/11 passed
