/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { getSitePlan, getSitePurchases, getAvailableFeatures, getActiveFeatures } from 'state/site';
import QuerySite from 'components/data/query-site';
import { getSiteConnectionStatus } from 'state/connection';

import MyPlanHeader from './my-plan-header';
import MyPlanBody from './my-plan-body';
import { getActiveProductPurchases, hasSearchPurchase } from '../state/site/reducer';

export function MyPlan( props ) {
	let sitePlan = props.sitePlan.product_slug || '',
		availableFeatures = props.availableFeatures,
		activeFeatures = props.activeFeatures;
	if ( 'dev' === props.getSiteConnectionStatus( props ) ) {
		sitePlan = 'dev';
		availableFeatures = {};
		activeFeatures = {};
	}

	return (
		<React.Fragment>
			<QuerySite />
			<MyPlanHeader
				activeProducts={ props.activeProducts }
				plan={ sitePlan }
				purchases={ props.purchases }
				siteRawUrl={ props.siteRawUrl }
			/>
			<MyPlanBody
				activeFeatures={ activeFeatures }
				availableFeatures={ availableFeatures }
				hasSearchPurchase={ props.hasSearchPurchase }
				plan={ sitePlan }
				rewindStatus={ props.rewindStatus }
				siteAdminUrl={ props.siteAdminUrl }
				siteRawUrl={ props.siteRawUrl }
			/>
		</React.Fragment>
	);
}

export default connect( state => {
	return {
		activeFeatures: getActiveFeatures( state ),
		activeProducts: getActiveProductPurchases( state ),
		availableFeatures: getAvailableFeatures( state ),
		getSiteConnectionStatus: () => getSiteConnectionStatus( state ),
		hasSearchPurchase: hasSearchPurchase( state ),
		purchases: getSitePurchases( state ),
		sitePlan: getSitePlan( state ),
	};
} )( MyPlan );
