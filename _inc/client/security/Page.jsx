/**
 * External dependencies
 */
import React from 'react';
import FoldableCard from 'components/foldable-card';

export const Page = ( props ) =>
	<div>
		<FoldableCard
			header="Protect"
			subheader="Protect your site against malicious login attempts.">
			settings
		</FoldableCard>
		<FoldableCard
			header="Downtime Monitoring"
			subheader="Receive alerts if your site goes down.">
			settings
		</FoldableCard>
		<FoldableCard
			header="Security Scanning"
			subheader="Automatically scan your site for ommon threats and attacks.">
			settings
		</FoldableCard>
		<FoldableCard
			header="Single Sign On"
			subheader="Securely log into all your sites with the same account.">
			settings
		</FoldableCard>

	</div>
