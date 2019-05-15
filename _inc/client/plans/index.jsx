/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { getSiteConnectionStatus } from 'state/connection';
import PlanGrid from './plan-grid';
import QuerySite from 'components/data/query-site';

export class Plans extends React.Component {
	render() {
		return (
			<div>
				<QuerySite />
				<div>
					<PlanGrid />
				</div>
			</div>
		);
	}
}

export default connect( state => {
	return {
		getSiteConnectionStatus: () => getSiteConnectionStatus( state ),
	};
} )( Plans );
