import { usePostMeta } from '../use-post-meta';

/**
 * @typedef {object} AttachedMediaHook
 * @property {Array} attachedMedia - List of media with ID, URL, and metadata.
 * @property {import('../../utils').AttachedMedia} retrievedMedia - Retrieved media with ID, URL, and metadata.
 * @property {Function} updateAttachedMedia - Callback used to update the attached media.
 * @property {Function} updateRetrievedMedia - Callback used to update the retrieved
 */

/**
 * Hook to handle storing the attached media, choosing whether it is a social post.
 *
 * @returns {AttachedMediaHook} - An object with the attached media hook properties set.
 */
export default function useAttachedMedia() {
	const { attachedMedia, retrievedMedia, updateJetpackSocialOptions } = usePostMeta();

	return {
		attachedMedia,
		retrievedMedia,
		updateAttachedMedia: media => updateJetpackSocialOptions( 'attached_media', media ),
		updateRetrievedMedia: media => updateJetpackSocialOptions( 'retrieved_media', media ),
	};
}
