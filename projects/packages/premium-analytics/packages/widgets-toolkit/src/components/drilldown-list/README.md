# DrilldownList

`DrilldownList` renders expandable grouped records using DataViews free composition. DataViews supplies the search field, view state, and pagination; the component renders a custom grouped list layout.

```tsx
import { DrilldownList } from '@jetpack-premium-analytics/widgets-toolkit';

const groups = [
	{
		id: 'search',
		label: 'Search Engines',
		value: 625,
		children: [
			{
				id: 'google',
				label: 'Google',
				value: 485,
				href: 'https://www.google.com/',
			},
		],
	},
];

function getGroupFilterValue( group ) {
	return group.id === 'search' ? 'organic' : 'direct';
}

<DrilldownList
	groups={ groups }
	labelHeader="Referrer"
	valueHeader="Views"
	searchLabel="Search referrers"
	filterElements={ [
		{ value: 'organic', label: 'Organic' },
		{ value: 'direct', label: 'Direct' },
	] }
	getGroupFilterValue={ getGroupFilterValue }
/>;
```

`filterElements` and `getGroupFilterValue` are optional and should be passed together when the list needs a DataViews filter. `filterElements` defines the selectable filter values, and `getGroupFilterValue` maps each group to one of those values. When either prop is omitted, the list has no filterable field and DataViews hides the filter toggle automatically.

Pass `columns` to render more than one value column after the label column. When `columns` is omitted, `DrilldownList` renders the default single value column using `valueHeader` and `formatValue`.

```tsx
<DrilldownList
	groups={ groups }
	labelHeader="Referrer"
	valueHeader="Views"
	columns={ [
		{
			id: 'date',
			header: 'Date',
			getValue: row => ( 'date' in row ? row.date : '' ),
		},
		{
			id: 'views',
			header: 'Views',
			getValue: row => row.value.toLocaleString(),
		},
	] }
/>;
```
