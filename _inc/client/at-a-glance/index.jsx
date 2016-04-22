/**
 * External dependencies
 */
import React from 'react';
import Card from 'components/card';
import SectionHeader from 'components/section-header';
import DashItem from 'components/dash-item';
import DashSectionHeader from 'components/dash-section-header';
import ExpandedCard from 'components/expanded-card';

export default ( props ) =>
	<div>
		<DashSectionHeader
			label="Site Statistics"
			settingsPath="#engagement" />
		<Card>
			<DashStats />
		</Card>

		<DashSectionHeader
			label="Site Security"
			settingsPath="#security"
			externalLink="Manage Security on WordPress.com"
			externalLinkPath={ 'https://wordpress.com/settings/security/' + window.Initial_State.rawUrl } />
		<DashItem label="Protect" status="is-info">
			Sit back and relax. Protect is on and actively blocking malicious login attempts. Data will display here soon.
		</DashItem>
		<DashItem label="Security Scan" status="is-warning">
			To automatically scan your site for malicious files, please <a href=""> upgrade your account</a>.
		</DashItem>
		<DashItem label="Site Monitoring" status="is-error">
			<a href="">Activate Monitor</a> to receive email notifications if your site goes down.
		</DashItem>

		<DashSectionHeader
			label="Site Health"
			settingsPath="#health" />
		<DashItem label="Anti-spam (Akismet)" status="is-success">
			<a href="">Install and Activate Akismet</a> { 'to automaticallly block spam comments. It\'s free!.' }
		</DashItem>
		<DashItem label="Site Backups">
			To automatically scan your site for malicious files, please <a href=""> upgrade your account</a>.
		</DashItem>
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
