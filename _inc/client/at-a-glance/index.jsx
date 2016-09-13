/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import DashSectionHeader from 'components/dash-section-header';
import { translate as __ } from 'i18n-calypso';
import analytics from 'lib/analytics';

/**
 * Internal dependencies
 */
import DashStats from './stats';
import DashProtect from './protect';
import DashMonitor from './monitor';
import DashScan from './scan';
import DashAkismet from './akismet';
import DashBackups from './backups';
import DashPluginUpdates from './plugins';
import DashPhoton from './photon';
import FeedbackDashRequest from 'components/jetpack-notices/feedback-dash-request';
import { isModuleActivated as _isModuleActivated } from 'state/modules';
import QuerySitePlugins from 'components/data/query-site-plugins';
import QuerySite from 'components/data/query-site';
import {
	userCanManageModules,
	userCanViewStats
} from 'state/initial-state';
import { isDevMode } from 'state/connection';

const AtAGlance = React.createClass( {
	render() {
		let securityHeader =
				<DashSectionHeader
					label={ __( 'Security' ) }
					settingsPath="#security"
					externalLink={
						this.props.isDevMode
						? ''
						: __( 'Manage security on WordPress.com' )
					}
					externalLinkPath={ this.props.isDevMode
						? ''
						: 'https://wordpress.com/settings/security/' + this.props.siteRawUrl
					}
					externalLinkClick={ () => analytics.tracks.recordEvent( 'jetpack_wpa_aag_security_wpcom_click', {} ) }
				/>,
			performanceHeader =
				<DashSectionHeader
					label={ __( 'Performance' ) }
				/>;

		// If user can manage modules, we're in an admin view, otherwise it's a non-admin view.
		if ( this.props.userCanManageModules ) {
			return (
				<div className="jp-at-a-glance">
					<QuerySitePlugins />
					<QuerySite />
					<DashStats { ...this.props } />
					<FeedbackDashRequest { ...this.props } />

					{
						// Site Security
						securityHeader
					}
					<div className="jp-at-a-glance__item-grid">
						<div className="jp-at-a-glance__left">
							<DashProtect { ...this.props } />
						</div>
						<div className="jp-at-a-glance__right">
							<DashScan { ...this.props } />
						</div>
					</div>
					<div className="jp-at-a-glance__item-grid">
						<div className="jp-at-a-glance__left">
							<DashBackups { ...this.props } />
						</div>
						<div className="jp-at-a-glance__right">
							<DashMonitor { ...this.props } />
						</div>
					</div>
					<div className="jp-at-a-glance__item-grid">
						<div className="jp-at-a-glance__left">
							<DashAkismet { ...this.props } />
						</div>
						<div className="jp-at-a-glance__right">
							<DashPluginUpdates { ...this.props } />
						</div>
					</div>

					{
						// Performance
						performanceHeader
					}
					<div className="jp-at-a-glance__item-grid">
						<div className="jp-at-a-glance__left">
							<DashPhoton { ...this.props } />
						</div>
					</div>
				</div>
			);
		} else {
			let stats = '';
			if ( this.props.userCanViewStats ) {
				stats = <DashStats { ...this.props } />;
			}

			let protect = '';
			if ( this.props.isModuleActivated( 'protect' ) ) {
				protect = <DashProtect { ...this.props } />;
			}

			let nonAdminAAG = '';
			if ( '' !== stats || '' !== protect ) {
				nonAdminAAG = (
					<div>
						{ stats	}
						{
							// Site Security
							securityHeader
						}
						{ protect }
					</div>
				);
			}

			return nonAdminAAG;
		}
	} // render
} );

export default connect(
	( state ) => {
		return {
			isModuleActivated: ( module_name ) => _isModuleActivated( state, module_name ),
			userCanManageModules: userCanManageModules( state ),
			userCanViewStats: userCanViewStats( state ),
			isDevMode: isDevMode( state )
		};
	}
)( AtAGlance );
