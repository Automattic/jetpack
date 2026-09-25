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
- **No expand/collapse upstream.** Native level rendering is a static display — every row is always visible. The `collapsible` prop adds that locally; see [Collapsing branches](#collapsing-branches).
- **Cell content styling is the consumer's.** DataViews renders whatever the field's `render` returns, so per-row treatments like bolding parent rows are a plain field-render concern (see the story's `ReferrerField`) — no override of DataViews internals needed.
- **Flat search, filter, sort, and pagination.** DataViews' `filterSortAndPaginate` is hierarchy-blind: a matching child whose parent is filtered out renders indented but orphaned, a matching parent renders alone with the aggregate its (dropped) children explain, and sorting by any field re-orders the rows flat — visually breaking the grouping. This component re-runs that pipeline hierarchy-aware instead: it matches first, re-attaches each match's ancestors _and_ descendants (`withHierarchyContext`), sorts within levels, and paginates the hierarchy-ordered rows itself. Child rows still count as pagination items. Leave `sort` out of the initial view to preserve hierarchy order.

## Siblings

This is the third of three comparison implementations of the same drill-down surface:

- `DataViewsDrilldownTable` — controlled DataViews table with custom tree rows (expand/collapse chevrons, depth indentation, child-count badges).
- `DataViewsDrilldownComposable` — DataViews free composition with a custom grouped list layout.
- `DataViewsDrilldownNative` (this component) — base DataViews table view, native hierarchy plus the local collapse layer.

## Collapsing branches

`collapsible` puts a chevron after the title of every row that has children, and folds that row's whole subtree away when it is clicked. Folded rows leave the table entirely, so they stop counting towards pagination too.

```tsx
<DataViewsDrilldownNative
	// ...
	collapsible
	defaultExpanded="none"
/>
```

- **`defaultExpanded`** picks the opening state, `'all'` (the default, matching the static rendering) or `'none'`. What the component stores is which rows the reader toggled _away_ from that default, not the expanded ids — so rows that arrive later, from an async load or a filter change, follow the default instead of coming back folded.
- **Search and filter win over a fold.** A narrowed table still has to answer the search that narrowed it, so the matches' ancestors unfold for as long as the search or filter is on, and fold back when it clears. A row held open this way keeps its chevron — it is still a group — but the control goes `aria-disabled`, so the reader cannot write a fold that would only surface once the search clears. Each match's own children stay as the reader left them.
- **The chevron trails the title** rather than leading it, so a row that opens with a thumbnail (the Authors report's avatars) reads image, name, control. It also means rows with no children need no placeholder: their titles already start at the same indent as their siblings'.
- **A group row's title is clipped to the cell**, because a title wider than the column would otherwise carry the trailing chevron past the report card's hidden overflow, leaving the group unopenable by mouse. The clip yields an ellipsis only where the title cell's own content is inline. **A consumer whose `titleField` render returns a flex row — an avatar or favicon beside the label, as Authors and Referrers do — has to put the ellipsis on the label itself**, or the name is cut mid-character; scope that to the group branch, since leaf rows keep the unwrapped render the static table uses and are not clipped.

Everything the layer needs lives in `collapsible-rows.ts` and `drilldown-toggle.tsx`, plus the `collapsible` branches in the component. It is a workaround for what core defers: `hierarchyStyle: 'tree'` ([WordPress/gutenberg#74072](https://github.com/WordPress/gutenberg/issues/74072)) and the tree design discussion ([WordPress/gutenberg#80360](https://github.com/WordPress/gutenberg/issues/80360)). When one of those ships, delete those two files and the prop.
