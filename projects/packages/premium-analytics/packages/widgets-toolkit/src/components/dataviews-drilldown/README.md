# DataViewsDrilldown

`DataViewsDrilldown` renders flat parent/child records in a controlled DataViews table. DataViews receives the already processed page slice, so parent rows can expand children while search, sorting, and pagination stay predictable.

```tsx
import { DataViewsDrilldown } from '@jetpack-premium-analytics/widgets-toolkit';

const rows = [
	{ id: 'search', label: 'Search engines', views: 625 },
	{ id: 'google', parentId: 'search', label: 'Google', views: 485 },
];

<DataViewsDrilldown
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

The first field in `view.fields` receives the tree affordances. Parent rows with children get an expand/collapse button after the field content, and child rows are indented.
