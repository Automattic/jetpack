import QuerySite from 'components/data/query-site';
import React from 'react';
import { connect } from 'react-redux';
import { getSiteConnectionStatus } from 'state/connection';
import {
	getActiveFeatures,
	getActiveProductPurchases,
	getAvailableFeatures,
	getSitePlan,
	getSitePurchases,
} from 'state/site';
import MyPlanBody from './my-plan-body';
import MyPlanHeader from './my-plan-header';
import MyPlanPartnerCoupon from './my-plan-partner-coupon';

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
			<MyPlanPartnerCoupon siteRawUrl={ props.siteRawUrl } />
			<MyPlanHeader
				activeProducts={ props.activeProducts }
				plan={ sitePlan }
				purchases={ props.purchases }
				siteAdminUrl={ props.siteAdminUrl }
			/>
			<MyPlanBody
				activeFeatures={ activeFeatures }
				availableFeatures={ availableFeatures }
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
		purchases: getSitePurchases( state ),
		sitePlan: getSitePlan( state ),
	};
} )( MyPlan );
