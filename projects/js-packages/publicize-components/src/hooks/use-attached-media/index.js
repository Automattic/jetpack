import { useSelect, useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useCallback } from '@wordpress/element';

/**
 * @typedef {object} AttachedMediaHook
 * @property {Array} attachedMedia - List of media with ID, URL, and metadata.
 * @property {boolean} isSocialPost - Whether the post is a social post.
 * @property {Function} updateAttachedMedia - Callback used to update the attached media.
 * @property {Function} updateIsSocialPost - Callback used to update the isSocialPost value.
 */

/**
 * Hook to handle storing the attached media, choosing whether it is a social post.
 *
 * @returns {AttachedMediaHook} - An object with the attached media hook properties set.
 */
export default function useAttachedMedia() {
	const { editPost } = useDispatch( editorStore );

	const isSocialPost = useSelect( select => select( 'jetpack/publicize' ).isSocialPost() );
	const attachedMedia = useSelect( select => select( 'jetpack/publicize' ).getAttachedMedia() );
	const currentOptions = useSelect( select =>
		select( 'jetpack/publicize' ).getJetpackSocialOptions()
	);

	const updateAttachedMedia = useCallback(
		medias => {
			editPost( {
				meta: {
					jetpack_social_options: { ...currentOptions, attached_media: medias },
				},
			} );
		},
		[ currentOptions, editPost ]
	);

	const updateIsSocialPost = useCallback(
		option => {
			editPost( {
				meta: {
					jetpack_social_options: { ...currentOptions, is_social_post: option },
				},
			} );
		},
		[ currentOptions, editPost ]
	);

	return {
		attachedMedia,
		isSocialPost,
		updateAttachedMedia,
		updateIsSocialPost,
	};
}
