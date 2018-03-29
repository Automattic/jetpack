/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import Card from 'components/card';
import DashItem from 'components/dash-item';
import QueryPluginUpdates from 'components/data/query-plugin-updates';
import { getPluginUpdates } from 'state/at-a-glance';
import { isModuleAvailable } from 'state/modules';
import { isDevMode } from 'state/connection';

class DashPluginUpdates extends Component {
	static propTypes = {
		isDevMode: PropTypes.bool.isRequired,
		siteRawUrl: PropTypes.string.isRequired,
		siteAdminUrl: PropTypes.string.isRequired,
		pluginUpdates: PropTypes.any.isRequired,
		isModuleAvailable: PropTypes.bool.isRequired,
	};

	activateAndRedirect( e ) {
		e.preventDefault();
		this.props.activateManage()
			.then( window.location = 'https://wordpress.com/plugins/manage/' + this.props.siteRawUrl );
	}

	getContent() {
		const labelName = __( 'Plugin Updates' );
		const pluginUpdates = this.props.pluginUpdates;

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

		const updatesAvailable = 'updates-available' === pluginUpdates.code;
		const managePluginsUrl = `https://wordpress.com/plugins/manage/${ this.props.siteRawUrl }`;
		const workingOrInactive = this.props.getOptionValue( 'manage' ) ? 'is-working' : 'is-inactive';

		return [
			<DashItem
				key="plugin-updates"
				label={ labelName }
				module="manage"
				status={ updatesAvailable ? 'is-warning' : workingOrInactive }
				>
				{
					updatesAvailable && (
						<h2 className="jp-dash-item__count">
							{
								__( '%(number)s plugin', '%(number)s plugins', {
									count: pluginUpdates.count,
									args: { number: pluginUpdates.count }
								} )
							}
						</h2>
					)
				}
				<p className="jp-dash-item__description">
					{
						updatesAvailable
							? [
								__( 'Needs updating.', 'Need updating.', { count: pluginUpdates.count } ) + ' ',
								! this.props.isDevMode && __( '{{a}}Turn on plugin autoupdates{{/a}}', {
									components: { a: <a href={ managePluginsUrl } /> }
								} )
							]
							: __( 'All plugins are up-to-date. Awesome work!' )
					}
				</p>
			</DashItem>,
			! this.props.isDevMode && (
				<Card
					key="manage-plugins"
					className="jp-dash-item__manage-in-wpcom"
					compact
					href={ managePluginsUrl }
				>
					{ __( 'Manage your plugins' ) }
				</Card>
			)
		];
	}

	render() {
		return this.props.isModuleAvailable && (
			<div>
				<QueryPluginUpdates />
				{ this.getContent() }
			</div>
		);
	}
}

export default connect(
	state => ( {
		pluginUpdates: getPluginUpdates( state ),
		isDevMode: isDevMode( state ),
		isModuleAvailable: isModuleAvailable( state, 'manage' ),
	} )
)( DashPluginUpdates );
