# Query Intro Offers

`<QueryIntroOffers />` is a React component used to fetch Jetpack introduction offers.

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
import { getIntroOffers } from 'state/intro-offers';
import QueryIntroOffers from 'components/data/query-intro-offers';

const IntroOffers = ( { introOffers } ) => {
	return (
		<div>
			<QueryIntroOffers />
			{ introOffers.map(...) }
		</div>
	);
};

export default connect( state => ( {
	introOffers: getIntroOffers( state ),
} ) )( IntroOffers );
```

## Component Props

None