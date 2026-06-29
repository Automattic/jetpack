import { siteHasFeature } from '@automattic/jetpack-script-data';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useCallback, useMemo } from '@wordpress/element';
import { store as socialStore } from '../../social-store';
import { CUSTOMIZE_PER_NETWORK_KEY } from '../../social-store/constants';
import { features, hasSocialPaidFeatures } from '../../utils';
import useFeaturedImage from '../use-featured-image';
import useMediaDetails from '../use-media-details';
import { usePostMeta } from '../use-post-meta';
import { computeAttachedMediaForSource, getEffectiveMediaSource } from './utils';

/**
 * Hook to manage per network customization toggle state.
 *
 * @return - An object containing isEnabled boolean and toggle function.
 */
export function usePerNetworkCustomization() {
	const postMeta = usePostMeta();
	const { recordEvent } = useAnalytics();

	const { editPost } = useDispatch( editorStore );
	const { customizeConnectionById } = useDispatch( socialStore );
	const connections = useSelect( select => select( socialStore ).getConnections(), [] );

	// Get featured image details for syncing to connections
	const featuredImageId = useFeaturedImage();
	const [ featuredImageDetails ] = useMediaDetails( featuredImageId );
	const featuredImageUrl = featuredImageDetails?.mediaData?.sourceUrl;
	const featuredImageMime = featuredImageDetails?.metaData?.mime ?? 'image/jpeg';

	const isEnabled = useSelect( select => {
		const meta = select( editorStore ).getEditedPostAttribute( 'meta' );

		return Boolean( meta?.[ CUSTOMIZE_PER_NETWORK_KEY ] );
	}, [] );

	const syncConnections = useCallback( () => {
		/*
		 * Don't sync when the message-templates feature is on. Server-side defaults
		 */
		if ( siteHasFeature( features.MESSAGE_TEMPLATES ) ) {
			return;
		}

		// Copy global settings to each connection.
		// Per-network mode forces attachment, so we need to populate attached_media for all sources.
		connections.forEach( connection => {
			// Only copy if no existing customization.
			if ( connection.message === undefined ) {
				const effectiveSource = getEffectiveMediaSource( postMeta.mediaSource, featuredImageId );
				const attachedMedia = computeAttachedMediaForSource( {
					mediaSource: postMeta.mediaSource,
					globalAttachedMedia: postMeta.attachedMedia,
					featuredImageId,
					featuredImageUrl,
					featuredImageMime,
				} );

				customizeConnectionById( connection.connection_id, {
					message: postMeta.shareMessage || '',
					attached_media: attachedMedia,
					media_source: effectiveSource,
				} );
			}
		} );
	}, [
		connections,
		customizeConnectionById,
		postMeta,
		featuredImageId,
		featuredImageUrl,
		featuredImageMime,
	] );

	const toggle = useCallback( () => {
		const isNowEnabled = ! isEnabled;

		recordEvent( 'jetpack_social_per_network_customization_toggled', {
			enabled: isNowEnabled,
		} );

		// Update post metadata.
		editPost( {
			meta: {
				[ CUSTOMIZE_PER_NETWORK_KEY ]: isNowEnabled,
			},
		} );

		if ( isNowEnabled ) {
			syncConnections();
		}
	}, [ isEnabled, recordEvent, editPost, syncConnections ] );

	return useMemo(
		() => ( {
			isEnabled: isEnabled && hasSocialPaidFeatures(),
			toggle,
		} ),
		[ isEnabled, toggle ]
	);
}
