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

<DrilldownList
	groups={ groups }
	labelHeader="Referrer"
	valueHeader="Views"
	searchLabel="Search referrers"
/>;
```
