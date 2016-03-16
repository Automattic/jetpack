
import React from 'react';
import Card from 'components/Card';

export const Page = props =>
	<div>
		<h1>Site Statistics</h1>
		<Card>
			Hello There! Your site stats have been activated.<br />
			Just give us a little time to collect data so we can display it for you here!
		</Card>
		<h1>Site Security</h1>
		<Card title="Protect">
			<p>
				Sit back and relax. Protect is on and actively blocking malicious
				login attempts. Data will display here soon.
			</p>
		</Card>
		<Card title="Security Scan">
			<p>
				To automatically scan your site for malicious files, please <a href=""> upgrade your account</a>.
			</p>
		</Card>
		<Card title="Site Monitoring">
			<p>
				<a href="">Activate Monitor</a> to receive email notifications if your site goes down.
			</p>
		</Card>
		<h1>Site Health</h1>
		<Card title="Anti-spam (Akismet)">
			<p>
				<a href="">Install and Activate Akismet</a> { 'to automaticallly block spam comments. It\'s free!.' }
			</p>
		</Card>
		<Card title="Site Backups">
			<p>
				To automatically scan your site for malicious files, please <a href=""> upgrade your account</a>.
			</p>
		</Card>
		<Card title="Plugin Updates">
			<p>
				All plugins are up-to-date. Keep up the good work!
			</p>
		</Card>
		<h1>Traffic Tools</h1>
		<Card title="Image Performance">
			<p>
				Photon is active and enhancing image performance automaticallye, behind the scenes. <a href=""> Learn more</a>.
			</p>
		</Card>
		<Card title="Site Verification">
			<p>
				<a href="">Activate Site Verification</a> to verify your site and increase ranking with Google, Bing, and Pinterest.
			</p>
		</Card>
		<Card>
			What would you like to see on your Jetpack Dashboard. <a href="#">Send us some feedback and let us know!</a>
		</Card>
	</div>
