/**
 * External dependencies
 */
import React from 'react';
import Card from 'components/card';
import SectionHeader from 'components/section-header';
import DashItem from 'components/dash-item';
import DashSectionHeader from 'components/dash-section-header';
import ExpandedCard from 'components/expanded-card';

/**
 * Internal dependencies
 */
import DashStats from './stats';
import DashProtect from './protect';
import DashMonitor from './monitor';
import DashScan from './scan';
import DashAkismet from './akismet';
import DashBackups from './backups';

export default ( props ) =>
	<div>
		<DashSectionHeader
			label="Site Statistics"
			settingsPath="#engagement" />
		<Card>
			<DashStats { ...props } />
		</Card>

		<DashSectionHeader
			label="Site Security"
			settingsPath="#security"
			externalLink="Manage Security on WordPress.com"
			externalLinkPath={ 'https://wordpress.com/settings/security/' + window.Initial_State.rawUrl } />
		<DashProtect { ...props } />
		<DashScan { ...props } />
		<DashMonitor { ...props } />
		<DashSectionHeader
			label="Site Health"
			settingsPath="#health" />
		<DashAkismet { ...props } />
		<DashBackups { ...props } />
		<DashItem label="Plugin Updates">
			All plugins are up-to-date. Keep up the good work!
		</DashItem>

		<DashSectionHeader
			label="Traffic Tools"
			settingsPath="#engagement" />
		<DashItem label="Image Performance" status="is-working">
			Photon is active and enhancing image performance automaticallye, behind the scenes. <a href=""> Learn more</a>.
		</DashItem>
		<DashItem label="Site Verification">
			<a href="">Activate Site Verification</a> to verify your site and increase ranking with Google, Bing, and Pinterest.
		</DashItem>
		<Card>
			What would you like to see on your Jetpack Dashboard. <a href="#">Send us some feedback and let us know!</a>
		</Card>
	</div>
