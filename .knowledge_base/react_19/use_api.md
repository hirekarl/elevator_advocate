# React 19 `use` API (Lead: Maya)

The `use` API is a new React primitive for reading the value of a resource like a Promise or Context.

## Data Fetching
In the Elevator Advocacy Platform, `use` is prioritized for fetching building data and advocacy summaries, replacing the traditional `useEffect` + `fetch` pattern.

### Usage Pattern
```tsx
import { use } from 'react';

function BuildingProfile({ buildingPromise }) {
  // use() will suspend the component until the promise resolves
  const building = use(buildingPromise);
  
  return <div>{building.address}</div>;
}
```

## Benefits
- **Suspense Integration**: Works natively with `<Suspense>` for elegant loading states.
- **Reduced Boilerplate**: Eliminates the need for manual `isLoading` and `error` state management in many cases.
- **Conditional Calling**: Unlike hooks, `use` can be called within loops and conditional statements.

## Implementation Goal
Refactor existing `fetchBuilding` and `fetchAdvocacyScript` logic in `App.tsx` and `BuildingDetail.tsx` to utilize the `use` API combined with Suspense boundaries.
