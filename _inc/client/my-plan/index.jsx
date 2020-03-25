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
import { isJetpackSearch } from 'lib/plans/constants';

import MyPlanHeader from './my-plan-header';
import MyPlanBody from './my-plan-body';

export function MyPlan( props ) {
	const hasSearchProduct = !! find( props.purchases, purchase =>
		isJetpackSearch( purchase.product_slug )
	);
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
				plan={ sitePlan }
				purchases={ props.purchases }
				siteRawUrl={ props.siteRawUrl }
			/>
			<MyPlanBody
				activeFeatures={ activeFeatures }
				availableFeatures={ availableFeatures }
				hasSearchProduct={ hasSearchProduct }
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
		getSiteConnectionStatus: () => getSiteConnectionStatus( state ),
		purchases: getSitePurchases( state ),
		sitePlan: getSitePlan( state ),
		availableFeatures: getAvailableFeatures( state ),
		activeFeatures: getActiveFeatures( state ),
	};
} )( MyPlan );
