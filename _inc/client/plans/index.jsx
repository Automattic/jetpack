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
import QuerySite from 'components/data/query-site';
import { getSiteRawUrl } from 'state/initial-state';
import { getAvailablePlans, getSitePlan } from 'state/site';

export class Plans extends React.Component {
	render() {
		const { sitePlans, siteRawUrl } = this.props;

		return (
			<>
				<QuerySite />
				{ 'jetpack_free' === get( this.props.sitePlan, 'product_slug', 'jetpack_free' ) &&
					sitePlans && <SingleProductBackup sitePlans={ sitePlans } siteRawUrl={ siteRawUrl } /> }
				<PlanGrid />
			</>
		);
	}
}

export default connect( state => {
	return {
		// TODO: remove faked data before releasing
		sitePlan: getSitePlan( state ),
		sitePlans: addFakedSitePlans( getAvailablePlans( state ) ),
		siteRawUrl: getSiteRawUrl( state ),
	};
} )( Plans );

function addFakedSitePlans( sitePlans ) {
	if ( sitePlans ) {
		sitePlans[ 'daily-backup' ] = {
			price: {
				yearly: {
					html: '<abbr title="United States Dollars">$</abbr>12',
					text: '$12',
					amount: 12,
					symbol: '$',
					per: '<abbr title="United States Dollars">$</abbr>12 per year',
				},
				// monthly: {
				// 	html: '<abbr title="United States Dollars">$</abbr>3.50',
				// 	text: '$3.50',
				// 	amount: 3.5,
				// 	symbol: '$',
				// 	per: '<abbr title="United States Dollars">$</abbr>3.50 per month',
				// },
			},
			features: [],
		};
		sitePlans[ 'realtime-backup' ] = {
			price: {
				yearly: {
					html: '<abbr title="United States Dollars">$</abbr>16',
					text: '$16',
					amount: 16,
					symbol: '$',
					per: '<abbr title="United States Dollars">$</abbr>16 per year',
				},
				// monthly: {
				// 	html: '<abbr title="United States Dollars">$</abbr>3.50',
				// 	text: '$3.50',
				// 	amount: 3.5,
				// 	symbol: '$',
				// 	per: '<abbr title="United States Dollars">$</abbr>3.50 per month',
				// },
			},
			features: [],
		};
	}
	return sitePlans;
}
