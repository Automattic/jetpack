import { getJetpackData } from '@automattic/jetpack-shared-extension-utils';

/**
 * Return whether Jetpack is connected to WP.com.
 *
 * @return {boolean} Whether Jetpack is connected to WP.com
 */
export default function isActive() {
	return getJetpackData()?.jetpack?.is_active ?? false;
}
