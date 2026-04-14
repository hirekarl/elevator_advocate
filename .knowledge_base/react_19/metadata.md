# React 19 Document Metadata Handling (Lead: Maya)

React 19 provides native support for managing document metadata (e.g., `<title>`, `<meta>`) within components.

## Native Metadata Support
Metadata tags can be placed inside any component, and React will automatically hoist them to the document `<head>`.

### Usage Pattern
```tsx
function BuildingPage({ building }) {
  return (
    <>
      <title>{building.address} - Elevator Status</title>
      <meta name="description" content={`Verified elevator status for ${building.address}`} />
      {/* Component content here... */}
    </>
  );
}
```

## Benefits in this Project
- **Dynamic SEO**: Automatically update the page title to match the currently viewed building.
- **Improved Accessibility**: Assistive technologies (e.g., screen readers) are immediately aware of title changes when navigating between buildings.

## Implementation Standard
All top-level "view" components (MainDashboard, BuildingDetail) must include relevant metadata to ensure a clear, accessible document structure.
