/**
 * External dependencies
 */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';
import analytics from 'lib/analytics';
import chunk from 'lodash/chunk';
import get from 'lodash/get';

/**
 * Internal dependencies
 */
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
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
import DashConnections from './connections';
import QuerySitePlugins from 'components/data/query-site-plugins';
import QuerySite from 'components/data/query-site';
import {
	userCanManageModules,
	userCanViewStats,
	userIsSubscriber
} from 'state/initial-state';
import { isDevMode } from 'state/connection';

const renderPairs = layout => layout.map( item => (
	[
		item.header,
		chunk( item.cards, 2 ).map( ( [ left, right ] ) => (
			<div className="jp-at-a-glance__item-grid">
				<div className="jp-at-a-glance__left">{ left }</div>
				<div className="jp-at-a-glance__right">{ right }</div>
			</div>
		) )
	]
) );

class AtAGlance extends Component {
	render() {
		const settingsProps = {
			updateOptions: this.props.updateOptions,
			getOptionValue: this.props.getOptionValue,
			isUpdating: this.props.isUpdating
		};
		const urls = {
			siteAdminUrl: this.props.siteAdminUrl,
			siteRawUrl: this.props.siteRawUrl
		};
		const trackSecurityClick = () => analytics.tracks.recordJetpackClick( 'aag_manage_security_wpcom' );
		const securityHeader = <DashSectionHeader
					label={ __( 'Security' ) }
					settingsPath={ this.props.userCanManageModules ? '#security' : undefined }
					externalLink={ this.props.isDevMode || ! this.props.userCanManageModules
						? ''
						: __( 'Manage security on WordPress.com' )
					}
					externalLinkPath={ this.props.isDevMode
						? ''
						: 'https://wordpress.com/settings/security/' + this.props.siteRawUrl
					}
					externalLinkClick={ trackSecurityClick }
				/>;
		const connections = (
				<div>
					<DashSectionHeader label={ __( 'Connections' ) } />
					<DashConnections />
				</div>
			);
		const isRewindActive = 'active' === get( this.props.rewindStatus, [ 'state' ], false );
		const securityCards = [
			<DashProtect { ...settingsProps } />,
			<DashScan
				{ ...settingsProps }
				siteRawUrl={ this.props.siteRawUrl }
				isRewindActive={ isRewindActive }
			/>,
			<DashBackups
				{ ...settingsProps }
				siteRawUrl={ this.props.siteRawUrl }
				isRewindActive={ isRewindActive }
			/>,
			<DashMonitor { ...settingsProps } />,
			<DashAkismet { ...urls } />,
			<DashPluginUpdates { ...settingsProps } { ...urls } />
		];

		// Maybe add the rewind card
		isRewindActive && securityCards.unshift( <DashActivity { ...settingsProps } siteRawUrl={ this.props.siteRawUrl } /> );

		// If user can manage modules, we're in an admin view, otherwise it's a non-admin view.
		if ( this.props.userCanManageModules ) {
			return (
				<div className="jp-at-a-glance">
					<QuerySitePlugins />
					<QuerySite />
					<DashStats { ...settingsProps } { ...urls } />

					{
						renderPairs( [
							{
								header: securityHeader,
								cards: securityCards
							},
							{
								header: <DashSectionHeader label={ __( 'Performance' ) } />,
								cards: [ <DashPhoton { ...settingsProps } /> ]
							}
						] )
					}

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

		return this.props.userIsSubscriber
			? (
				<div>
					{ stats	}
					{ connections }
				</div>
			)
			: (
				<div>
					{ stats	}
					{
						// Site Security
						this.props.getOptionValue( 'protect' ) && securityHeader
					}
					{ protect }
					{ connections }
				</div>
			);
	} // render
}

export default connect(
	( state ) => {
		return {
			userCanManageModules: userCanManageModules( state ),
			userCanViewStats: userCanViewStats( state ),
			userIsSubscriber: userIsSubscriber( state ),
			isDevMode: isDevMode( state ),
		};
	}
)( moduleSettingsForm( AtAGlance ) );
