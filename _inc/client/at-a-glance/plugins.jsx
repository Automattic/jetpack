/**
 * External dependencies
 *
 * @format
 */

import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { jetpackCreateInterpolateElement } from 'components/create-interpolate-element';
import { __, _n } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';
import Card from 'components/card';
import DashItem from 'components/dash-item';
import getRedirectUrl from 'lib/jp-redirect';
import QueryPluginUpdates from 'components/data/query-plugin-updates';
import { getPluginUpdates } from 'state/at-a-glance';
import { isOfflineMode } from 'state/connection';

class DashPluginUpdates extends Component {
	static propTypes = {
		isOfflineMode: PropTypes.bool.isRequired,
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
		const labelName = __( 'Plugin Updates', 'jetpack' );
		const pluginUpdates = this.props.pluginUpdates;

		const support = {
			text: __(
				'Jetpack’s Plugin Updates allows you to choose which plugins update automatically.',
				'jetpack'
			),
			link: getRedirectUrl( 'jetpack-support-site-management' ),
		};

		if ( 'N/A' === pluginUpdates ) {
			return (
				<DashItem label={ labelName } module="manage" support={ support } status="is-working">
					<QueryPluginUpdates />
					<p className="jp-dash-item__description">{ __( 'Loading…', 'jetpack' ) }</p>
				</DashItem>
			);
		}

		const updatesAvailable = 'updates-available' === pluginUpdates.code;
		const managePluginsUrl = getRedirectUrl( 'calypso-plugins-manage', {
			site: this.props.siteRawUrl,
		} );
		const workingOrInactive = this.props.getOptionValue( 'manage' ) ? 'is-working' : 'is-inactive';

		return [
			<DashItem
				key="plugin-updates"
				label={ labelName }
				module="manage"
				support={ support }
				status={ updatesAvailable ? 'is-warning' : workingOrInactive }
			>
				{ updatesAvailable && <h2 className="jp-dash-item__count">{ pluginUpdates.count }</h2> }
				<p className="jp-dash-item__description">
					{ updatesAvailable
						? [
								_n(
									'Plugin needs updating.',
									'Plugins need updating.',
									pluginUpdates.count,
									'jetpack'
								) + ' ',
								! this.props.isOfflineMode &&
									jetpackCreateInterpolateElement(
										__( '<a>Turn on plugin autoupdates.</a>', 'jetpack' ),
										{
											a: <a href={ managePluginsUrl } />,
										}
									),
						  ]
						: __( 'All plugins are up-to-date. Awesome work!', 'jetpack' ) }
				</p>
			</DashItem>,
			! this.props.isOfflineMode && (
				<Card
					key="manage-plugins"
					className="jp-dash-item__manage-in-wpcom"
					compact
					href={ managePluginsUrl }
					onClick={ this.trackManagePlugins }
					target="_blank"
				>
					{ __( 'Manage your plugins', 'jetpack' ) }
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
	isOfflineMode: isOfflineMode( state ),
} ) )( DashPluginUpdates );
