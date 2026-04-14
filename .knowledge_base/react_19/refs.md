# React 19 Ref API Changes (Lead: Maya)

React 19 simplifies how references (refs) are passed to components.

## Refs as Props
Components can now accept `ref` directly as a prop. The `forwardRef` API is no longer required for most use cases.

### Usage Pattern
```tsx
// React 19: ref is just another prop
function BuildingInput({ ref, ...props }) {
  return <input ref={ref} {...props} />;
}
```

## `useImperativeHandle`
Remains the standard for components that need to expose specific functions to their parent component (e.g., a modal with a `close()` method).

## Project Standard
Maya ensures that all new UI components (Inputs, Modals, Map instances) use the React 19 `ref` prop pattern for cleaner, more idiomatic code.
