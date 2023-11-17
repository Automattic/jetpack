import { getJetpackSocialOptions } from './get-jetpack-social-options';

/**
 * Checks if the post is a social post.
 *
 * @returns {boolean} Whether the post is a social post.
 */
export function shouldUploadAttachedMedia() {
	return getJetpackSocialOptions().should_upload_attached_media ?? false;
}
