# React 19: `useOptimistic` (Leaf)

## Implementation Pattern
Handles the "Syncing..." and pulse amber states for elevator reports.

### Code Pattern
```tsx
import { useOptimistic } from 'react';

function ElevatorStatus({ initialStatus }) {
  const [optimisticStatus, addOptimisticStatus] = useOptimistic(
    initialStatus,
    (current, next) => ({ ...current, ...next, pending: true })
  );

  async function updateStatus(newStatus) {
    addOptimisticStatus(newStatus);
    await serverAction(newStatus); // Resolved by server
  }

  return (
    <div className={optimisticStatus.pending ? 'animate-pulse text-amber-500' : ''}>
      Status: {optimisticStatus.value}
    </div>
  );
}
```

## Constraints
- **Scope:** Must be called within a `startTransition` or an async Server Action.
- **Reversion:** Automatically reverts on rejection or completion.
