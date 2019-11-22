/**
 * External dependencies
 */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';
import analytics from 'lib/analytics';
import { chunk, get } from 'lodash';

/**
 * Internal dependencies
 */
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import DashSectionHeader from 'components/dash-section-header';
import DashActivity from './activity';
import DashStats from './stats/index.jsx';
import DashProtect from './protect';
import DashMonitor from './monitor';
import DashScan from './scan';
import DashAkismet from './akismet';
import DashBackups from './backups';
import DashPluginUpdates from './plugins';
import DashPhoton from './photon';
import DashSearch from './search';
import DashConnections from './connections';
import QuerySitePlugins from 'components/data/query-site-plugins';
import QuerySite from 'components/data/query-site';
import { userCanManageModules, userCanViewStats, userIsSubscriber } from 'state/initial-state';
import { isDevMode } from 'state/connection';
import { getModuleOverride } from 'state/modules';

const renderPairs = layout =>
	layout.map( ( item, layoutIndex ) => [
		item.header,
		chunk( item.cards, 2 ).map( ( [ left, right ], cardIndex ) => (
			<div className="jp-at-a-glance__item-grid" key={ `card-${ layoutIndex }-${ cardIndex }` }>
				<div className="jp-at-a-glance__left">{ left }</div>
				<div className="jp-at-a-glance__right">{ right }</div>
			</div>
		) ),
	] );

class AtAGlance extends Component {
	trackSecurityClick = () => analytics.tracks.recordJetpackClick( 'aag_manage_security_wpcom' );

	render() {
		const settingsProps = {
			updateOptions: this.props.updateOptions,
			getOptionValue: this.props.getOptionValue,
			isUpdating: this.props.isUpdating,
		};
		const urls = {
			siteAdminUrl: this.props.siteAdminUrl,
			siteRawUrl: this.props.siteRawUrl,
		};
		const securityHeader = (
			<DashSectionHeader
				key="securityHeader"
				label={ __( 'Security' ) }
				settingsPath={ this.props.userCanManageModules ? '#security' : undefined }
				externalLink={
					this.props.isDevMode || ! this.props.userCanManageModules
						? ''
						: __( 'Manage security settings' )
				}
				externalLinkPath={ this.props.isDevMode ? '' : '#/security' }
				externalLinkClick={ this.trackSecurityClick }
			/>
		);
		const connections = (
			<div>
				<DashSectionHeader
					label={ __( 'Connections' ) }
					className="jp-dash-section-header__connections"
				/>
				<DashConnections />
			</div>
		);
		// Status can be unavailable, active, provisioning, awaiting_credentials
		const rewindStatus = get( this.props.rewindStatus, [ 'state' ], '' );
		const securityCards = [
			<DashScan
				{ ...settingsProps }
				siteRawUrl={ this.props.siteRawUrl }
				rewindStatus={ rewindStatus }
			/>,
			<DashBackups
				{ ...settingsProps }
				siteRawUrl={ this.props.siteRawUrl }
				rewindStatus={ rewindStatus }
			/>,
			<DashAkismet { ...urls } />,
			<DashPluginUpdates { ...settingsProps } { ...urls } />,
		];

		if ( 'inactive' !== this.props.getModuleOverride( 'protect' ) ) {
			securityCards.push( <DashProtect { ...settingsProps } /> );
		}
		if ( 'inactive' !== this.props.getModuleOverride( 'monitor' ) ) {
			securityCards.push( <DashMonitor { ...settingsProps } /> );
		}

		// Maybe add the rewind card
		'active' === rewindStatus &&
			securityCards.unshift(
				<DashActivity { ...settingsProps } siteRawUrl={ this.props.siteRawUrl } />
			);

		// If user can manage modules, we're in an admin view, otherwise it's a non-admin view.
		if ( this.props.userCanManageModules ) {
			const pairs = [
				{
					header: securityHeader,
					cards: securityCards,
				},
			];

			const performanceCards = [];
			if ( 'inactive' !== this.props.getModuleOverride( 'photon' ) ) {
				performanceCards.push( <DashPhoton { ...settingsProps } /> );
			}
			if ( 'inactive' !== this.props.getModuleOverride( 'search' ) ) {
				performanceCards.push( <DashSearch { ...settingsProps } /> );
			}
			if ( performanceCards.length ) {
				pairs.push( {
					header: <DashSectionHeader key="performanceHeader" label={ __( 'Performance' ) } />,
					cards: performanceCards,
				} );
			}

			return (
				<div className="jp-at-a-glance">
					<QuerySitePlugins />
					<QuerySite />
					<DashStats { ...settingsProps } { ...urls } />
					{ renderPairs( pairs ) }
					{ connections }
				</div>
			);
		}

		/*
		 * Non-admin zone...
		 */
		let stats = '';
		if ( this.props.userCanViewStats ) {
			stats = <DashStats { ...settingsProps } { ...urls } />;
		}

		let protect = '';
		if ( this.props.getOptionValue( 'protect' ) ) {
			protect = <DashProtect { ...settingsProps } />;
		}

		return this.props.userIsSubscriber ? (
			<div>
				{ stats }
				{ connections }
			</div>
		) : (
			<div>
				{ stats }
				{ // Site Security
				this.props.getOptionValue( 'protect' ) && securityHeader }
				{ protect }
				{ connections }
			</div>
		);
	} // render
}

export default connect( state => {
	return {
		userCanManageModules: userCanManageModules( state ),
		userCanViewStats: userCanViewStats( state ),
		userIsSubscriber: userIsSubscriber( state ),
		isDevMode: isDevMode( state ),
		getModuleOverride: module_name => getModuleOverride( state, module_name ),
	};
} )( withModuleSettingsFormHelpers( AtAGlance ) );
