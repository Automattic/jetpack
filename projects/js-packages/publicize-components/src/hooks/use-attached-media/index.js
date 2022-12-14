import { useSelect, useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useCallback } from '@wordpress/element';

/**
 * @typedef {Object} AttachedMediaHook
 * @property {Array} attachedMedia - List of media IDs.
 * @property {Function} updateAttachedMedia - Callback used to update the attached media..
 */

/**
 * Hook to handle storing the attached media.
 *
 * @returns {AttachedMediaHook} - An object with the attached media hook properties set.
 */
export default function useAttachedMedia() {
	const { editPost } = useDispatch( editorStore );

	const attachedMedia = useSelect( select => select( 'jetpack/publicize' ).getAttachedMedia() );
	const currentOptions = useSelect( select =>
		select( 'jetpack/publicize' ).getJetpackSocialOptions()
	);

	const updateAttachedMedia = useCallback(
		ids => {
			editPost( {
				meta: {
					jetpack_social_options: { ...currentOptions, attached_media: ids },
				},
			} );
		},
		[ currentOptions, editPost ]
	);

	return {
		attachedMedia,
		updateAttachedMedia,
	};
}
