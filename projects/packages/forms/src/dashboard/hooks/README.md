# Custom Routing Hooks

This directory contains custom routing hooks that replace `react-router` functionality in the Forms dashboard. These hooks provide hash-based routing and URL parameter management using native browser APIs.

## Overview

The custom routing implementation provides the same API as React Router but without the external dependency. This reduces bundle size and gives us full control over routing behavior while maintaining a simple, hash-based routing system suitable for WordPress admin pages.

## Hooks

### `useLocation()`

Returns the current pathname from the hash portion of the URL.

**Returns:**
```typescript
{
  pathname: string // Current path from hash (e.g., "/responses" from "#/responses?status=inbox")
}
```

**Example:**
```javascript
import { useLocation } from './hooks/use-routing';

function MyComponent() {
  const { pathname } = useLocation();

  // URL: #/integrations?status=spam
  console.log(pathname); // "/integrations"

  const isIntegrationsPage = pathname === '/integrations';

  return <div>Current page: {pathname}</div>;
}
```

**Notes:**
- Returns `/` when hash is empty or not set
- Automatically strips search parameters from pathname
- Updates when hash changes (e.g., browser back/forward navigation)

---

### `useNavigate()`

Returns a function for programmatic navigation by updating the URL hash.

**Returns:**
```typescript
(to: string) => void // Navigate function
```

**Parameters:**
- `to` (string): The path to navigate to, optionally with search parameters

**Example:**
```javascript
import { useNavigate } from './hooks/use-routing';

function IntegrationsButton() {
  const navigate = useNavigate();

  const handleClick = () => {
    // Navigate to integrations page
    navigate('/integrations');

    // Or navigate with search params
    navigate('/responses?status=spam');
  };

  return <button onClick={handleClick}>Open Integrations</button>;
}
```

