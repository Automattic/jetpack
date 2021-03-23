/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import getJetpackData from './get-jetpack-data';

/**
 * Return whether the current blog is on the WP.com Atomic platform.
 *
 * @returns {boolean} whether the current blog is on the WP.com Atomic platform.
 */
export default function isAtomicSite() {
	return get( getJetpackData(), [ 'jetpack', 'is_atomic_site' ], false );
}
