/**
 * External dependencies
 */
import React from 'react';
import FoldableCard from 'components/foldable-card';
import FormToggle from 'components/form/form-toggle';

export const Page = ( props ) =>
	<div>
		<FoldableCard
			header="Protect"
			subheader="Protect your site against malicious login attempts."
			summary={ <FormToggle /> }
			expandedSummary={ <FormToggle /> } >
			settings
		</FoldableCard>
		<FoldableCard
			header="Downtime Monitoring"
			subheader="Receive alerts if your site goes down."
			summary={ <FormToggle /> }
			expandedSummary={ <FormToggle /> } >
			settings
		</FoldableCard>
		<FoldableCard
			header="Security Scanning"
			subheader="Automatically scan your site for ommon threats and attacks."
			summary={ <FormToggle /> }
			expandedSummary={ <FormToggle /> } >
			settings
		</FoldableCard>
		<FoldableCard
			header="Single Sign On"
			subheader="Securely log into all your sites with the same account."
			summary={ <FormToggle /> }
			expandedSummary={ <FormToggle /> } >
			settings
		</FoldableCard>

	</div>
