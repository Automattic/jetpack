/**
 * External dependencies
 */
import React from 'react';
import FoldableCard from 'components/foldable-card';

export const Page = ( props ) =>
	<div>
		<FoldableCard
			header="Site Stats"
			subheader="Manage how your statistics are displayed" >
			settings
		</FoldableCard>
		<FoldableCard
			header="Sharing & Likes"
			subheader="Display social sharing & a like button on your site." >
			settings
		</FoldableCard>
		<FoldableCard
			header="Enhanced Distribution"
			subheader="Instantly share your content with search engines and more." >
			settings
		</FoldableCard>
		<FoldableCard
			header="Related Posts"
			subheader="Display your related posts underneath each post." >
			settings
		</FoldableCard>
		<FoldableCard
			header="Publicize"
			subheader="Automatically share content on your social media accounts." >
			settings
		</FoldableCard>
		<FoldableCard
			header="Site Verification"
			subheader="Verify your site with Google, Bing, and more." >
			settings
		</FoldableCard>
		<FoldableCard
			header="Subscriptions"
			subheader="Allow users to subscribe to your content." >
			settings
		</FoldableCard>
		<FoldableCard
			header="Comments"
			subheader="Allow users to comment with Facebook, Twitter, or WordPress.com." >
			settings
		</FoldableCard>
		<FoldableCard
			header="Notifications"
			subheader="Receive notifications of activity on your site on your mobile device." >
			settings
		</FoldableCard>
	</div>
