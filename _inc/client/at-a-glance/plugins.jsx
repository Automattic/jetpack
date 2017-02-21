/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import DashItem from 'components/dash-item';
import { translate as __ } from 'i18n-calypso';
import includes from 'lodash/includes';

/**
 * Internal dependencies
 */
import QueryPluginUpdates from 'components/data/query-plugin-updates';
import {
	getPluginUpdates as _getPluginUpdates
} from 'state/at-a-glance';
import {
	isModuleActivated as _isModuleActivated,
	activateModule,
	getModules
} from 'state/modules';
import { isDevMode } from 'state/connection';

const DashPluginUpdates = React.createClass( {
	activateAndRedirect: function( e ) {
		e.preventDefault();
		this.props.activateManage()
			.then( window.location = 'https://wordpress.com/plugins/' + this.props.siteRawUrl );
	},

	getContent: function() {
		const labelName = __( 'Plugin Updates' );
		const pluginUpdates = this.props.pluginUpdates;
		const manageActive = this.props.isModuleActivated( 'manage' );
		const ctaLink = manageActive ?
			'https://wordpress.com/plugins/' + this.props.siteRawUrl :
			this.props.siteAdminUrl + 'plugins.php';

		if ( 'N/A' === pluginUpdates ) {
			return (
				<DashItem
					label={ labelName }
					module="manage"
					status="is-working" >
					<QueryPluginUpdates />
					<p className="jp-dash-item__description">{ __( 'Loading…' ) }</p>
				</DashItem>
			);
		}

		if ( 'updates-available' === pluginUpdates.code ) {
			const manageDashText = manageActive
				? __( '{{a}}Turn on plugin auto updates{{/a}}', { components: { a: <a href={ ctaLink } /> } } )
				: __( '{{a}}Activate Manage and turn on auto updates{{/a}}', { components: { a: <a onClick={ this.activateAndRedirect } href="javascript:void(0)" /> } } );
			return (
				<DashItem
					label={ labelName }
					module="manage"
					status="is-warning"
				>
					<h2 className="jp-dash-item__count">
						{
							__( '%(number)s plugin', '%(number)s plugins', {
								count: pluginUpdates.count,
								args: {
									number: pluginUpdates.count
								}
							} )
						}
					</h2>
					<p className="jp-dash-item__description">
						{
							__( 'Needs updating. ', 'Need updating. ', {
								count: pluginUpdates.count,
								args: {
									number: pluginUpdates.count
								}
							} )
						}
						{
							this.props.isDevMode ? '' : manageDashText
						}
					</p>
				</DashItem>
			);
		}

		return (
			<DashItem
				label={ labelName }
				module="manage"
				status={ manageActive ? 'is-working' : 'is-inactive' } >
				<p className="jp-dash-item__description">
					{
						manageActive
							? __( 'All plugins are up-to-date. Awesome work!' )
							: __( '{{a}}Activate Manage{{/a}} to turn on auto updates and manage your plugins from WordPress.com.', { components: { a: <a onClick={ this.props.activateManage } href="javascript:void(0)" /> } } )
					}
				</p>
			</DashItem>
		);
	},

	render: function() {
		const moduleList = Object.keys( this.props.moduleList );
		if ( ! includes( moduleList, 'manage' ) ) {
			return null;
		}

		return (
			<div>
				<QueryPluginUpdates />
				{ this.getContent() }
			</div>
		);
	}
} );

DashPluginUpdates.propTypes = {
	isDevMode: React.PropTypes.bool.isRequired,
	siteRawUrl: React.PropTypes.string.isRequired,
	siteAdminUrl: React.PropTypes.string.isRequired,
	pluginUpdates: React.PropTypes.any.isRequired
};

export default connect(
	( state ) => {
		return {
			isModuleActivated: ( module_name ) => _isModuleActivated( state, module_name ),
			pluginUpdates: _getPluginUpdates( state ),
			isDevMode: isDevMode( state ),
			moduleList: getModules( state )
		};
	},
	( dispatch ) => {
		return {
			activateManage: () => {
				return dispatch( activateModule( 'manage' ) );
			}
		};
	}
)( DashPluginUpdates );
