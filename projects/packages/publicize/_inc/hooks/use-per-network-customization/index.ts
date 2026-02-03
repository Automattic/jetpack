import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useCallback, useMemo } from '@wordpress/element';
import { store as socialStore } from '../../social-store';
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

	const isEnabled = useSelect( select => {
		const meta = select( editorStore ).getEditedPostAttribute( 'meta' );

		return Boolean( meta?.[ TOGGLE_KEY ] );
	}, [] );

	const syncConnections = useCallback( () => {
		// Copy global settings to each connection.
		connections.forEach( connection => {
			// Only copy if no existing customization.
			if ( connection.message === undefined ) {
				customizeConnectionById( connection.connection_id, {
					message: postMeta.shareMessage || '',
					// We want to copy the attached media only if the media source is from media library or upload video.
					// For other media sources (like featured image, sig), we don't copy the attached media
					// Because those are resolved from the source directly.
					attached_media:
						postMeta.mediaSource === 'media-library' || postMeta.mediaSource === 'upload-video'
							? postMeta.attachedMedia
							: undefined,
					media_source: postMeta.mediaSource,
				} );
			}
		} );
	}, [ connections, customizeConnectionById, postMeta ] );

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
