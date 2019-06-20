/**
 * External dependencies
 *
 * @format
 */

import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';
import Card from 'components/card';
import DashItem from 'components/dash-item';
import QueryPluginUpdates from 'components/data/query-plugin-updates';
import { getPluginUpdates } from 'state/at-a-glance';
import { isDevMode } from 'state/connection';

class DashPluginUpdates extends Component {
	static propTypes = {
		isDevMode: PropTypes.bool.isRequired,
		siteRawUrl: PropTypes.string.isRequired,
		siteAdminUrl: PropTypes.string.isRequired,
		pluginUpdates: PropTypes.any.isRequired,
	};

	trackManagePlugins() {
		analytics.tracks.recordJetpackClick( {
			type: 'link',
			target: 'at-a-glance',
			feature: 'manage-plugins',
		} );
	}

	getContent() {
		const labelName = __( 'Plugin Updates' );
		const pluginUpdates = this.props.pluginUpdates;

		const support = {
			text: __(
				'Jetpack’s Plugin Updates allows you to choose which plugins update automatically.'
			),
			link: 'https://jetpack.com/support/site-management/',
		};

		if ( 'N/A' === pluginUpdates ) {
			return (
				<DashItem label={ labelName } module="manage" support={ support } status="is-working">
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
				support={ support }
				status={ updatesAvailable ? 'is-warning' : workingOrInactive }
			>
				{ updatesAvailable && (
					<h2 className="jp-dash-item__count">
						{ __( '%(number)s', '%(number)s', {
							count: pluginUpdates.count,
							args: { number: pluginUpdates.count },
						} ) }
					</h2>
				) }
				<p className="jp-dash-item__description">
					{ updatesAvailable
						? [
								__( 'Plugin needs updating.', 'Plugins need updating.', {
									count: pluginUpdates.count,
								} ) + ' ',
								! this.props.isDevMode &&
									__( '{{a}}Turn on plugin autoupdates{{/a}}', {
										components: { a: <a href={ managePluginsUrl } /> },
									} ),
						  ]
						: __( 'All plugins are up-to-date. Awesome work!' ) }
				</p>
			</DashItem>,
			! this.props.isDevMode && (
				<Card
					key="manage-plugins"
					className="jp-dash-item__manage-in-wpcom"
					compact
					href={ managePluginsUrl }
					onClick={ this.trackManagePlugins }
					target="_blank"
				>
					{ __( 'Manage your plugins' ) }
				</Card>
			),
		];
	}

	render() {
		return (
			<div>
				<QueryPluginUpdates />
				{ this.getContent() }
			</div>
		);
	}
}

export default connect( state => ( {
	pluginUpdates: getPluginUpdates( state ),
	isDevMode: isDevMode( state ),
} ) )( DashPluginUpdates );
