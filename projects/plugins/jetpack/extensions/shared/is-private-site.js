/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import getJetpackData from './get-jetpack-data';

/**
 * Return whether the current blog is set to private. (if blog_public option is -1)
 *
 * @returns {boolean} whether the current blog is set to private.
 */
export default function isPrivateSite() {
	return get( getJetpackData(), [ 'jetpack', 'is_private_site' ], false );
}
