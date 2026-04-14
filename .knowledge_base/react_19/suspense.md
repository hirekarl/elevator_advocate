# React 19 Suspense & Error Boundaries (Lead: Maya)

React 19 strengthens `Suspense` for handling loading states and `Error Boundaries` for graceful error recovery.

## Suspense Integration
Suspense is used to declaratively define the loading UI for components that are "suspending" while waiting for resources like the `use()` API.

### Usage Pattern
```tsx
import { Suspense } from 'react';

<Suspense fallback={<LoadingSpinner />}>
  <BuildingDetail buildingPromise={myPromise} />
</Suspense>
```

## Error Boundaries
Used to catch JavaScript errors anywhere in their child component tree and display a fallback UI instead of crashing the app.

### Benefits in the Advocacy Platform
- **Graceful Failure**: If a specific component (e.g., the map) fails, the rest of the building's detail remains accessible to the user (Martha).
- **Retry Logic**: Provides a mechanism for users to retry failed fetches without refreshing the entire page.

## Implementation Goal
Wrap high-impact UI areas (Map, Feed, Advocacy Tools) in `Suspense` and `ErrorBoundary` components to ensure a resilient, accessible experience even when NYC APIs are slow or failing.
