/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import FoldableCard from 'components/foldable-card';
import FormToggle from 'components/form/form-toggle';

/**
 * Internal dependencies
 */
import { isModuleActivated as _isModuleActivated, activateModule, deactivateModule } from 'state/modules';

export const Page = ( { toggleModule, isModuleActivated } ) => (
	<div>
		<FoldableCard
			header="Site Stats"
			subheader="Manage how your statistics are displayed"
			summary={
				<FormToggle checked={ isModuleActivated( 'stats' ) }
					onChange={ toggleModule.bind( null, 'stats', isModuleActivated( 'stats' ) ) } />
			}
			expandedSummary={
				<FormToggle checked={ isModuleActivated( 'stats' ) }
					onChange={ toggleModule.bind( null, 'stats', isModuleActivated( 'stats' ) ) } />
			} >
				settings
		</FoldableCard>
		<FoldableCard
			header="Sharing & Likes"
			subheader="Display social sharing & a like button on your site."
			summary={
				<FormToggle checked={ isModuleActivated( 'sharedaddy' ) }
					onChange={ toggleModule.bind( null, 'sharedaddy', isModuleActivated( 'sharedaddy' ) ) } />
			}
			expandedSummary={
				<FormToggle checked={ isModuleActivated( 'sharedaddy' ) }
					onChange={ toggleModule.bind( null, 'sharedaddy', isModuleActivated( 'sharedaddy' ) ) } />
			} >
				settings
		</FoldableCard>
		<FoldableCard
			header="Enhanced Distribution"
			subheader="Instantly share your content with search engines and more."
			summary={
				<FormToggle checked={ isModuleActivated( 'enhanced-distribution' ) }
					onChange={ toggleModule.bind( null, 'enhanced-distribution', isModuleActivated( 'enhanced-distribution' ) ) } />
			}
			expandedSummary={
				<FormToggle checked={ isModuleActivated( 'enhanced-distribution' ) }
					onChange={ toggleModule.bind( null, 'enhanced-distribution', isModuleActivated( 'enhanced-distribution' ) ) } />
			} >
				settings
		</FoldableCard>
		<FoldableCard
			header="Related Posts"
			subheader="Display your related posts underneath each post."
			summary={
				<FormToggle checked={ isModuleActivated( 'related-posts' ) }
					onChange={ toggleModule.bind( null, 'related-posts', isModuleActivated( 'related-posts' ) ) } />
			}
			expandedSummary={
				<FormToggle checked={ isModuleActivated( 'related-posts' ) }
					onChange={ toggleModule.bind( null, 'related-posts', isModuleActivated( 'related-posts' ) ) } />
			} >
				settings
		</FoldableCard>
		<FoldableCard
			header="Publicize"
			subheader="Automatically share content on your social media accounts."
			summary={
				<FormToggle checked={ isModuleActivated( 'publicize' ) }
					onChange={ toggleModule.bind( null, 'publicize', isModuleActivated( 'publicize' ) ) } />
			}
			expandedSummary={
				<FormToggle checked={ isModuleActivated( 'publicize' ) }
					onChange={ toggleModule.bind( null, 'publicize', isModuleActivated( 'publicize' ) ) } />
			} >
				settings
		</FoldableCard>
		<FoldableCard
			header="Site Verification"
			subheader="Verify your site with Google, Bing, and more."
			summary={
				<FormToggle checked={ isModuleActivated( 'verification-tools' ) }
					onChange={ toggleModule.bind( null, 'verification-tools', isModuleActivated( 'verification-tools' ) ) } />
			}
			expandedSummary={
				<FormToggle checked={ isModuleActivated( 'verification-tools' ) }
					onChange={ toggleModule.bind( null, 'verification-tools', isModuleActivated( 'verification-tools' ) ) } />
			} >
				settings
		</FoldableCard>
		<FoldableCard
			header="Subscriptions"
			subheader="Allow users to subscribe to your content."
			summary={
				<FormToggle checked={ isModuleActivated( 'subscriptions' ) }
					onChange={ toggleModule.bind( null, 'subscriptions', isModuleActivated( 'subscriptions' ) ) } />
			}
			expandedSummary={
				<FormToggle checked={ isModuleActivated( 'subscriptions' ) }
					onChange={ toggleModule.bind( null, 'subscriptions', isModuleActivated( 'subscriptions' ) ) } />
			} >
				settings
		</FoldableCard>
		<FoldableCard
			header="Comments"
			subheader="Allow users to comment with Facebook, Twitter, or WordPress.com."
			summary={
				<FormToggle checked={ isModuleActivated( 'comments' ) }
					onChange={ toggleModule.bind( null, 'comments', isModuleActivated( 'comments' ) ) } />
			}
			expandedSummary={
				<FormToggle checked={ isModuleActivated( 'comments' ) }
					onChange={ toggleModule.bind( null, 'comments', isModuleActivated( 'comments' ) ) } />
			} >
				settings
		</FoldableCard>
		<FoldableCard
			header="Notifications"
			subheader="Receive notifications of activity on your site on your mobile device."
			summary={
				<FormToggle checked={ isModuleActivated( 'minileven' ) }
					onChange={ toggleModule.bind( null, 'minileven', isModuleActivated( 'minileven' ) ) } />
			}
			expandedSummary={
				<FormToggle checked={ isModuleActivated( 'minileven' ) }
					onChange={ toggleModule.bind( null, 'minileven', isModuleActivated( 'minileven' ) ) } />
			} >
				settings
		</FoldableCard>
	</div>
)

export default connect(
	( state ) => {
		return {
			isModuleActivated: ( module_name ) => _isModuleActivated( state, module_name )
		};
	},
	( dispatch ) => {
		return {
			toggleModule: ( module_name, activated ) => {
				if ( activated ) {
					return dispatch( deactivateModule( module_name ) );
				} else {
					return dispatch( activateModule( module_name ) );
				}
			}
		};
	}
)( Page );
