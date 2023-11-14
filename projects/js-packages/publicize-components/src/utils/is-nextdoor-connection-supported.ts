import { getJetpackData } from '@automattic/jetpack-shared-extension-utils';

/**
 * Checks if the Instagram connection is supported.
 *
 * @returns {boolean} Whether the Instagram connection is supported
 */
export function isNextdoorConnectionSupported() {
	return !! getJetpackData()?.social?.isNextdoorConnectionSupported;
}
