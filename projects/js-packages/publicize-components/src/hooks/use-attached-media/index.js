import { useSelect, useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';

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

	return {
		attachedMedia,
		updateAttachedMedia: function ( ids ) {
			editPost( {
				meta: {
					jetpack_publicize_attached_media: ids,
				},
			} );
		},
	};
}
