# Sprint 12: Design System & Routing Overhaul

**Status:** ✅ COMPLETE
**Date:** 2026-04-13
**Lead:** Sol (Orchestrator)
**Team:** Maya (Frontend), Juno (UX/Accessibility), Blythe (Validation), Aris (Archivist)

---

## Objectives

1. Replace default Bootstrap aesthetics with a distinctive, accessible design system.
2. Fix broken routing that prevented logged-in users from reaching the landing page.
3. Introduce three distinct landing page states based on auth and primary-building status.
4. Surface live elevator status on the landing page home-building banner.

---

## What Shipped

### Design System — "Civic Operations"

- **Typography**: Syne 700–800 (headings, metrics, brand) + Mulish (body)
- **Palette**: Deep navy `#0d1b2a` · Warm ivory `#f4f1ea` · Amber `#e8920a` · Crisis red `#c8281c` · Forest green `#1a7a4a`
- **Navbar**: Navy background, amber `▲` brand mark, Syne wordmark
- **Hero**: Full-width dark-navy gradient with radial amber ambient glow; glassmorphism search form; amber CTA button
- **Emergency block**: Gradient red, large Syne 800 headline, `emergency-call-btn` / `emergency-sms-btn` custom classes
- **Status ribbon**: Semantic CSS classes (`ribbon-danger` / `ribbon-success` / `ribbon-warning`) replacing Bootstrap variant strings
- **Metric cards**: Colored 3px top-border indicator (`mc-good` / `mc-warn` / `mc-danger` / `mc-neutral`), Syne metric values
- **Section labels**: Unified `section-label` class throughout `BuildingDetail`
- **Script card**: Solid navy `backgroundColor` (gradient caused axe-core contrast computation failures)
- **`.btn-amber`**: Dedicated CSS class for amber CTAs; not susceptible to `.btn-primary !important` override
- Playwright reporter switched from `list` to `dot` for compact output

### Routing Fix

- Removed `navigate('/building/:bin')` from `fetchUser` — logged-in users can now freely visit `/` via brand link or back button
- `primaryBuildingBin` promoted to proper React state, initialized from localStorage, kept in sync through `fetchUser`, `handleAuthSuccess`, and `handleLogout`

### Three-State Landing Page

| State | Condition | UI |
|---|---|---|
| A — Public | Not logged in | Search form + map |
| B — No home building | Logged in, no primary building set | Info banner prompting address search |
| C — Home building set | Logged in + primary building set | Navy panel: username + live status badge + amber "Go to My Building →" CTA |

### Live Status Badge

- Lightweight fetch of `/api/buildings/${primaryBuildingBin}/` on landing page load
- Compact status pill: green `Working`, red `Not Working / Emergency / Unsafe`, amber `Slow / Unverified`
- Renders only after fetch resolves; no placeholder shown while in-flight
- Short-form i18n keys added in EN + ES (`status_short_*`)

### Accessibility & Test Hardening

- Fixed `heading-order` axe violation: `h6` → `h3` on advocacy script card headline
- Fixed `color-contrast` axe violation: `text-white-50` → `text-white` on `bg-primary` cards
- Playwright route mocks upgraded to function matching (`url.href.startsWith(...)`) — no longer bypassed by `?lang=en` query parameter
- All 3 Martha e2e scenarios pass clean throughout

---

## Success Criteria — All Met

1. Logged-in user can reach `/` via brand link or back button. ✅
2. Landing page shows the correct state for each auth/building combination. ✅
3. Live elevator status badge renders on State C banner. ✅
4. `npm run build` clean (TypeScript). ✅
5. `npx playwright test` — 3/3 passing, WCAG AA clean. ✅
