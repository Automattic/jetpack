/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import Button from 'components/button';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import {
	fetchSiteData,
	isFetchingSiteData,
	getSitePlan
} from 'state/site';
import QuerySite from 'components/data/query-site';
import { getSiteConnectionStatus } from 'state/connection';

import PlanHeader from './plan-header';
import PlanBody from './plan-body';

export const Plans = React.createClass( {
	render() {
		let sitePlan = '';

		if ( 'dev' === this.props.getSiteConnectionStatus( this.props ) ) {
			sitePlan = 'dev';
		} else if ( this.props.isFetchingSiteData ) {
			// do nothing
		} else {
			// Plan is jetpack_free, jetpack_premium, jetpack_premium_monthly, jetpack_business, jetpack_business_monthly
			sitePlan = this.props.getSitePlan();
			sitePlan = sitePlan.product_slug;
		}
		return (
			<div>
				<QuerySite />
				<div className="jp-jetpack-landing__plans dops-card">
					<PlanHeader plan={ sitePlan } />
					<PlanBody plan={ sitePlan } />
				</div>
			</div>
		);
	}
} );

export default connect(
	( state ) => {
		return {
			getSiteConnectionStatus: () => getSiteConnectionStatus( state ),
			isFetchingSiteData: isFetchingSiteData( state ),
			getSitePlan: () => getSitePlan( state )
		};
	},
	( dispatch ) => {
		return {
			fetchSiteData: () => dispatch( fetchSiteData() )
		}
	}
)( Plans );
