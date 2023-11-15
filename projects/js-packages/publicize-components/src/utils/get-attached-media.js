import { getJetpackSocialOptions } from './get-jetpack-social-options';
import { AttachedMedia } from './types';

/**
 * Get a list of all attached media.
 *
 * @returns {Array<AttachedMedia>} An array of media IDs.
 */
export function getAttachedMedia() {
	return getJetpackSocialOptions().attached_media || [];
}
