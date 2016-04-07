/**
 * External dependencies
 */
import React from 'react';
import Card from 'components/card';

export const Page = ( props ) =>
	<div>
		<Card>
			<h2>Protect</h2>
			<p>
				Protect your site against malicious login attempts.
			</p>
		</Card>
		<Card>
			<h2>Downtime Monitoring</h2>
			<p>
				Receive alerts if your site goes down.
			</p>
		</Card>
		<Card>
			<h2>Security Scanning <small>ADD-ON</small></h2>
			<p>
				Automatically scan your site for ommon threats and attacks.
			</p>
		</Card>
		<Card>
			<h2>Single Sign On</h2>
			<p>
				Securely log into all your sites with the same account.
			</p>
		</Card>

	</div>
