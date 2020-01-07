/**
 * External dependencies
 */
import React, { Fragment } from 'react';

/**
 * Internal dependencies
 */
import QueryProducts from 'components/data/query-products';
import QuerySite from 'components/data/query-site';
import PlanGrid from './plan-grid';
import ProductSelector from './product-selector';

export class Plans extends React.Component {
	render() {
		return (
			<Fragment>
				<QueryProducts />
				<QuerySite />
				<PlanGrid />
				<ProductSelector />
			</Fragment>
		);
	}
}

export default Plans;
