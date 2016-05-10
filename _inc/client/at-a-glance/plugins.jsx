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
					<p className="jp-dash-item__description">Loading&#8230;</p>
				</DashItem>
			);
		}

		if ( 'updates-available' === pluginUpdates.code ) {
			return(
				<DashItem label="Plugin Updates" status="is-warning">
					<p className="jp-dash-item__description"><strong>{ pluginUpdates.count } plugins need updating.</strong> <a href="#">Manage plugins (null)</a></p>
				</DashItem>
			);
		}

		return(
			<DashItem label="Plugin Updates" status="is-working">
				<p className="jp-dash-item__description">All plugins are up-to-date. Keep up the good work!</p>
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