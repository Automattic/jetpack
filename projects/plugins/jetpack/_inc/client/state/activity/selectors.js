/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * Returns the site activity data
 *
 * @param {object} state - Global state tree
 * @returns {Array}        List of site activity events.
 */
export function getSiteActivity( state ) {
	return get( state.jetpack.activity, [ 'items' ], [] );
}
