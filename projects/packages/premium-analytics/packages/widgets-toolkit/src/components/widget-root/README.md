# WidgetRoot

A wrapper component that encapsulates all infrastructure a lazy-loaded dashboard widget needs.

## Problem

Dashboard widgets are ES Modules loaded asynchronously via lazy-load. This means they don't share context with other widgets—providers **must** be instantiated per widget.

`WidgetRoot` centralizes this "bootstrap" logic instead of scattering it across multiple widget files.

## What WidgetRoot Provides

- **AnalyticsQueryClientProvider** - React Query client for data fetching
- **GlobalChartsProvider** - Chart theming via `useChartTheme()`
- **Report params resolution** - From widget attributes or URL fallback
- **Context provider** - Child widgets access resolved params via `useWidgetRootContext()`

## Usage

### In dashboard-widgets (consumer)

```tsx
// dashboard-widgets/my-widget/render.tsx
import { WidgetRoot, MyWidget } from '@jetpack-premium-analytics/widgets-toolkit';

export default function MyWidgetRender( { attributes } ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<MyWidget />
		</WidgetRoot>
	);
}
```

### In widgets-toolkit (internal widget)

```tsx
// widgets-toolkit/widgets/my-widget/widget-my-widget.tsx
import { useWidgetRootContext } from '../../components/widget-root';

export function MyWidget() {
	const { reportParams } = useWidgetRootContext();

	// Use reportParams for data fetching
	const { data } = useReportOrders( reportParams );

	return <div>{ /* render widget */ }</div>;
}
```

## API

### WidgetRoot Props

| Prop           | Type                                   | Description                                                     |
| -------------- | -------------------------------------- | --------------------------------------------------------------- |
| `attributes`   | `Partial<ReportParamsFieldAttributes>` | Widget attributes, may include `reportParams`                   |
| `children`     | `ReactNode`                            | Child components (widgets)                                      |
| `options.from` | `string`                               | Deprecated/ignored — params are always read from the current matched route |

### useWidgetRootContext

Returns the resolved context value:

```typescript
type WidgetRootContextValue = {
	reportParams: ReportParams;
};
```

**Important**: Must be called within a `WidgetRoot` component. Throws an error otherwise.

## Report Params Resolution

`WidgetRoot` resolves `reportParams` with the following priority:

1. **From attributes** - If `attributes.reportParams` is provided and non-empty
2. **From URL** - Falls back to URL search params via `@wordpress/route`

This allows widgets to work both:

- In the Analytics dashboard (params from URL)
- Other contexts (params from attributes)

## Architecture

```
WidgetRoot
├── AnalyticsQueryClientProvider (shared React Query client)
│   └── GlobalChartsProvider (chart theme)
│       └── WidgetRootContext.Provider (reportParams)
│           └── children (widget components)
```

## Responsive Widgets with Container Queries

`WidgetRoot` wraps children in a container query context, enabling widgets to adapt their layout based on their own size (not viewport).

### Why Container Queries?

Dashboard widgets live in a resizable grid. Users can change tile sizes, so widgets must adapt to their container—not the viewport. CSS Container Queries solve this.

### Available Breakpoints

Aligned with [Tailwind container query defaults](https://tailwindcss.com/docs/responsive-design#container-size-reference) and [ARC-464](https://linear.app/a8c/issue/ARC-464).

| Token | Size          | Use Case                |
| ----- | ------------- | ----------------------- |
| `xxs` | 256px (16rem) | Extra extra small tiles |
| `xs`  | 320px (20rem) | Extra small tiles       |
| `sm`  | 384px (24rem) | Small tiles             |
| `md`  | 448px (28rem) | Standard tile size      |
| `lg`  | 512px (32rem) | Large tiles             |
| `xl`  | 576px (36rem) | Extra large tiles       |
| `2xl` | 672px (42rem) | Full-width widgets      |

### Usage in Widget SCSS

```scss
@use '../../styles/widget-container' as *;

.myWidget {
	// Mobile-first: vertical layout for small containers
	flex-direction: column;

	// >= 448px: switch to horizontal layout
	@include widget-query( md ) {
		flex-direction: row;
	}

	// >= 576px: add more spacing
	@include widget-query( xl ) {
		gap: var( --wpds-dimension-size-5xs );
	}
}
```

### How It Works

1. `WidgetRoot` wraps children in a div with `container-type: inline-size`
2. Child widgets use `@container` queries via the `widget-query()` mixin
3. Styles apply based on the widget's actual width, not the viewport

### Files

- `../../styles/_widget-container.scss` - Breakpoints and mixin definitions

## Files

- `widget-root.tsx` - Main component
- `widget-root.module.scss` - Container query setup
- `context.tsx` - React context and `useWidgetRootContext` hook
- `index.ts` - Public exports
