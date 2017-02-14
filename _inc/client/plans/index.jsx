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
	getSitePlan
} from 'state/site';
import QuerySite from 'components/data/query-site';
import { getSiteConnectionStatus } from 'state/connection';

import PlanHeader from './plan-header';
import PlanBody from './plan-body';

export const Plans = React.createClass( {
	render() {
		let sitePlan = this.props.sitePlan.product_slug || '';
		if ( 'dev' === this.props.getSiteConnectionStatus( this.props ) ) {
			sitePlan = 'dev';
		}

		return (
			<div>
				<QuerySite />
				<div className="jp-landing__plans dops-card">
					<PlanHeader plan={ sitePlan } siteRawUrl={ this.props.siteRawUrl } />
					<PlanBody plan={ sitePlan } siteRawUrl={ this.props.siteRawUrl } siteAdminUrl={ this.props.siteAdminUrl } />
				</div>
			</div>
		);
	}
} );

export default connect(
	( state ) => {
		return {
			getSiteConnectionStatus: () => getSiteConnectionStatus( state ),
			sitePlan: getSitePlan( state )
		};
	}
)( Plans );
