import { getJetpackData } from '@automattic/jetpack-shared-extension-utils';

/**
 * Is Jetpack in offline mode?
 *
 * @return {boolean} Whether Jetpack's offline mode is active.
 */
export default function isOfflineMode() {
	return getJetpackData()?.jetpack?.is_offline_mode ?? false;
}
