# Remediation Plan: Sprint 10 Build Failures

**Target:** Resolve 8 TypeScript errors in the frontend preventing build.

## 1. Diagnostics
- **Error Types:** `TS2448` (Block-scoped variable used before declaration) and `TS2454` (Variable used before assignment).
- **Cause:** `useEffect` hooks in `App.tsx` and `BuildingDetail.tsx` reference `useCallback` functions (like `handleLogout` and `fetchBuilding`) that are declared lower in the file.
- **Files Affected:**
  - `frontend/src/App.tsx`
  - `frontend/src/components/BuildingDetail.tsx`

## 2. Action Steps
- [x] **Phase 1: App.tsx Fix**
  - Move `handleLogout` and `fetchBuilding` declarations above the `useEffect` blocks that call them.
- [x] **Phase 2: BuildingDetail.tsx Fix**
  - Move `fetchAdvocacyScript` and `fetchExecutiveSummary` declarations above the `useEffect` block that calls them.
- [ ] **Phase 3: Validation**
  - Run `cd frontend && npm run build` to verify TSC passes.
  - Run `./backend/scripts/pre_flight.sh` to ensure overall project health.

## 3. Post-Mortem Prevention
- Blythe must enforce a "Build-Before-Commit" policy.
- Update `pre_flight.sh` to include a frontend build check if environment allows.
