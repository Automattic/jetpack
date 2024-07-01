import { usePostMeta } from '../use-post-meta';

/**
 * @typedef {object} AttachedMediaHook
 * @property {Array} attachedMedia - List of media with ID, URL, and metadata.
 * @property {Function} updateAttachedMedia - Callback used to update the attached media.
 */

/**
 * Hook to handle storing the attached media, choosing whether it is a social post.
 *
 * @returns {AttachedMediaHook} - An object with the attached media hook properties set.
 */
export default function useAttachedMedia() {
	const { attachedMedia, updateJetpackSocialOptions } = usePostMeta();

	return {
		attachedMedia,
		updateAttachedMedia: media => updateJetpackSocialOptions( 'attached_media', media ),
	};
}
