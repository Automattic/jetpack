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
import QueryProducts from 'components/data/query-products';

export class Plans extends React.Component {
	render() {
		return (
			<div>
				<QueryProducts />
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
