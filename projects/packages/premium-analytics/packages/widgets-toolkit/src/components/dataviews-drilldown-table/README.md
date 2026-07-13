# DataViewsDrilldownTable

`DataViewsDrilldownTable` renders flat parent/child records in a controlled DataViews table, matching the upstream DataViews tree hierarchy ([WordPress/gutenberg#77905](https://github.com/WordPress/gutenberg/pull/77905)): a leading chevron expands and collapses parent rows, child rows indent by depth, and parent rows show a direct-child-count badge. Nesting can be arbitrarily deep.

```tsx
import { DataViewsDrilldownTable } from '@jetpack-premium-analytics/widgets-toolkit';

const rows = [
	{ id: 'search', label: 'Search engines', views: 625 },
	{ id: 'google', parentId: 'search', label: 'Google', views: 485 },
];

<DataViewsDrilldownTable
	data={ rows }
	fields={ fields }
	getItemId={ item => item.id }
	getItemParentId={ item => item.parentId }
	initialView={ {
		sort: { field: 'views', direction: 'desc' },
		fields: [ 'label', 'views' ],
	} }
/>;
```

The first field in `view.fields` receives the tree affordances: an expand/collapse chevron before the field content on parent rows (an alignment placeholder on leaf rows), and an optional child-count badge after it (`showHierarchyBadge`, default true). Only the chevron toggles the drill-down — the field content itself stays whatever the consumer renders, links included. Pass `expandChildren` to start with every parent expanded; rows the user collapses manually stay collapsed.

Search, filters, sorting, and pagination keep DataViews' flat `filterSortAndPaginate` semantics, also matching upstream: child rows count as pagination items, and a search or filter match on a child whose parent is filtered out renders the child as a root row instead of force-expanding the parent.
