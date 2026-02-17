import { siteHasFeature } from '@automattic/jetpack-script-data';
import { useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { store as socialStore } from '../../social-store';
import { features, getSocialScriptData } from '../../utils';
import useSocialMediaConnections from '../use-social-media-connections';
import useSocialMediaMessage from '../use-social-media-message';

type SharePostOptions = {
	connectionsToSkip?: Array< string >;
};

/**
 * Hook to share a post to social media connections.
 *
 * @return The callback to share the post.
 */
export function useSharePost() {
	// Sharing data.
	const { message } = useSocialMediaMessage();
	const { skippedConnections } = useSocialMediaConnections();

	const { shareCurrentPost } = useDispatch( socialStore );

	return useCallback(
		async ( { connectionsToSkip }: SharePostOptions = {} ) => {
			const skipped_connections = connectionsToSkip || skippedConnections;

			/**
			 * The share endpoint only gets the custom message as a parameter, the attached media and
			 * SIG is saved to the post meta and will be read on wpcom. Because of that we need to save
			 * the post before sharing it, if it has the media features to make sure we use the latest data.
			 */
			const savePost =
				siteHasFeature( features.IMAGE_GENERATOR ) ||
				siteHasFeature( features.ENHANCED_PUBLISHING );

			return await shareCurrentPost(
				{ message, skipped_connections },
				{ savePost, apiPath: getSocialScriptData().api_paths.resharePost }
			);
		},
		[ message, shareCurrentPost, skippedConnections ]
	);
}
