import { getRedirectUrl } from '@automattic/jetpack-components';
import {
	ReviewPrompt,
	usePostStartedPublishing,
	usePublicizeConfig,
	useSocialMediaConnections,
} from '@automattic/jetpack-publicize-components';
import { getJetpackData } from '@automattic/jetpack-shared-extension-utils';
import apiFetch from '@wordpress/api-fetch';
import { PluginPostPublishPanel } from '@wordpress/edit-post';
import { PostTypeSupportCheck } from '@wordpress/editor';
import { useCallback, useState } from '@wordpress/element';
import { registerPlugin } from '@wordpress/plugins';

registerPlugin( 'jetpack-social-review-prompt', {
	render: () => <JetpackSocialReviewPrompt />,
} );

const JetpackSocialReviewPrompt = () => {
	const [ isReviewRequestDismissed, setIsReviewRequestDismissed ] = useState(
		getJetpackData()?.socialReview?.reviewRequestDismissed ?? true
	);
	const [ shouldReviewRequestShow, setShouldReviewRequestShow ] = useState( false );

	const { hasEnabledConnections } = useSocialMediaConnections();
	const { isPublicizeEnabled, isPostAlreadyShared } = usePublicizeConfig();
	// Determine if the review request should show right before the post publishes
	// The publicize-enabled meta and related connections are disabled after publishing
	usePostStartedPublishing( () => {
		setShouldReviewRequestShow(
			! isPostAlreadyShared && isPublicizeEnabled && hasEnabledConnections
		);
	}, [ isPostAlreadyShared, hasEnabledConnections, isPublicizeEnabled ] );

	// Handle when the review request is dismissed
	const handleReviewDismiss = useCallback( () => {
		const reviewRequestDismissUpdatePath =
			getJetpackData()?.socialReview?.dismissReviewRequestPath ?? null;
		// Save that the user has dismissed this by calling to the social plugin API method
		apiFetch( {
			path: reviewRequestDismissUpdatePath,
			method: 'POST',
			data: { dismissed: true },
		} ).catch( error => {
			throw error;
		} );

		setIsReviewRequestDismissed( true );
	}, [] );

	return (
		<PostTypeSupportCheck supportKeys="publicize">
			{ ! isReviewRequestDismissed && shouldReviewRequestShow && (
				<PluginPostPublishPanel id="publicize-title">
					<ReviewPrompt
						href={ getRedirectUrl( 'jetpack-social-plugin-reviews' ) }
						onClose={ handleReviewDismiss }
					/>
				</PluginPostPublishPanel>
			) }
		</PostTypeSupportCheck>
	);
};
