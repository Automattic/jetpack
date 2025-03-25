import { getRedirectUrl } from '@automattic/jetpack-components';
import apiFetch from '@wordpress/api-fetch';
import { PluginPostPublishPanel } from '@wordpress/editor';
import { useCallback, useState } from '@wordpress/element';
import usePublicizeConfig from '../../hooks/use-publicize-config';
import { usePostStartedPublishing } from '../../hooks/use-saving-post';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import { getSocialScriptData } from '../../utils';
import ReviewPrompt from '../review-prompt';

const PostPublishReviewPrompt = () => {
	const { review } = getSocialScriptData();
	const [ isReviewRequestDismissed, setIsReviewRequestDismissed ] = useState(
		review?.dismissed ?? true
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
		// Save that the user has dismissed this by calling to the social plugin API method
		apiFetch( {
			path: review?.dismiss_path,
			method: 'POST',
			data: { dismissed: true },
		} ).catch( error => {
			throw error;
		} );

		setIsReviewRequestDismissed( true );
	}, [ review?.dismiss_path ] );

	if ( isReviewRequestDismissed || ! shouldReviewRequestShow ) {
		return null;
	}

	return (
		<PluginPostPublishPanel>
			<ReviewPrompt
				href={ getRedirectUrl( 'jetpack-social-plugin-reviews' ) }
				onClose={ handleReviewDismiss }
			/>
		</PluginPostPublishPanel>
	);
};

export default PostPublishReviewPrompt;
