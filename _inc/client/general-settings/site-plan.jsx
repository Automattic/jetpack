/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
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
import QueryConnectionStatus from 'components/data/query-connection-status';

export const SitePlan = React.createClass( {
	render() {
		let sitePlanName = '';

		if ( 'dev' === this.props.getSiteConnectionStatus( this.props ) ) {
			sitePlanName = __( 'No plan available since site runs in development mode.' );
		} else if ( this.props.isFetchingSiteData ) {
			sitePlanName = __( 'Loading plan data...' );
		} else {
			let sitePlan = this.props.getSitePlan();
			if ( 'object' === typeof sitePlan ) {
				sitePlanName = __( 'Your current plan is: %s', {
					args: sitePlan.product_name_short
				} );
			} else {
				sitePlanName = __( 'No plan information available.' );
			}
		}

		return (
			<div>
				<QueryConnectionStatus />
				<QuerySite />
				{ sitePlanName }
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
)( SitePlan );
