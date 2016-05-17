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

export default ( props ) =>
	<div>
		<DashStats { ...props } />

		{
			// Site Security
		}

		<DashSectionHeader
			label="Site Security"
			settingsPath="#security"
			externalLink="Manage Security on WordPress.com"
			externalLinkPath={ 'https://wordpress.com/settings/security/' + window.Initial_State.rawUrl } />
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
		}

		<DashSectionHeader
			label="Site Health"
			settingsPath="#health" />

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
		}

		<DashSectionHeader
			label="Traffic Tools"
			settingsPath="#engagement" />

		<div className="jp-at-a-glance__item-grid">
				<div className="jp-at-a-glance__left">
					<DashPhoton { ...props } />
				</div>
				<div className="jp-at-a-glance__right">
					<DashSiteVerify { ...props } />
				</div>
		</div>

		<Card className="jp-dash-item__feedback-request">
			<p className="jp-dash-item__description">[make dismissable notice] What would you like to see on your Jetpack Dashboard. <a href="https://jetpack.com/contact" target="_blank">Send us some feedback and let us know!</a></p>
		</Card>
	</div>