**Notes:**
- The navigate function is stable (won't change between renders)
- Updates `window.location.hash` which triggers hashchange events
- Can include search parameters in the path string

---

### `useSearchParams()`

Manages URL search parameters within the hash. Returns a tuple similar to React Router's `useSearchParams`.

**Returns:**
```typescript
[
  URLSearchParams,                           // Current search parameters
  (params: ParamsInput) => void              // Function to update parameters
]
```

**ParamsInput** can be:
- `URLSearchParams` object
- Plain object with string values (`{ key: value }`)
- Function that receives current params and returns new params (`(prev) => URLSearchParams`)

**Reading Parameters:**
```javascript
import { useSearchParams } from './hooks/use-routing';

function StatusFilter() {
  const [searchParams] = useSearchParams();

  // URL: #/responses?status=spam&search=test
  const status = searchParams.get('status');     // "spam"
  const search = searchParams.get('search');     // "test"
  const missing = searchParams.get('missing');   // null

  return <div>Status: {status}</div>;
}
```

**Setting Parameters - Object Form:**
```javascript
const [searchParams, setSearchParams] = useSearchParams();

// Set a parameter
setSearchParams({ status: 'spam' });
// URL becomes: #/responses?status=spam

// Set multiple parameters
setSearchParams({ status: 'inbox', r: '123' });
// URL becomes: #/responses?status=inbox&r=123

// Delete a parameter (set to null or undefined)
setSearchParams({ r: null });
// URL becomes: #/responses?status=inbox
```

**Setting Parameters - Function Form:**
```javascript
const [searchParams, setSearchParams] = useSearchParams();

// Update based on previous value (like setState)
setSearchParams(prev => {
  const params = new URLSearchParams(prev);
  params.set('status', 'spam');
  params.delete('r');
  return params;
});
```

**Setting Parameters - URLSearchParams Form:**
```javascript
const [searchParams, setSearchParams] = useSearchParams();

const newParams = new URLSearchParams();
newParams.set('status', 'trash');
newParams.set('search', 'hello world');
setSearchParams(newParams);
```

**Common Patterns:**

1. **Tab/Status Switching:**
```javascript
const handleTabChange = (newStatus) => {
  setSearchParams(prev => {
    const params = new URLSearchParams(prev);
    params.set('status', newStatus);
    params.delete('r'); // Clear selection when changing tabs
    return params;
  });
};
```

2. **Search Functionality:**
```javascript
const handleSearch = (searchTerm) => {
  setSearchParams(prev => {
    const params = new URLSearchParams(prev);
    if (searchTerm) {
      params.set('search', searchTerm);
    } else {
      params.delete('search');
    }
    return params;
  });
};
```

3. **Selected Items:**
```javascript
const handleSelectionChange = (selectedIds) => {
  setSearchParams(prev => {
    const params = new URLSearchParams(prev);
    if (selectedIds.length > 0) {
      params.set('r', selectedIds.join(','));
    } else {
      params.delete('r');
    }
    return params;
  });
};
```

**Notes:**
- Preserves the current pathname when updating parameters
- Updates trigger re-renders in all components using the hook
- Parameters are automatically URL-encoded/decoded
- Setting a parameter to `null` or `undefined` removes it
- Works with browser back/forward navigation

---

## Architecture

### Hash-Based Routing

The implementation uses hash-based routing (`#/path?params`), which is ideal for WordPress admin pages where:
- The actual URL path is controlled by WordPress
- Client-side routing needs to work without server configuration
- URLs should be shareable and bookmarkable

**URL Structure:**
```
https://example.com/wp-admin/admin.php?page=jetpack-forms#/responses?status=spam&r=123

                                                      │         │                    │
                                                      │         │                    └─ Search params
                                                      │         └──────────────────────── Pathname
                                                      └────────────────────────────────── Hash marker
```

### Event Handling

The hooks listen to browser events to stay synchronized:
- `hashchange`: Triggered when the hash portion of the URL changes
- `popstate`: Triggered on browser back/forward navigation

All hooks properly clean up event listeners when components unmount.

### State Management

Each hook maintains its own local state and updates when the URL changes. This ensures:
- Multiple components can use the same hook independently
- All instances stay synchronized via hash events
- No centralized state management required

## Migration from React Router

These hooks provide a compatible API for common React Router patterns:

| React Router | Custom Implementation |
|--------------|----------------------|
| `useLocation()` | `useLocation()` |
| `useNavigate()` | `useNavigate()` |
| `useSearchParams()` | `useSearchParams()` |
| `<Outlet />` | Direct component rendering |
| `<RouterProvider>` | Not needed |
| `createHashRouter()` | Not needed |

### Breaking Changes

The only significant difference is that `setSearchParams` supports an additional object form for convenience:

```javascript
// React Router requires URLSearchParams
setSearchParams(new URLSearchParams({ status: 'spam' }));

// Our implementation also supports plain objects
setSearchParams({ status: 'spam' });
```

## Testing

Tests are located in `tests/js/dashboard/hooks/use-routing.test.jsx` and cover:

- ✅ Reading and updating location pathname
- ✅ Programmatic navigation
- ✅ Reading search parameters from hash
- ✅ Setting parameters via object, function, and URLSearchParams
- ✅ Parameter encoding/decoding
- ✅ Pathname preservation when updating parameters
- ✅ Browser back/forward compatibility
- ✅ Multiple concurrent hook instances
- ✅ Edge cases and error conditions

Run tests with:
```bash
pnpm test use-routing
```

## Performance

Benefits over React Router:

- **Smaller bundle size**: ~32KB gzipped eliminated
- **Simpler implementation**: No router context overhead
- **Direct DOM access**: Minimal abstraction for simple use case
- **Stable function references**: Hook returns are memoized with `useCallback`

## Browser Support

Works in all modern browsers that support:
- `window.location.hash`
- `URLSearchParams` API
- Hash change events

This includes all browsers supported by WordPress and React.

## Related Files

- **Implementation**: `src/dashboard/hooks/use-routing.ts`
- **Tests**: `tests/js/dashboard/hooks/use-routing.test.jsx`
- **Usage examples**:
  - `src/dashboard/components/inbox-status-toggle/index.tsx` - Tab switching
  - `src/dashboard/integrations/index.tsx` - Navigation
  - `src/dashboard/inbox/dataviews/index.js` - Selection management
  - `src/dashboard/inbox/dataviews/views.js` - Search functionality
