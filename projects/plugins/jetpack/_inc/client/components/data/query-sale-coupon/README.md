# Query Sale Coupon

`<QuerySaleCoupon />` is a React component used to fetch the current Jetpack marketing sale coupon.

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
import { getSaleCoupon } from 'state/sale-coupon';
import QuerySaleCoupon from 'components/data/query-sale-coupon';

const SaleCoupon = ( { saleCoupon } ) => {
	return (
		<div>
			<QuerySaleCoupon />
			<p>
                { `${ saleCoupon.discount }% off` }
		</div>
	);
};

export default connect( state => ( {
	saleCoupon: getSaleCoupon( state ),
} ) )( SaleCoupon );
```

## Component Props

None