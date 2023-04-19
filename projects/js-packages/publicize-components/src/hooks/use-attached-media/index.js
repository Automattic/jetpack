import { useSelect, useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useCallback } from '@wordpress/element';

const PUBLICIZE_STORE = 'jetpack/publicize';

/**
 * @typedef {object} AttachedMediaHook
 * @property {Array} attachedMedia - List of media with ID, URL, and metadata.
 * @property {boolean} shouldUploadAttachedMedia - Whether the post is a social post and we upload the media.
 * @property {Function} updateAttachedMedia - Callback used to update the attached media.
 * @property {Function} updateShouldUploadAttachedMedia - Callback used to update the shouldUploadAttachedMedia value.
 */

/**
 * Hook to handle storing the attached media, choosing whether it is a social post.
 *
 * @returns {AttachedMediaHook} - An object with the attached media hook properties set.
 */
export default function useAttachedMedia() {
	const { editPost } = useDispatch( editorStore );

	const { shouldUploadAttachedMedia, attachedMedia, currentOptions } = useSelect( select => ( {
		shouldUploadAttachedMedia: select( PUBLICIZE_STORE ).shouldUploadAttachedMedia(),
		attachedMedia: select( PUBLICIZE_STORE ).getAttachedMedia(),
		currentOptions: select( PUBLICIZE_STORE ).getJetpackSocialOptions(),
	} ) );

	const updateJetpackSocialOptions = useCallback(
		( key, value ) => {
			editPost( {
				meta: {
					jetpack_social_options: { ...currentOptions, [ key ]: value },
				},
			} );
		},
		[ currentOptions, editPost ]
	);

	return {
		attachedMedia,
		shouldUploadAttachedMedia,
		updateAttachedMedia: media => updateJetpackSocialOptions( 'attached_media', media ),
		updateShouldUploadAttachedMedia: option =>
			updateJetpackSocialOptions( 'should_upload_attached_media', option ),
	};
}
