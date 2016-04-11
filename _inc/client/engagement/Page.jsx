/**
 * External dependencies
 */
import React from 'react';
import FoldableCard from 'components/foldable-card';
import FormToggle from 'components/form/form-toggle';

export const Page = ( props ) =>
	<div>
		<FoldableCard
			header="Site Stats"
			subheader="Manage how your statistics are displayed"
			summary={ <FormToggle /> }
			expandedSummary={ <FormToggle /> } >
			settings
		</FoldableCard>
		<FoldableCard
			header="Sharing & Likes"
			subheader="Display social sharing & a like button on your site."
			summary={ <FormToggle /> }
			expandedSummary={ <FormToggle /> } >
			settings
		</FoldableCard>
		<FoldableCard
			header="Enhanced Distribution"
			subheader="Instantly share your content with search engines and more."
			summary={ <FormToggle /> }
			expandedSummary={ <FormToggle /> } >
			settings
		</FoldableCard>
		<FoldableCard
			header="Related Posts"
			subheader="Display your related posts underneath each post."
			summary={ <FormToggle /> }
			expandedSummary={ <FormToggle /> } >
			settings
		</FoldableCard>
		<FoldableCard
			header="Publicize"
			subheader="Automatically share content on your social media accounts."
			summary={ <FormToggle /> }
			expandedSummary={ <FormToggle /> } >
			settings
		</FoldableCard>
		<FoldableCard
			header="Site Verification"
			subheader="Verify your site with Google, Bing, and more."
			summary={ <FormToggle /> }
			expandedSummary={ <FormToggle /> } >
			settings
		</FoldableCard>
		<FoldableCard
			header="Subscriptions"
			subheader="Allow users to subscribe to your content."
			summary={ <FormToggle /> }
			expandedSummary={ <FormToggle /> } >
			settings
		</FoldableCard>
		<FoldableCard
			header="Comments"
			subheader="Allow users to comment with Facebook, Twitter, or WordPress.com."
			summary={ <FormToggle /> }
			expandedSummary={ <FormToggle /> } >
			settings
		</FoldableCard>
		<FoldableCard
			header="Notifications"
			subheader="Receive notifications of activity on your site on your mobile device."
			summary={ <FormToggle /> }
			expandedSummary={ <FormToggle /> } >
			settings
		</FoldableCard>
	</div>
