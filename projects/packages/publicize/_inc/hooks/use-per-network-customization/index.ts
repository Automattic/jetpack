import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useCallback, useMemo } from '@wordpress/element';
import { store as socialStore } from '../../social-store';
import { AttachedMedia } from '../../utils';
import useFeaturedImage from '../use-featured-image';
import useMediaDetails from '../use-media-details';
import { usePostMeta } from '../use-post-meta';

const TOGGLE_KEY = '_wpas_customize_per_network';

/**
 * Hook to manage per network customization toggle state.
 *
 * @return - An object containing isEnabled boolean and toggle function.
 */
export function usePerNetworkCustomization() {
	const postMeta = usePostMeta();

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

		return Boolean( meta?.[ TOGGLE_KEY ] );
	}, [] );

	const syncConnections = useCallback( () => {
		// Copy global settings to each connection.
		// Per-network mode forces attachment, so we need to populate attached_media for all sources.
		connections.forEach( connection => {
			// Only copy if no existing customization.
			if ( connection.message === undefined ) {
				// Determine the effective media source (detect featured image fallback if undefined)
				let effectiveSource = postMeta.mediaSource;
				if ( effectiveSource === undefined && featuredImageId ) {
					effectiveSource = 'featured-image';
				}

				// Determine attached_media based on source
				// Per-network mode forces attachment, so we need to populate for all sources
				let attachedMedia: Array< AttachedMedia > | undefined;
				switch ( effectiveSource ) {
					case 'media-library':
					case 'upload-video':
						attachedMedia = postMeta.attachedMedia;
						break;
					case 'featured-image':
						if ( featuredImageId && featuredImageUrl ) {
							attachedMedia = [
								{ id: featuredImageId, url: featuredImageUrl, type: featuredImageMime },
							];
						}
						break;
					case 'sig':
						// For SIG, use the global attached media (contains SIG URL)
						attachedMedia = postMeta.attachedMedia;
						break;
					default:
						attachedMedia = undefined;
				}

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

		// Update post metadata.
		editPost( {
			meta: {
				[ TOGGLE_KEY ]: isNowEnabled,
			},
		} );

		if ( isNowEnabled ) {
			syncConnections();
		}
	}, [ isEnabled, editPost, syncConnections ] );

	return useMemo(
		() => ( {
			isEnabled,
			toggle,
		} ),
		[ isEnabled, toggle ]
	);
}
