/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * Returns the site activity data
 * @param  {Object} state Global state tree
 * @return {Array}        List of site activity events.
 */
export function getSiteActivity( state ) {
	return get( state.jetpack.activity, [ 'items' ], [] );
}
