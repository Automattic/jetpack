/**
 * External dependencies
 */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';
import analytics from 'lib/analytics';

/**
 * Internal dependencies
 */
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
import DashSectionHeader from 'components/dash-section-header';
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
			},
			trackSecurityClick = () => analytics.tracks.recordJetpackClick( 'aag_manage_security_wpcom' ),
			securityHeader = <DashSectionHeader
					label={ __( 'Security' ) }
					settingsPath={ this.props.userCanManageModules && '#security' }
					externalLink={
						this.props.isDevMode || ! this.props.userCanManageModules
						? ''
						: __( 'Manage security on WordPress.com' )
					}
					externalLinkPath={ this.props.isDevMode
						? ''
						: 'https://wordpress.com/settings/security/' + this.props.siteRawUrl
					}
					externalLinkClick={ trackSecurityClick }
				/>,
			connections = (
				<div>
					<DashSectionHeader label={ __( 'Connections' ) } />
					<DashConnections />
				</div>
			);

		// If user can manage modules, we're in an admin view, otherwise it's a non-admin view.
		if ( this.props.userCanManageModules ) {
			return (
				<div className="jp-at-a-glance">
					<QuerySitePlugins />
					<QuerySite />
					<DashStats { ...settingsProps } { ...urls } />

					{
						// Site Security
						securityHeader
					}
					<div className="jp-at-a-glance__item-grid">
						<div className="jp-at-a-glance__left">
							<DashProtect { ...settingsProps } />
						</div>
						<div className="jp-at-a-glance__right">
							<DashScan { ...settingsProps } siteRawUrl={ this.props.siteRawUrl } />
						</div>
					</div>
					<div className="jp-at-a-glance__item-grid">
						<div className="jp-at-a-glance__left">
							<DashBackups { ...settingsProps } siteRawUrl={ this.props.siteRawUrl } />
						</div>
						<div className="jp-at-a-glance__right">
							<DashMonitor { ...settingsProps } />
						</div>
					</div>
					<div className="jp-at-a-glance__item-grid">
						<div className="jp-at-a-glance__left">
							<DashAkismet { ...urls } />
						</div>
						<div className="jp-at-a-glance__right">
							<DashPluginUpdates { ...settingsProps } { ...urls } />
						</div>
					</div>

					{
						<DashSectionHeader
							label={ __( 'Performance' ) }
						/>
					}
					<div className="jp-at-a-glance__item-grid">
						<div className="jp-at-a-glance__left">
							<DashPhoton { ...settingsProps } />
						</div>
					</div>

					{
						connections
					}
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
			isDevMode: isDevMode( state )
		};
	}
)( moduleSettingsForm( AtAGlance ) );
