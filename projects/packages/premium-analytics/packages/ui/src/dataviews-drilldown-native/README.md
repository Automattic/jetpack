# DataViewsDrilldownNative

`DataViewsDrilldownNative` renders flat parent/child records through DataViews' own hierarchy support and nothing else: `view.showLevels` plus the `getItemLevel` prop, exactly as the Gutenberg Pages screen consumes them. The component's only preprocessing is what that native API leaves to the consumer — re-emitting the rows in depth-first hierarchy order and resolving each row's depth from parent ids.

```tsx
import { DataViewsDrilldownNative } from '@jetpack-premium-analytics/ui';

const rows = [
	{ id: 'search', label: 'Search engines', views: 625 },
	{ id: 'google', parentId: 'search', label: 'Google', views: 485 },
];

<DataViewsDrilldownNative
	data={ rows }
	fields={ fields }
	getItemId={ item => item.id }
	getItemParentId={ item => item.parentId }
	initialView={ {
		fields: [ 'label', 'views' ],
	} }
/>;
```

The first field in the view's field list becomes the view's `titleField` — the only column DataViews renders native hierarchy levels on. The remaining fields render as regular columns.

## What the native rendering gives you (and what it doesn't)

- **Level markers, not indentation.** DataViews renders each row's level as a literal em-dash prefix (`— — google.com`) in an unstyled `dataviews-view-table__level` span. There is no upstream styling hook beyond that class; the `hideLevelMarkers` prop applies the one-line override (`visibility: hidden`) that turns the markers into plain whitespace indentation.
- **No expand/collapse.** Native level rendering is a static display — every row is always visible. Drill-down interaction requires one of the custom sibling implementations.
- **Cell content styling is the consumer's.** DataViews renders whatever the field's `render` returns, so per-row treatments like bolding parent rows are a plain field-render concern (see the story's `ReferrerField`) — no override of DataViews internals needed.
- **Flat search, filter, sort, and pagination.** DataViews' `filterSortAndPaginate` is hierarchy-blind: a matching child whose parent is filtered out renders indented but orphaned, a matching parent renders alone with the aggregate its (dropped) children explain, and sorting by any field re-orders the rows flat — visually breaking the grouping. This component re-runs that pipeline hierarchy-aware instead: it matches first, re-attaches each match's ancestors _and_ descendants (`withHierarchyContext`), sorts within levels, and paginates the hierarchy-ordered rows itself. Child rows still count as pagination items. Leave `sort` out of the initial view to preserve hierarchy order.

## Siblings

This is the third of three comparison implementations of the same drill-down surface:

- `DataViewsDrilldownTable` — controlled DataViews table with custom tree rows (expand/collapse chevrons, depth indentation, child-count badges).
- `DataViewsDrilldownComposable` — DataViews free composition with a custom grouped list layout.
- `DataViewsDrilldownNative` (this component) — base DataViews table view, native hierarchy only.
