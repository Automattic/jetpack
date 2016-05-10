/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import DashItem from 'components/dash-item';
import DashSectionHeader from 'components/dash-section-header';

/**
 * Internal dependencies
 */
import QueryPluginUpdates from 'components/data/query-plugin-updates';
import {
	fetchPluginUpdates,
	getPluginUpdates as _getPluginUpdates
} from 'state/at-a-glance';

const DashPluginUpdates = React.createClass( {
	getContent: function() {
		const pluginUpdates = this.props.getPluginUpdates();

		if ( 'N/A' === pluginUpdates ) {
			return(
				<DashItem label="Plugin Updates" status="is-working">
					<QueryPluginUpdates />
					Loading...
				</DashItem>
			);
		}

		if ( 'updates-available' === pluginUpdates.code ) {
			return(
				<DashItem label="Plugin Updates" status="is-warning">
					<h2>{ pluginUpdates.count }</h2>
					Plugins need updating. <a href="#">fake link to manage</a>
				</DashItem>
			);
		}

		return(
			<DashItem label="Plugin Updates" status="is-working">
				<h3>All plugins up-to-date:</h3>
			</DashItem>
		);
	},

	render: function() {
		return(
			<div>
				<QueryPluginUpdates />
				{ this.getContent() }
			</div>
		);
	}
} );

export default connect(
	( state ) => {
		return {
			getPluginUpdates: () => _getPluginUpdates( state )
		};
	}
)( DashPluginUpdates );