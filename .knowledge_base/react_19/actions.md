# React 19 Actions & Transitions (Lead: Maya)

React 19 introduces Actions and `useTransition` for managing asynchronous UI transitions with better loading state handling.

## Transitions
`useTransition` allows you to mark a state update as a non-urgent transition, letting React prioritize more urgent tasks while providing an `isPending` state for the UI.

### Usage in this Project
In `App.tsx`, `useTransition` is used for `fetchBuilding` and `handleSearch` to keep the UI responsive while fetching building data:

```tsx
const [isPending, startTransition] = useTransition();

const handleSearch = async (e?: React.FormEvent) => {
  startTransition(async () => {
    // Async fetching logic here...
    // The UI can show a "Searching..." indicator via 'isPending'
  });
};
```

## Actions
Actions simplify the management of form submissions and asynchronous operations by bundling them into a single concept that automatically handles pending and error states.

### Benefits
- **No manual loading flags**: `isPending` state is automatically managed.
- **Optimistic UI Support**: Pairs perfectly with `useOptimistic`.

## Implementation Priority
The `handleReport` and `handleLogAdvocacy` functions in `BuildingDetail.tsx` are primary candidates for refactoring into React 19 Actions.
