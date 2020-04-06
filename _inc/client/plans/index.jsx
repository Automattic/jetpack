/**
 * External dependencies
 */
import React, { Fragment } from 'react';

/**
 * Internal dependencies
 */
import QuerySite from 'components/data/query-site';
import PlanGrid from './plan-grid';
import ProductSelector from './product-selector';

export default function Plans() {
	return (
		<Fragment>
			<QuerySite />
			<PlanGrid />
			<ProductSelector />
		</Fragment>
	);
}
