
import React from 'react';
import Card from 'components/card';
import SectionHeader from 'components/section-header';
import DashItem from 'components/dash-item';

export const Page = props =>
	<div>
		<h1>Site Statistics</h1>
		<Card>
			Hello There! Your site stats have been activated.<br />
			Just give us a little time to collect data so we can display it for you here!
		</Card>

		<h1>Site Security</h1>
		<DashItem label="Protect" status="is-info">
			Sit back and relax. Protect is on and actively blocking malicious login attempts. Data will display here soon.
		</DashItem>
		<DashItem label="Security Scan">
			To automatically scan your site for malicious files, please <a href=""> upgrade your account</a>.
		</DashItem>
		<DashItem label="Site Monitoring">
			<a href="">Activate Monitor</a> to receive email notifications if your site goes down.
		</DashItem>

		<h1>Site Health</h1>

		<DashItem label="Anti-spam (Akismet)">
			<a href="">Install and Activate Akismet</a> { 'to automaticallly block spam comments. It\'s free!.' }
		</DashItem>
		<DashItem label="Site Backups">
			To automatically scan your site for malicious files, please <a href=""> upgrade your account</a>.
		</DashItem>
		<DashItem label="Plugin Updates">
			All plugins are up-to-date. Keep up the good work!
		</DashItem>

		<h1>Traffic Tools</h1>
		<DashItem label="Image Performance">
			Photon is active and enhancing image performance automaticallye, behind the scenes. <a href=""> Learn more</a>.
		</DashItem>
		<DashItem label="Site Verification">
			<a href="">Activate Site Verification</a> to verify your site and increase ranking with Google, Bing, and Pinterest.
		</DashItem>
		<Card>
			What would you like to see on your Jetpack Dashboard. <a href="#">Send us some feedback and let us know!</a>
		</Card>
	</div>
