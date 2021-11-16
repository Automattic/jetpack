Query Modules
===========

Query Modules is a React component used in managing the fetching of module queries.

## Usage

It does not accept any prop, nor does it render any elements to the page. You can use it adjacent to other sibling components which make use of the fetched data made available through the global application state.

```jsx
import React from 'react';
import QueryModules from 'components/data/query-modules';
import Card from 'components/Card';

export default function MyModulesList( { modules } ) {
	return (
		<div>
			<QueryModules />
			{ modules.map( ( module ) => {
				return (
					<Card
						key={ module.module }
						title={ module.name } />
				);
			} }
		</div>
	);
}
```
