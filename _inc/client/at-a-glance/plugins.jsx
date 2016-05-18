/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import DashItem from 'components/dash-item';

/**
 * Internal dependencies
 */
import QueryPluginUpdates from 'components/data/query-plugin-updates';
import {
	getPluginUpdates as _getPluginUpdates
} from 'state/at-a-glance';
import {
	isModuleActivated as _isModuleActivated,
	activateModule
} from 'state/modules';

const DashPluginUpdates = React.createClass( {
	activateAndRedirect: function( e ) {
		e.preventDefault();
		this.props.activateManage()
			.then( window.location = 'https://wordpress.com/plugins/' + window.Initial_State.rawUrl )
			.catch( console.log( 'Error activating Manage' ) );
	},

	getContent: function() {
		const pluginUpdates = this.props.getPluginUpdates();
		const manageActive = this.props.isModuleActivated( 'manage' );
		const ctaLink = manageActive ?
			'https://wordpress.com/plugins/' + window.Initial_State.rawUrl :
			window.Initial_State.adminUrl + 'plugins.php';

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
					<p className="jp-dash-item__description">
						<strong>{ pluginUpdates.count } plugins need updating.</strong><br/>
						{
							manageActive ?
								<a href={ ctaLink }>Turn on plugin auto updates</a> :
								<a onClick={ this.activateAndRedirect } href="#" >Activate Manage and turn on auto updates</a>
						}
					</p>
				</DashItem>
			);
		}

		return(
			<DashItem label="Plugin Updates" status="is-working">
				<p className="jp-dash-item__description">
					All plugins are up-to-date. Keep up the good work!
				</p>
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
			isModuleActivated: ( module_name ) => _isModuleActivated( state, module_name ),
			getPluginUpdates: () => _getPluginUpdates( state )
		};
	},
	( dispatch ) => {
		return {
			activateManage: () => {
				return dispatch( activateModule( 'manage' ) );
			}
		}
	}
)( DashPluginUpdates );
