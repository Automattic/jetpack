import { getRedirectUrl } from '@automattic/jetpack-components';
import { getJetpackData } from '@automattic/jetpack-shared-extension-utils';
import apiFetch from '@wordpress/api-fetch';
import { PluginPostPublishPanel } from '@wordpress/edit-post';
import { useCallback, useState } from '@wordpress/element';
import usePublicizeConfig from '../../hooks/use-publicize-config';
import { usePostStartedPublishing } from '../../hooks/use-saving-post';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import ReviewPrompt from '../review-prompt';

const PostPublishReviewPropmpt = () => {
	const [ isReviewRequestDismissed, setIsReviewRequestDismissed ] = useState(
		getJetpackData()?.social?.reviewRequestDismissed ?? true
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
			getJetpackData()?.social?.dismissReviewRequestPath ?? null;
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

	if ( isReviewRequestDismissed || ! shouldReviewRequestShow ) {
		return null;
	}

	return (
		<PluginPostPublishPanel id="publicize-title">
			<ReviewPrompt
				href={ getRedirectUrl( 'jetpack-social-plugin-reviews' ) }
				onClose={ handleReviewDismiss }
			/>
		</PluginPostPublishPanel>
	);
};

export default PostPublishReviewPropmpt;
