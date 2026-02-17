import { getRedirectUrl } from '@automattic/jetpack-components';
import { JetpackEditorPanelLogo } from '@automattic/jetpack-shared-extension-utils/components';
import { PluginPostPublishPanel } from '@wordpress/editor';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import usePublicizeConfig from '../../hooks/use-publicize-config';
import { usePostStartedPublishing } from '../../hooks/use-saving-post';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import { useSocialUserPreferences } from '../../hooks/use-social-user-preferences';
import { getSocialScriptData } from '../../utils';
import ReviewPrompt from '../review-prompt';

const PostPublishReviewPrompt = () => {
	const preferences = useSocialUserPreferences();

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
		// Save the user preference to not show the prompt again
		preferences.set( 'reviewPromptDismissed', true );
	}, [ preferences ] );

	if ( preferences.data.reviewPromptDismissed || ! shouldReviewRequestShow ) {
		return null;
	}

	const pluginReviewUrl = getRedirectUrl(
		// If the social plugin is active, direct to that review page
		getSocialScriptData().plugin_info.social.version
			? 'jetpack-social-plugin-reviews'
			: // Otherwise, direct to the main Jetpack plugin review page
			  'jetpack-plugin-reviews'
	);

	return (
		<PluginPostPublishPanel
			initialOpen
			title={ __( 'Jetpack Social', 'jetpack-publicize-pkg' ) }
			icon={ <JetpackEditorPanelLogo /> }
		>
			<ReviewPrompt href={ pluginReviewUrl } onClose={ handleReviewDismiss } />
		</PluginPostPublishPanel>
	);
};

export default PostPublishReviewPrompt;
