/**
 * External dependencies
 */
import React from 'react';
import Card from 'components/card';
import DashSectionHeader from 'components/dash-section-header';

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
import DashSiteVerify from './site-verification';
import FeedbackDashRequest from 'components/jetpack-notices/feedback-dash-request';
import { translate as __ } from 'i18n-calypso';

export default ( props ) => {

	let securityHeader =
			<DashSectionHeader
			label={ __( 'Site Security' ) }
			settingsPath="#security"
			externalLink={ __( 'Manage Security on WordPress.com' ) }
			externalLinkPath={ 'https://wordpress.com/settings/security/' + window.Initial_State.rawUrl } />,
		healthHeader =
			<DashSectionHeader
				label={ __( 'Site Health' ) }
				settingsPath="#health" />,
		trafficHeader =
			<DashSectionHeader
				label={ __( 'Traffic Tools' ) }
				settingsPath="#engagement" />;

	// If user can manage modules, we're in an admin view, otherwise it's a non-admin view.
	if ( window.Initial_State.userData.currentUser.permissions.manage_modules ) {
		return (
			<div>
				<DashStats { ...props } />

				{
					// Site Security

					securityHeader
				}
				<div className="jp-at-a-glance__item-grid">
					<div className="jp-at-a-glance__left">
						<DashProtect { ...props } />
					</div>
					<div className="jp-at-a-glance__right">
						<DashScan { ...props } />
						<DashMonitor { ...props } />
					</div>
				</div>

				{
					// Site Health

					healthHeader
				}
				<div className="jp-at-a-glance__item-grid">
						<div className="jp-at-a-glance__left">
							<DashAkismet { ...props } />
						</div>
						<div className="jp-at-a-glance__right">
							<DashBackups { ...props } />
							<DashPluginUpdates { ...props } />
						</div>
				</div>

				{
					// Traffic Tools

					trafficHeader
				}
				<div className="jp-at-a-glance__item-grid">
						<div className="jp-at-a-glance__left">
							<DashPhoton { ...props } />
						</div>
						<div className="jp-at-a-glance__right">
							<DashSiteVerify { ...props } />
						</div>
				</div>

				<FeedbackDashRequest { ...props } />
			</div>
		);
	} else {
		return (
			<div>
				<DashStats { ...props } />

				{
					// Site Security

					securityHeader
				}
				<DashProtect { ...props } />
			</div>
		);
	}
};