/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { getSitePlan, getAvailableFeatures, getActiveFeatures } from 'state/site';
import QuerySite from 'components/data/query-site';
import { getSiteConnectionStatus } from 'state/connection';

import MyPlanHeader from './my-plan-header';
import MyPlanBody from './my-plan-body';

export class MyPlan extends React.Component {
	renderContent = () => {
		let sitePlan = this.props.sitePlan.product_slug || '',
			availableFeatures = this.props.availableFeatures,
			activeFeatures = this.props.activeFeatures;
		if ( 'dev' === this.props.getSiteConnectionStatus( this.props ) ) {
			sitePlan = 'dev';
			availableFeatures = {};
			activeFeatures = {};
		}

		return (
			<div>
				<MyPlanHeader plan={ sitePlan } siteRawUrl={ this.props.siteRawUrl } />
				<MyPlanBody
					plan={ sitePlan }
					availableFeatures={ availableFeatures }
					activeFeatures={ activeFeatures }
					siteRawUrl={ this.props.siteRawUrl }
					siteAdminUrl={ this.props.siteAdminUrl }
					rewindStatus={ this.props.rewindStatus }
				/>
			</div>
		);
	};

	render() {
		return (
			<div>
				<QuerySite />
				{ this.renderContent() }
			</div>
		);
	}
}

export default connect( state => {
	return {
		getSiteConnectionStatus: () => getSiteConnectionStatus( state ),
		sitePlan: getSitePlan( state ),
		availableFeatures: getAvailableFeatures( state ),
		activeFeatures: getActiveFeatures( state ),
	};
} )( MyPlan );
