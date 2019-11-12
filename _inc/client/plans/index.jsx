/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import PlanGrid from './plan-grid';
import { SingleProductBackup } from './single-product-backup';
import QueryProducts from 'components/data/query-products';
import QuerySite from 'components/data/query-site';
import { getSiteRawUrl } from 'state/initial-state';
import { getProducts, getSitePlan } from 'state/site';

export class Plans extends React.Component {
	render() {
		const { products, siteRawUrl } = this.props;

		return (
			<React.Fragment>
				<QueryProducts />
				<QuerySite />
				{ products && 'jetpack_free' === get( this.props.sitePlan, 'product_slug' ) && (
					<SingleProductBackup products={ products } siteRawUrl={ siteRawUrl } />
				) }
				<PlanGrid />
			</React.Fragment>
		);
	}
}

export default connect( state => {
	return {
		products: getProducts( state ),
		sitePlan: getSitePlan( state ),
		siteRawUrl: getSiteRawUrl( state ),
	};
} )( Plans );
