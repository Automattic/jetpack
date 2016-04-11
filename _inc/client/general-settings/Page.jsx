/**
 * External dependencies
 */
import React from 'react';
import FoldableCard from 'components/foldable-card';
import FormToggle from 'components/form/form-toggle';

export const Page = ( props ) =>
	<div>
		<FoldableCard
			header="Jetpack Add-ons"
			subheader="Manage your Jetpack account and premium add-ons."
			summary={ <FormToggle /> }
			expandedSummary={ <FormToggle /> } >
			settings
		</FoldableCard>
		<FoldableCard
			header="Jetpack Connection Settings"
			subheader="Manage your connected user accounts or disconnect."
			summary={ <FormToggle /> }
			expandedSummary={ <FormToggle /> } >
			settings
		</FoldableCard>
		<FoldableCard
			header="Miscellaneous Settings"
			subheader="Manage Snow and other fun things for your site."
			summary={ <FormToggle /> }
			expandedSummary={ <FormToggle /> } >
			settings
		</FoldableCard>
		<FoldableCard
			header="Summary Report Settings"
			subheader="Manage how Jetpack informs you about your site."
			summary={ <FormToggle /> }
			expandedSummary={ <FormToggle /> } >
			settings
		</FoldableCard>
		<FoldableCard
			header="Import Jetpack Feature Configuration"
			subheader="Import your Jetpack setup from another intsallation."
			summary={ <FormToggle /> }
			expandedSummary={ <FormToggle /> } >
			settings
		</FoldableCard>
		<FoldableCard
			header="Widget Settings"
			subheader="Configure your WordPress admin dashboard widget."
			summary={ <FormToggle /> }
			expandedSummary={ <FormToggle /> } >
			settings
		</FoldableCard>

	</div>
