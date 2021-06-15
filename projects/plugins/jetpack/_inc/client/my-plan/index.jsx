/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import {
	getActiveFeatures,
	getActiveProductPurchases,
	getAvailableFeatures,
	getSitePlan,
	getSitePurchases,
	hasActiveSearchPurchase,
} from 'state/site';
import QuerySite from 'components/data/query-site';
import { getSiteConnectionStatus } from 'state/connection';

import MyPlanHeader from './my-plan-header';
import MyPlanBody from './my-plan-body';

export function MyPlan( props ) {
	let sitePlan = props.sitePlan.product_slug || '',
		availableFeatures = props.availableFeatures,
		activeFeatures = props.activeFeatures;
	if ( 'offline' === props.getSiteConnectionStatus( props ) ) {
		sitePlan = 'offline';
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
				siteAdminUrl={ props.siteAdminUrl }
			/>
			<MyPlanBody
				activeFeatures={ activeFeatures }
				availableFeatures={ availableFeatures }
				hasActiveSearchPurchase={ props.hasActiveSearchPurchase }
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
		hasActiveSearchPurchase: hasActiveSearchPurchase( state ),
		purchases: getSitePurchases( state ),
		sitePlan: getSitePlan( state ),
	};
} )( MyPlan );
