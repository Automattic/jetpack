import { useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useCallback } from '@wordpress/element';
import { getAttachedMedia, getJetpackSocialOptions, shouldUploadAttachedMedia } from '../../utils';

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

	const updateJetpackSocialOptions = useCallback(
		( key, value ) => {
			editPost( {
				meta: {
					jetpack_social_options: { ...getJetpackSocialOptions(), [ key ]: value },
				},
			} );
		},
		[ editPost ]
	);

	return {
		attachedMedia: getAttachedMedia(),
		shouldUploadAttachedMedia: shouldUploadAttachedMedia(),
		updateAttachedMedia: media => updateJetpackSocialOptions( 'attached_media', media ),
		updateShouldUploadAttachedMedia: option =>
			updateJetpackSocialOptions( 'should_upload_attached_media', option ),
	};
}
