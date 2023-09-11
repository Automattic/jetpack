# Query Site Discount

`<QuerySiteDiscount />` is a React component used in managing network requests for a potential discount emitted for this site.

## Usage

Render the component, passing in the properties below. It does not accept any children, nor does it render any elements to the page.

```jsx
/**
 * External dependencies
 */
import { connect } from 'react-redux';
import React from 'react';

/**
 * Internal dependencies
 */
import { getSiteDiscount } from 'state/site';
import QuerySiteDiscount from 'components/data/query-site-discount';

const SiteDiscount = ( { siteDiscount } ) => {
	return (
		<div>
			<QuerySiteDiscount />
			<span>Discount: { siteDiscount.discount }</span>
		</div>
	);
};

export default connect( state => ( {
	siteDiscount: getSiteDiscount( state ),
} ) )( SiteDiscount );
```

## Component Props

None