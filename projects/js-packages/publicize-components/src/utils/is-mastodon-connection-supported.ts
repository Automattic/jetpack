import { getJetpackData } from '@automattic/jetpack-shared-extension-utils';

/**
 * Checks if the Mastodon connection is supported.
 *
 * @returns {boolean} Whether the Mastodon connection is supported
 */
export function isMastodonConnectionSupported() {
	return !! getJetpackData()?.social?.isMastodonConnectionSupported;
}
